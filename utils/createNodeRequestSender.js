import https from "https";
import { URL } from "url";
import { promises as fs } from "fs";
import prepareRequestPayload from "./prepareRequestPayload.js";

export default createNodeRequestSender;

function createNodeRequestSender(token, { timeout = 30000, apiUrl = 'https://api.telegram.org' } = {}) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  return async function requestSender(method, payload = {}) {
    if (!method || typeof method !== 'string') {
      throw new Error('Method must be a non-empty string');
    }

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
      ? await buildMultipart(payloadEntries)
      : buildJSON(prepareRequestPayload(payloadEntries));

    return sendRequest(url, request, timeout);
  };
}

function isFile(value) {
  if (!value || typeof value !== 'object') return false;
  return value instanceof Buffer ||
         (typeof value.pipe === 'function' && value.path) || // Ensure it's a file stream
         value.source instanceof Buffer ||
         (typeof value.source?.pipe === 'function' && value.source.path);
}

function buildJSON(payload) {
  const body = JSON.stringify(payload);
  const buffer = Buffer.from(body);
  return {
    body: buffer,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': buffer.length,
    },
  };
}

async function getSourceInfo(source) {
  if (source instanceof Buffer) {
    return { size: source.length, stream: source };
  }
  if (typeof source.pipe === 'function' && source.path) {
    const stat = await fs.stat(source.path);
    return { size: stat.size, stream: source };
  }
  throw new Error('Invalid file source provided.');
}

async function buildMultipart(payloadEntries) {
  const boundary = `----TB${Date.now()}${Math.random().toString(36).slice(2)}`;
  const eol = '\r\n';
  const finalBoundary = `--${boundary}--${eol}`;
  
  const parts = [];
  let totalLength = 0;

  const filesToProcess = [];
  const processedPayload = {};

  // First, process payload to handle 'attach://' logic
  let fileIndex = 0;
  for (const [key, value] of payloadEntries) {
    if (isFile(value)) {
      const attachName = `file${fileIndex++}`;
      filesToProcess.push({ fieldName: attachName, file: value });
      processedPayload[key] = `attach://${attachName}`;
    } else if (key === 'media' && Array.isArray(value)) {
      processedPayload[key] = value.map(item => {
        if (item && typeof item === 'object' && isFile(item.media)) {
          const attachName = `file${fileIndex++}`;
          filesToProcess.push({ fieldName: attachName, file: item.media });
          return { ...item, media: `attach://${attachName}` };
        }
        return item;
      });
    } else {
      processedPayload[key] = value;
    }
  }
  
  // Create parts for regular fields
  for (const [key, value] of Object.entries(processedPayload)) {
    const isObject = typeof value === 'object' && value !== null;
    const str = isObject ? JSON.stringify(value) : String(value);

    let part = `--${boundary}${eol}`;
    part += `Content-Disposition: form-data; name="${key}"${eol}`;
    if (isObject) {
      part += `Content-Type: application/json${eol}`;
    }
    part += `${eol}${str}${eol}`;

    const buffer = Buffer.from(part);
    parts.push(buffer);
    totalLength += buffer.length;
  }

  // Create parts for files
  for (const { fieldName, file } of filesToProcess) {
    const { source, filename = 'file', contentType = 'application/octet-stream' } = file;
    const { size, stream } = await getSourceInfo(source || file);

    const headPart = [
        `--${boundary}${eol}`,
        `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"${eol}`,
        `Content-Type: ${contentType}${eol}${eol}`,
    ].join('');
    
    const headBuffer = Buffer.from(headPart);
    parts.push(headBuffer);
    totalLength += headBuffer.length;
    
    parts.push(stream);
    totalLength += size;

    const eolBuffer = Buffer.from(eol);
    parts.push(eolBuffer);
    totalLength += eolBuffer.length;
  }

  const finalBoundaryBuffer = Buffer.from(finalBoundary);
  parts.push(finalBoundaryBuffer);
  totalLength += finalBoundaryBuffer.length;

  return {
    body: parts,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalLength,
    },
  };
}

function sendRequest(url, { body, headers }, timeout) {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname } = new URL(url);

    const req = https.request(
      {
        hostname,
        port: port || 443,
        path: pathname,
        method: 'POST',
        headers,
        timeout,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const resBody = Buffer.concat(chunks).toString();
          try {
            const data = JSON.parse(resBody);
            resolve(data);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${resBody}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (Array.isArray(body)) {
      // Streaming multipart body
      (async () => {
        try {
          for (const part of body) {
            if (part instanceof Buffer) {
              req.write(part);
            } else { // Is a stream
              await new Promise((pResolve, pReject) => {
                part.on('error', pReject);
                part.pipe(req, { end: false });
                part.on('end', pResolve);
              });
            }
          }
          req.end();
        } catch (err) {
          req.destroy(err);
        }
      })();
    } else {
      // Simple JSON body
      req.write(body);
      req.end();
    }
  });
}