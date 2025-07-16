import https from "https";
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


    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      // Создаем запрос
      const req = https.request(url, requestOptions, (res) => {
        let data = '';

        // Собираем данные
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });

      // Обрабатываем ошибки
      req.on('error', err => {
        reject(err)
      });

      // Отправляем данные
      req.write(JSON.stringify(preparedPayload));
      req.end();
    });
  }
}











