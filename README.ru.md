# Telegrambo

<br>Telegrambo — это простая библиотека для взаимодействия с [Telegram Bot API](https://core.telegram.org/bots/api).

Эта библиотека основана на API Telegram, поэтому все методы экземпляра бота будут соответствовать [доступным методам](https://core.telegram.org/bots/api#available-methods) из списка Telegram.

Контекст в обработчике событий также использует доступные методы, имея при этом готовые поля в аргументах этих методов, такие как *chat_id* или *message_id* и другие. При необходимости вы можете переопределить эти поля.

<br>

## Использование


<br>Сначала создайте бота:
```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Создаем эхо-бота
bot.on('message', (event) => {
  return event.sendMessage({
    text: event.text
  });
});

export default bot;
```


<br>Затем импортируйте его как модуль. Например, используя бота с веб-хуком:

```js
import bot from './bot.js';

export default async function handler(request, response) {
  // Прослушивание веб-хука по POST-запросу
  if (request.method === 'POST') {

    // request.body должен быть объектом.
    // setUpdate последовательно выполнит все подходящие обработчики.
    const handlerResults = await bot.setUpdate(request.body);
    console.log('Результаты обработчиков:', handlerResults);

  // Установка веб-хука, если в строке запроса URL есть 'webhook':
  // https://my-syte.com?webhook
  } else if ('webhook' in request.query) {
    
    await bot.setWebhook({
      url: 'https://my-syte.com'
    });

  }

  return response.send('Ok');
}
```

<br>Или с использованием long polling:

```js
import bot from './bot.js';

(async () => {
  let offset = 0;
  const timeout = 60;

  while (true) {
    const {ok, result} = await bot.getUpdates({
      offset,
      timeout,
      limit: 100,
      allowed_updates: []
    });

    if (!ok) {
      console.error('Не удалось получить обновления:', result);
      break;
    }
    
    if (!result.length)
      continue;
    
    for (let update of result) {
      // Хорошей практикой является ожидание setUpdate, особенно с асинхронными обработчиками
      await bot.setUpdate(update);
    }

    offset = result.at(-1).update_id + 1;
  }
})();
```

<br>Список событий вы можете получить из типа [_Update_](https://core.telegram.org/bots/api#update) в официальной документации. Это может быть любое поле, кроме `update_id`. Например, прослушивание события `callback_query`:

```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

bot.on('message', (event) => {
  if (event.text === '/somedata') {
    event.sendMessage({
      text: 'Нажмите кнопку, и бот отправит некоторые данные',
      reply_markup: {
        inline_keyboard: [[{
          text: 'Отправить данные',
          callback_data: 'SOME DATA'
        }]]
      }
    });
  }
});

bot.on('callback_query', (event) => {
  if (event.data === 'SOME DATA') {
    event.sendMessage({
      text: 'Вы нажали кнопку, и бот отправил <b>некоторые данные</b>',
      parse_mode: 'HTML'
    });
  }
});
```

<br>Если в метод `bot.on` передан только один аргумент, и это функция, этот обработчик будет применяться к любому событию:

```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Передана только функция
bot.on((event, eventName) => {
  const name = event.from.first_name;
  event.sendMessage({
    text:  `Привет, ${name}! Только что произошло событие <i>${eventName}</i>`,
    parse_mode: 'HTML'
  });
});
```
<br>

## Обработка ошибок

По умолчанию любая ошибка внутри обработчика перехватывается и выводится в консоль через `console.error`. Это гарантирует, что один неудавшийся обработчик не остановит выполнение других.

Для более тонкого контроля метод `bot.on` возвращает объект с методом `.catch()`, позволяющим вам прикрепить специальный обработчик ошибок.

```js
bot.on('message', (event) => {
  // Этот обработчик выбросит ошибку
  if (event.text === '/error') {
    throw new Error('Это преднамеренная ошибка!');
  }
  event.sendMessage({ text: 'Здесь ошибок нет!' });
})
.catch((error, event, eventName) => {
  // Эта функция будет вызвана, только если обработчик выше выбросит ошибку
  console.log(`Перехвачена ошибка в обработчике '${eventName}': ${error.message}`);
  
  // Затем вы можете использовать event для ответа, например:
  event.sendMessage({ text: 'Извините, что-то пошло не так при обработке вашего запроса.' });
});
```
Если пользовательский обработчик ошибок (функция, переданная в `.catch()`) сам выбросит ошибку, эта ошибка будет перехвачена внутри, выведена в `console.error`, и обработка других обработчиков продолжится. Ошибка исходного обработчика события все равно будет включена в результаты `setUpdate`.

<br>

## Собственные методы

<br>Вы можете создавать собственные методы для бота. Например:

```js
import bot from './bot.js';

// Напишем функцию для создания нового метода
function createOnTextMethod(bot) {
  return (matchText, handler) => {
    return bot.on('message', (event) => {
      if (event.text === matchText)
        return handler(event);
      });
  };
};

// Инициализируем новый метод onText
bot.onText = createOnTextMethod;

// Запускаем новый метод и прикрепляем специальный обработчик ошибок
bot.onText('Hello', (event) => {
  return event.sendMessage({
    text: 'Hi there!'
  });
}).catch(console.error);
```
<br>

## Отправка файлов

Вы можете отправлять файлы тремя способами:
1.  Используя `file_id` файла, уже находящегося на серверах Telegram.
2.  Используя URL файла.
3.  Загружая файл с вашего компьютера.

<br>

**Отправка фото по URL**

```js
import bot from './bot.js';

bot.onText('/photo', (event) => {
  event.sendPhoto({
    photo: 'https://picsum.photos/200/300',
    caption: 'Случайное изображение'
  });
});
```
<br>

**Отправка документа из локального файла**

Для отправки локального файла вам нужно передать `Buffer` или поток. Рекомендуется использовать потоки для больших файлов.

```js
import bot from './bot.js';
import fs from 'fs';
import path from 'path';

bot.onText('/doc', (event) => {
  const filePath = path.resolve('./document.pdf');
  
  // Проверяем, существует ли файл
  if (fs.existsSync(filePath)) {
    event.sendDocument({
      document: fs.createReadStream(filePath),
      caption: 'Это мой документ'
    });
  } else {
    event.sendMessage({ text: 'Файл не найден!' });
  }
});
```
<br>

**Отправка медиа-группы**

Вы можете отправлять несколько фото и видео в одном сообщении.

```js
import bot from './bot.js';
import fs from 'fs';
import path from 'path';

bot.onText('/media', (event) => {
  const photoPath1 = path.resolve('./photo1.jpg');
  const photoPath2 = path.resolve('./photo2.jpg');

  event.sendMediaGroup({
    media: [
      {
        type: 'photo',
        media: fs.createReadStream(photoPath1)
      },
      {
        type: 'photo',
        media: fs.createReadStream(photoPath2),
        caption: 'Два изображения'
      }
    ]
  });
});
```
<br>

## API

### bot
Экземпляр _BotContext_. Имеет фиксированные и динамические методы.
Вы можете передать необязательный объект `params` в фабричную функцию `telegrambo` для настройки поведения бота:
- `params.parallel` (boolean, по умолчанию: `false`): Если `true`, обработчики событий для `bot.on()` будут выполняться параллельно при вызове `bot.setUpdate()`. Если `false` (по умолчанию), обработчики будут выполняться последовательно.

Фиксированные методы:
- `bot.setUpdate(update)` — Метод, который запускает обработку входящих событий. Он выполняет все подходящие обработчики (последовательно по умолчанию или параллельно, если `params.parallel` было установлено в `true` при создании бота).
  - `update` - Объект с данными от Telegram.
  - **Возвращает**: `Promise`, который разрешается массивом `Array`, содержащим возвращаемые значения всех выполненных обработчиков. Порядок результатов соответствует порядку выполнения.

- `bot.on(eventName, eventHandler)` — Метод, который устанавливает обработчик для именованного входящего события.
  - `eventName` - Имя события.
  - `eventHandler` - Функция-обработчик входящего события, которая принимает `eventContext` и `eventName` в качестве аргументов.
  - **Возвращает**: Объект с методом `.catch(reject)`, чтобы установить специальный обработчик ошибок. Функция обратного вызова `reject` получает `(error, eventContext, eventName)` в качестве аргументов.
- `bot.on(eventHandler)` — Метод, который обрабатывает все входящие события, независимо от имени события. Возвращает объект с методом `.catch()`.

>Динамические методы выполняют запросы к серверам Telegram с именем соответствующего метода и данными, переданными в аргументе этого метода в виде объекта. Вы можете взять поля для передачи данных и имена методов из [документации Bot API Telegram](https://core.telegram.org/bots/api#available-methods)

Пример динамического метода:

```js
import bot from './bot.js';

// Пересылка сообщения из чата с id = 123456789
// в чат с id = 987654321
bot.forwardMessage({
  chat_id: 123456789,
  from_chat_id: 987654321,
  message_id: 12
})
```
<br>

### event 
Экземпляр _EventContext_. Имеет динамические параметры - информацию из объекта `update`. И имеет фиксированные вспомогательные параметры:

- `event.update` Возвращает объект с данными обновления из входящего события.
- `event.payload` Возвращает объект с подготовленными данными для отправки боту в данном контексте события.

> Динамические методы EventContext работают так же, как и динамические методы BotContext. Разница в том, что эти методы получают подготовленные данные из объекта `update` события.

Пример динамического метода события:
```js
import createBot from 'telegrambo';

const bot = createBot(process.env.YOUR_BOT_TOKEN);

// Создаем простого эхо-бота
bot.on('message', (event) => {

  // Динамический метод, который принимает один параметр
  // текст отправляемого сообщения, 
  // он берется из обновления входящего сообщения.
  // chat_id автоматически берется из обновления входящего события. 
  // Но при необходимости его можно переопределить
  event.sendMessage({
    text: event.text
  });
})
```

<br>

## Также клиентская версия
Вы можете запустить телеграм-бота на стороне клиента, в браузере.

```js
import telegrambo from 'telegrambo/browser';
import polling from 'telegrambo-polling';

const bot = telegrambo(YOU_BOT_TOKEN);
bot.polling = polling;

// Создаем эхо-бота
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

## Лицензия
Telegrambo распространяется по лицензии MIT.