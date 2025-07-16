import bot from '../bot.js';
import update from '../updates/message.js';

// console.log(bot.setUpadte(update));

bot.on('message', (event) => {
  return event.sendMessage({
    text: event.text
  })
});

console.log(bot.setUpdate(update));