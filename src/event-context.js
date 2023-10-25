import EventContextPayload from './event-context-payload.js';
import { EventContextError } from './errors.js';

export default EventContext;

/**
 * Creates an instance of EventContext.
 *
 * @param {requestSender} requestSender - Function that accepts a method and payload.
 * @param {string} eventName - The name of the event.
 * @param {Object} eventPayload - The payload of the event.
 * @return {Proxy} - A proxy object that handles access to the event payload and provides additional functionality.
 */
function EventContext(requestSender, eventName, eventPayload) {
  const eventData = eventPayload[eventName];
  const contextPayload = EventContextPayload(eventName, eventData);

  return new Proxy(eventPayload, {
    get(target, prop) {
      if (prop in target)
        return target[prop];

      if (prop === 'update')
        return target;

      if (prop === 'payload')
        return contextPayload;

      if (prop === 'result')
        return new Proxy({}, {
          get: (_, method) =>
            (requestPayload = {}) =>
              ({ method, ...contextPayload, ...requestPayload })
        });

      return (requestPayload = {}) => requestSender(prop, { ...contextPayload, ...requestPayload });
    },
    set(target, prop, value) {
      if (prop in target)
        throw new EventContextError(`Can't rewrite method "${prop}" in event context`);

      if (typeof value !== 'function')
        throw new EventContextError(`New method "${prop}" must be a function`);

      target[prop] = value;
      return true;
    }
  });
};

/**
 * @callback requestSender - Synchronous function that accepts a method and payload.
 * @param {string} method - Telegram API method for the request.
 * @param {object} payload - The payload to send with the request.
 * @return {Object} - The response from the Telegram API.
 */