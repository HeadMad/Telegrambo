import bot from '../bot.js';
import {onMatch} from '../../extensions/index.js';
import update from '../updates/message-match.js';

bot.match = onMatch('::');

bot.match('message::entities', (event, match, eventName) => {
  console.log({match});
});

console.log(bot.setUpdate(update));