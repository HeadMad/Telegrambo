# Match Extension

You can create match method using onMatch extension from library `telegrambo/extensions`
```js
// bot.js
import { cretaeNodeBot } from 'telegrambo';
import { onMatch } from 'telegrambo/extensions';

const bot = createNodeBot(process.env.YOUR_BOT_TOKEN);

// Initialize new method
bot.onMatch = onMatch('::');
```

Creates a callback function to handle a specific match.

**Parameters:**

- `bot` (BotContext ): The bot object.
- `matchSeparator` (string, optional): The separator used to split the match string into an array. Defaults to `'::'`.

**Returns:**

- `function`: A callback function that handles the match.

<br>Example of using:

```js
// If user send photo
bot.onMatch('message::photo', (ctx, match, eventName) => {
  ctx.sendMessage({
    text: 'Great photo!'
  });
});
```

This handler will working in `message` event and [_Message_](https://core.telegram.org/bots/api#message) message type has field `photo`.
This filter is very powerfull. You can check endpoints for a match or regular expression match:

```js
// Will matching for text "Hello!"
'message::text::Hello!'

// Matching regular expression for /start command in text of message 
'message::text::/.*\\/start\\b.*/i'

// Also filter can be applied to array field like 'entities'
// then filter will maching to each element of them
// and check is this entitie is mention (@username) 
'message::entities::type::mention'
```

<br>If You whant change match separator from '::' to your, pass to bot `params`-object: 

```js
import Telegrambo from 'telegambo';

const params = { match_separator: '--' };
const bot = Telegrambo(process.env.YOU_BOT_TOKEN, params);

bot.on('message--text--/\\/\\w+/i', (ctx, match) => {
  ctx.sendMessage({
    text: 'You send me command <b>${match}</b>'
  });
});
```