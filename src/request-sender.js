import fetch from "sync-fetch";
import RequestPayloadPrepare from "./request-payload-prepare.js";

export default RequestSender;

/**
 * Creates a request sender function that sends HTTP requests to the Telegram API.
 *
 * @param {string} token - The access token used to authenticate with the Telegram API.
 * @returns {function} - A function that accepts a method and payload, and sends a request to the Telegram API.
 */
function RequestSender(token) {

  /**
   * Makes a request to the specified API endpoint.
   *
   * @param {string} method - Telegram API method for the request.
   * @param {object} payload - The payload to send with the request.
   * @return {Promise<object>} - A promise that resolves to the JSON response from the API.
   */
  const request =  (method, payload) => {
    method = payload.method ?? method;
    const url = `https://api.telegram.org/bot${token}/${method}`;
    const preparedPaylod = RequestPayloadPrepare(payload);
    const options = {
      method: 'POST',
      body: JSON.stringify(preparedPaylod),
      headers: { 'Content-Type': 'application/json' },
    };

    return fetch(url, options).json();
  }

  return request;
}