import { request } from "https";
import RequestPayloadPrepare from "./request-payload-prepare.js";

export default createRequestSender;

/**
 * Creates a request sender function that sends HTTP requests to the Telegram API.
 *
 * @param {string} token - The access token used to authenticate with the Telegram API.
 * @returns {function} - A function that accepts a method and payload, and sends a request to the Telegram API.
 */
function createRequestSender(token) {
  return requestSender;

  /**
   * Sends a request to the Telegram API.
   *
   * @param {string} method - The method to call in the Telegram API.
   * @param {object} payload - The payload to send with the request.
   * @return {object} The response from the Telegram API.
   */
  function requestSender(method, payload) {
    const url = `https://api.telegram.org/bot${token}/${method}`;
    const preparedPayload = RequestPayloadPrepare(payload);

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    // Create a request object
    const req = request(url, options);

    // Send the request synchronously
    req.write(JSON.stringify(preparedPayload));
    const response = req.end();

    return JSON.parse(response.body);
  }
}




