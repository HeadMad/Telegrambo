const STRING_PROPS = new Set(['chat_id', 'from_chat_id', 'text']);

/**
 * Prepares the request payload by creating a deep copy of the input object and then converting it to a JSON string.
 *
 * @param {object} requestPayload - The input request payload object.
 * @return {string} - The JSON string representation of the modified request payload.
 */
function RequestPayloadPrepare(requestPayloadEntries) {
  const result = {};
  for (let [key, value] of requestPayloadEntries)
    if (STRING_PROPS.has(key))
      result[key] = String(value);
    else if (typeof value === 'object')
      result[key] = JSON.stringify(value);
    else
      result[key] = value;

  return result;
}

export default RequestPayloadPrepare;