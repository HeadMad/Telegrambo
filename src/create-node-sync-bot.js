import createRequestSender from '../utils/node-sync-request-sender.js';
import BotContext from './bot-context.js';

export default createNodeBot;


/**
 * Creates a node bot with the given token and parameters.
 *
 * @param {string} token - The token used to authenticate the bot.
 * @param {object} params - Additional parameters for the bot (optional).
 * @return {BotContext} The created bot context.
 */
function createNodeBot(token, params = {}) {
  const requestSender = createRequestSender(token);
  return BotContext(requestSender, params);
}
