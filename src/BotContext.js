import EventContext from './EventContext.js';
import createHandlerStorage from '../utils/createHandlerStorage.js';
import { BotContextError } from './errors.js';

export default BotContext;

/**
 * Creates a BotContext object that handles event handling and processing.
 *
 * @param {requestSender} requestSender - Function that accepts a method and payload.
 * @param {object} params - Optional parameters.
 * @param {string} params.match_separator - The separator used for event matching. Default is '::'.
 * @return {object} The BotContext object.
 */
function BotContext(requestSender, params = {}) {
  const EVENTS = createHandlerStorage();
  const self = {};

  /**
   * Attaches an event handler for a specific event or event match.
   *
   * @param {string|function} eventName - The event or event match to attach the handler to.
   * @param {function} eventHandler - The handler function to attach.
   */
  self.on = (eventName, eventHandler) => {
    if (typeof eventName === 'function') {
      eventHandler = eventName;
      eventName = null;
    }

    const eventObject = { handler: eventHandler };
    EVENTS.add(eventName, eventObject);

    return {
      catch(reject) {
        eventObject.reject = reject;
      }
    }
  };

  /**
   * Processes the event payload by sequentially executing all relevant handlers.
   * If a handler throws an error, it is caught and logged, and execution continues with the next handler.
   *
   * @param {object} eventPayload - The payload of the event.
   * @returns {Promise<Array>} A promise that resolves with an array of results from successful handlers, flattened.
   */
  self.setUpdate = async (eventPayload) => {
    const eventName = Object.keys(eventPayload).find(key => key !== 'update_id');
    const eventContext = EventContext(requestSender, eventName, eventPayload);

    const eventObjects = [];

    if (EVENTS.has(eventName))
      eventObjects.push(...EVENTS.get(eventName));

    if (EVENTS.has(null))
      eventObjects.push(...EVENTS.get(null));

    const mapHandler = async ({ handler, reject }) => {
      try {
        return await handler(eventContext, eventName);
      } catch (error) {
        if (reject) 
          try {
            return await reject(error, eventContext, eventName);
          } catch (rejectError) {
            console.error('An error occurred within the .catch() handler itself:', rejectError);
            return error; // Return the original error
          }
  
        else
          return error;
      }
    };

    if (params.parallel === true)
      return Promise.all(eventObjects.map(mapHandler));

    const results = [];
    for (const eventObject of eventObjects) 
      results.push(await mapHandler(eventObject));
    
    return results;
  };

  const botContextResult = new Proxy(self, {
    get: (target, prop) => target[prop]
      ?? ((requestPayload = {}) => requestSender(prop, requestPayload)),

    set(target, prop, value) {
      if (prop in target)
        throw new BotContextError(`Can't rewrite method "${prop}"`);

      if (typeof value !== 'function')
        throw new BotContextError(`New method "${prop}" must be a function`);

      target[prop] = value(botContextResult);
      return true;
    },
  });

  return botContextResult;
}

/**
 * @callback requestSender - Synchronous function that accepts a method and payload.
 * @param {string} method - Telegram API method for the request.
 * @param {object} payload - The payload to send with the request.
 * @return {object} - The response from the Telegram API.
 */