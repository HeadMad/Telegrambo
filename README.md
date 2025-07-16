# Telegrambo

<br>Telegrambo is a simple library for interacting with the [Telegram Bot API](https://core.telegram.org/bots/api)

This library is based on the telegram API, so all methods of the bot instance will be [available methods](https://core.telegram.org/bots/api#available-methods) from the telegram list.

The context in the event handler also uses the available methods, while having ready-made fields in the arguments of these methods, such as *chat_id* or *message_id* and others. If necessary, you can overwrite these fields.

<br>

## Usage


<br>At first, create bot:
```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Create echo-bot
bot.on('message', (event) => {
  event.sendMessage({
    text: event.text
  });
});

export default bot;
```


<br>Then import it as a module. For example, using bot with webhook:

```js
import bot from './bot.js';

export default async function handler(request, response) {
  // Listening webhook on POST-request
  if (request.method === 'POST') {

    // request.body must be a object
    const {ok, result} = await bot.setUpdate(request.body);
    console.log(result);

  // Set webhook if query-string of url have 'webhook':
  // https://my-syte.com?webhook
  } else ('webhook' in request.query) {
    
    await bot.setWebhook({
      url: 'https://my-syte.com'
    });

  }

  return response.send('Ok');
}
```

<br>Or with long polling:

```js
import bot from './bot.js';

(async () => {
  let offset = 0;
  let timeout = 60;

  while (true) {
    const {ok, result} = await bot.getUpdates({
      offset,
      timeout,
      limit: 100,
      allowed_updates: []
    });

    if (!ok)
      break;
    
    if (!result.length)
      continue;
    
    offset = result.at(-1).update_id + 1;

    for (let update of result)
      bot.setUpdate(update);
  }
})();

```



<br>List of events you can get from type [_Update_](https://core.telegram.org/bots/api#update) in official documentation. It can be any field except `update_id`. For example, listen event `callback_query`:

```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Send keyboard on command "/somedata"
bot.on('message', (event) => {
  if (event.text === '/somedata') {
    event.sendMessage({
      text: 'Press the button and bot send some data',
      reply_markup: {
        inline_keyboard: [[{
          text: 'Send some data',
          callback_data: 'SOME DATA'
        }]]
      }
    });
  }
});

// Handle callback-query event
bot.on('callback_query', (event) => {
  if (event.data === 'SOME DATA') {
    event.sendMessage({
      text: 'You press the button, and bot send <b>some data</b>',
      parse_mode: 'HTML'
    });
  }
});
```

<br>If passed just one argument in 'bot.on' method, and it's a function, this handler be applied to any event:

```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Passed just function
bot.on((event, eventName) => {
  const name = event.from.first_name;
  event.sendMessage({
    text:  `Hi, ${name}! The event <i>${eventName}</i> just happened`,
    parse_mode: 'HTML'
  });
});
```
<br>

## Own methods

<br>You can create own methods for bot. For example:

```js
import bot from './bot.js';

// Write function for creating new method
function createOnTextMethod(bot) {
  return (matchText, handler) => {
    bot.on('message', (event) => {
      if (event.text === matchText)
        return handler(event);
      });
  };
};

// Initialize new method onText
bot.onText = createOnTextMethod;

// Run new method
bot.onText('Hello', (event) => {
  return event.sendMessage({
    text: 'Hi there!'
  });
});
```
<br>



## API

### bot
 Instance of _BotContext_. Has fixed and dynamic methods.

Fixed methods:
- `bot.setUpdate(update)` A method that triggers the processing of incoming events received from Telegram servers
  - `update` - Object with data from telegram. Getting with webhook or by method _bot.getUpdates()_
- `bot.on(eventName, eventHandler)` Method that sets the handler for an incoming named event
  - `eventName` Name of event
  - `eventHandler` Function handler of an incoming event that passes two parameters, _event_ and _eventName_, as arguments
- `bot.on(eventHandler)` A method that processes all incoming events, regardless of the event name

>Dynamic methods execute requests to Telegram servers with the name of the corresponding method and the data passed in the argument of this method as an object. You can take the fields for passing data and the names of methods from the [Bot API Telegram documentation](https://core.telegram.org/bots/api#available-methods)

Example of dinamic method:

```js
import bot from './bot.js';

// Forwarding message from chat with id = 123456789
// to chat with id = 987654321
bot.forwardMessage({
  chat_id: 123456789,
  from_chat_id: 987654321,
  message_id: 12
})
```
<br>

### event 
  Instance of _EventContext_. Has dinamic params - info from update object. And has fixed helper params:

- `event.update` Return object with data of update from incoming event.
- `event.payload` Return object with prepare data for sending to bot in this event context

> EventContext dynamic methods work in the same way as BotContext dynamic methods. The difference is that these methods receive prepared data from the update object of the event.

Example of event dinamic method:
```js
import createBot from 'telegrambo';

const bot = createBot(process.env.YOUR_BOT_TOKEN);

// Create simple echo bot
bot.on('message', (event) => {

  // A dynamic method that takes one parameter
  // text of the message to be sent, 
  // it taken from the update of incoming message.
  // chat_id is automatically taken from the incoming event update. 
  // But if necessary, it can be overridden
  event.sendMessage({
    text: event.text
  });
})
```

<br>

## Also Client Version
You can start telegram bot on client side, in browser

```js
import telegrambo from 'telegrambo/browser';
import polling from 'telegrambo-polling';

const bot = telegrambo(YOU_BOT_TOKEN);
bot.polling = polling;

// Create echo-bot
bot.on('message', (event) => {
  event.sendMessage({
    text: event.text
  });
});

bot.polling({
  timeout: 60,
  limit: 100,
  offset: 0,
  allowedUpdates: []
});
```

<br>
<br>

## License
Telegrambo is MIT licensed.

Please make sure to update the installation, usage, and API sections with the correct information for your library. Also, don't forget to include a license file and a contributing guidelines file if applicable.