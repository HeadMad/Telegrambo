import Bot from '../../index.js';

const bot = Bot('YOUR_BOT_TOKEN');

bot.on('message', (event) => {
  event.sendMessage({
    text: event.text,
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Button 1', callback_data: 'button1' }],
        [{ text: 'Button 2', url: 'https://google.com' }],
      ]
    }
  });
});


try {

  (async () => {
    let offset = 0;
    let timeout = 60;

    while (true) {

      const response = await bot.getUpdates({
        offset,
        timeout,
        limit: 100,
        allowed_updates: []
      });

      const { ok, result } = response;

      console.log(response)
      // console.log(JSON.stringify(result, null, 2));


      if (!ok)
        break;

      if (!result.length)
        continue;

      offset = result.at(-1).update_id + 1;

      for (let update of result)
        bot.setUpdate(update);
    }
  })();
} catch (error) { console.log(error); }