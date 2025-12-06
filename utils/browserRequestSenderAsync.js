import RequestPayloadPrepare from "./requestPayloadPrepare.js";

export default BrowserRequestSenderAsync;

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
  return value instanceof Blob || 
         value instanceof File ||
         (value.source && (value.source instanceof Blob || value.source instanceof File));
}

function buildJSON(payload) {
  return {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

function buildMultipart(payloadEntries) {
  const formData = new FormData();
  const files = [];
  let fileIndex = 0;

  function processValue(key, value) {
    if (isFile(value)) {
      const name = `file${fileIndex++}`;
      const file = value instanceof Blob || value instanceof File ? value : value.source;
      const filename = value.filename || (value instanceof File ? value.name : 'file');
      files.push({ name, file, filename });
      return `attach://${name}`;
    }
    
    if (key === 'media' && Array.isArray(value)) {
      return value.map(item => {
        if (item && typeof item === 'object' && isFile(item.media)) {
          const name = `file${fileIndex++}`;
          const file = item.media instanceof Blob || item.media instanceof File 
            ? item.media 
            : item.media.source;
          const filename = item.media.filename || (item.media instanceof File ? item.media.name : 'file');
          files.push({ name, file, filename });
          return { ...item, media: `attach://${name}` };
        }
        return item;
      });
    }
    
    return value;
  }

  for (const [key, value] of payloadEntries) {
    const processedValue = processValue(key, value);
    const fieldValue = typeof processedValue === 'object' && processedValue !== null
      ? JSON.stringify(processedValue)
      : String(processedValue);
    
    formData.append(key, fieldValue);
  }

  for (const { name, file, filename } of files) {
    formData.append(name, file, filename);
  }

  return {
    body: formData,
    headers: {}
  };
}

async function sendRequest(url, { body, headers }, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.ok) {
      return data.result;
    }
    
    const error = new Error(data.description || 'API Error');
    error.code = data.error_code;
    throw error;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}
