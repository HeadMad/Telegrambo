import createRequestSender from '../utils/createNodeRequestSender.js';
import BotContext from './BotContext.js';

export default createNodeBot;


/**
 * Creates a node bot with the given token and parameters.
 *
 * @param {string} token - The token used to authenticate the bot.
 * @param {object} params - Additional parameters for the bot (optional).
 * @return {BotContext} The created bot context.
 */
function createNodeBot(token, {timeout=30000, apiUrl='https://api.telegram.org', ...params} = {}) {
  const requestSender = createRequestSender(token, {timeout, apiUrl});
  return BotContext(requestSender, params);
}
