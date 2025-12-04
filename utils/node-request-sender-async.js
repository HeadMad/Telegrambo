import https from "https";
import { URL } from "url";
import RequestPayloadPrepare from "./request-payload-prepare.js";

export default createRequestSender;

function createRequestSender(token, { timeout = 30000, apiUrl = 'https://api.telegram.org' } = {}) {
  if (!token || typeof token !== 'string') 
    throw new Error('Token must be a non-empty string');

  return async function requestSender(method, payload = {}) {
    if (!method || typeof method !== 'string') 
      throw new Error('Method must be a non-empty string');

    const url = `${apiUrl}/bot${token}/${method}`;
    const payloadEntries = Object.entries(payload);
    
    const hasFiles = payloadEntries.some(([key, value]) => {
      if (isFile(value)) return true;
      if (key === 'media' && Array.isArray(value)) {
        return value.some(item => isFile(item?.media));
      }
      return false;
    });

    const request = hasFiles 
      ? buildMultipart(payloadEntries) 
      : buildJSON(RequestPayloadPrepare(payloadEntries));

    return sendRequest(url, request, timeout);
  };
}

function isFile(value) {
  if (!value || typeof value !== 'object') return false;
  return value instanceof Buffer || 
         typeof value.pipe === 'function' || 
         value.source instanceof Buffer || 
         typeof value.source?.pipe === 'function';
}

function buildJSON(payload) {
  const body = JSON.stringify(payload);
  
  return {
    body: Buffer.from(body),
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
}

function buildMultipart(payloadEntries) {
  const boundary = `----TB${Date.now()}${Math.random().toString(36).slice(2)}`;
  const eol = '\r\n';
  const parts = [];
  const files = [];
  let fileIndex = 0;

  function processValue(key, value) {
    if (isFile(value)) {
      const name = `file${fileIndex++}`;
      files.push({ name, value });
      return `attach://${name}`;
    }
    
    if (key === 'media' && Array.isArray(value)) {
      return value.map(item => {
        if (item && typeof item === 'object' && isFile(item.media)) {
          const name = `file${fileIndex++}`;
          files.push({ name, value: item.media });
          return { ...item, media: `attach://${name}` };
        }
        return item;
      });
    }
    
    return value;
  }

  function getFileMetadata(value) {
    const isDirect = value instanceof Buffer || typeof value.pipe === 'function';
    return {
      source: isDirect ? value : value.source,
      filename: isDirect ? 'file' : (value.filename || 'file'),
      contentType: isDirect ? 'application/octet-stream' : (value.contentType || 'application/octet-stream')
    };
  }

  // Обрабатываем поля
  for (const [key, value] of payloadEntries) {
    const processedValue = processValue(key, value);
    parts.push(
      `--${boundary}${eol}`,
      `Content-Disposition: form-data; name="${key}"${eol}${eol}`,
      typeof processedValue === 'object' && processedValue !== null 
        ? JSON.stringify(processedValue) 
        : String(processedValue),
      eol
    );
  }

  // Добавляем файлы
  for (const { name, value } of files) {
    const { source, filename, contentType } = getFileMetadata(value);
    parts.push(
      `--${boundary}${eol}`,
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"${eol}`,
      `Content-Type: ${contentType}${eol}${eol}`,
      source,
      eol
    );
  }

  parts.push(`--${boundary}--${eol}`);
  const body = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));

  return {
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  };
}

function sendRequest(url, { body, headers }, timeout) {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname } = new URL(url);
    
    const req = https.request({
      hostname,
      port: port || 443,
      path: pathname,
      method: 'POST',
      headers,
      timeout
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          resolve(data);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(body);
    req.end();
  });
}
