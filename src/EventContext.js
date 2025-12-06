import EventContextPayload from './eventContextPayload.js';

export default EventContext;


/**
 * Creates a new EventContext object.
 *
 * @param {function} requestSender - The function used to send requests.
 * @param {string} eventName - The name of the event.
 * @param {object} eventPayload - An object containing event data.
 * @return {object} The new EventContext object.
 */
function EventContext(requestSender, eventName, eventPayload) {
  const eventData = eventPayload[eventName];
  const contextPayload = EventContextPayload(eventName, eventData);

  const eventContextResult = new Proxy(eventData, {
    get(target, prop) {
      if (prop in target)
        return target[prop];

      if (prop === 'update')
        return eventPayload;

      if (prop === 'payload')
        return contextPayload;

      return (requestPayload = {}) => requestSender(prop, { ...contextPayload, ...requestPayload });
    },
  });

  return eventContextResult;
}

/**
 * @callback requestSender - Synchronous function that accepts a method and payload.
 * @param {string} method - Telegram API method for the request.
 * @param {object} payload - The payload to send with the request.
 * @return {Object} - The response from the Telegram API.
 */