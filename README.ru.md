# Telegrambo

<br>Telegrambo — это простая библиотека для взаимодействия с [Telegram Bot API](https://core.telegram.org/bots/api).

Эта библиотека основана на Telegram API, поэтому все методы экземпляра бота будут являться [доступными методами](https://core.telegram.org/bots/api#available-methods) из списка Telegram.

Контекст в обработчике событий также использует доступные методы, имея при этом готовые поля в аргументах этих методов, такие как *chat_id* или *message_id* и другие. При необходимости вы можете перезаписать эти поля.

<br>

## Использование


<br>Сначала создайте бота:
```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Создание эхо-бота
bot.on('message', (event) => {
  event.sendMessage({
    text: event.text
  });
});

export default bot;
```


<br>Затем импортируйте его как модуль. Например, использование бота с веб-хуком:

```js
import bot from './bot.js';

export default async function handler(request, response) {
  // Прослушивание веб-хука по POST-запросу
  if (request.method === 'POST') {

    // request.body должен быть объектом
    const {ok, result} = await bot.setUpdate(request.body);
    console.log(result);

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

<br>Или с длительным опросом (long polling):

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

    if (!ok)
      break;
    
    if (!result.length)
      continue;
    
    offset = result.at(-1).update_id + 1;

    for (const update of result)
      bot.setUpdate(update);
  }
})();

```



<br>Список событий, которые вы можете получить из типа [_Update_](https://core.telegram.org/bots/api#update) в официальной документации. Это может быть любое поле, кроме `update_id`. Например, прослушивание события `callback_query`:

```js
// bot.js
import telegrambo from 'telegrambo';
const bot = telegrambo(process.env.YOU_BOT_TOKEN);

// Отправка клавиатуры по команде "/somedata"
bot.on('message', (event) => {
  if (event.text === '/somedata') {
    event.sendMessage({
      text: 'Нажмите кнопку, и бот отправит некоторые данные',
      reply_markup: {
        inline_keyboard: [[{
          text: 'Отправить некоторые данные',
          callback_data: 'SOME DATA'
        }]]
      }
    });
  }
});

// Обработка события callback_query
bot.on('callback_query', (event) => {
  if (event.data === 'SOME DATA') {
    event.sendMessage({
      text: 'Вы нажали кнопку, и бот отправил <b>некоторые данные</b>',
      parse_mode: 'HTML'
    });
  }
});
```

<br>Если в метод 'bot.on' передан только один аргумент, и это функция, этот обработчик будет применяться к любому событию:

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

## Собственные методы

<br>Вы можете создавать собственные методы для бота. Например:

```js
import bot from './bot.js';

// Напишите функцию для создания нового метода
function createOnTextMethod(bot) {
  return (matchText, handler) => {
    bot.on('message', (event) => {
      if (event.text === matchText)
        return handler(event);
      });
  };
};

// Инициализация нового метода onText
bot.onText = createOnTextMethod;

// Запуск нового метода
bot.onText('Hello', (event) => {
  return event.sendMessage({
    text: 'Hi there!'
  });
});
```
<br>

## Отправка файлов

Вы можете отправлять файлы тремя способами:
1.  Используя `file_id` существующего на серверах Telegram файла.
2.  Используя URL-адрес файла.
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

Для отправки локального файла необходимо передать `Buffer` или поток (stream). Рекомендуется использовать потоки для больших файлов.

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

**Отправка группы медиафайлов**

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

Фиксированные методы:
- `bot.setUpdate(update)`: Метод, который запускает обработку входящих событий, полученных от серверов Telegram.
  - `update` - Объект с данными от Telegram. Получается с помощью веб-хука или методом _bot.getUpdates()_.
- `bot.on(eventName, eventHandler)`: Метод, который устанавливает обработчик для именованного входящего события.
  - `eventName` - Имя события.
  - `eventHandler` - Функция-обработчик входящего события, которая принимает два параметра: _event_ и _eventName_.
- `bot.on(eventHandler)`: Метод, который обрабатывает все входящие события, независимо от имени события.

>Динамические методы выполняют запросы к серверам Telegram с именем соответствующего метода и данными, переданными в аргументе этого метода в виде объекта. Вы можете взять поля для передачи данных и имена методов из [документации Bot API Telegram](https://core.telegram.org/bots/api#available-methods).

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
  Экземпляр _EventContext_. Имеет динамические параметры - информацию из объекта обновления. А также имеет фиксированные вспомогательные параметры:

- `event.update`: Возвращает объект с данными обновления от входящего события.
- `event.payload`: Возвращает объект с подготовленными данными для отправки боту в данном контексте события.

> Динамические методы EventContext работают так же, как и динамические методы BotContext. Разница в том, что эти методы получают подготовленные данные из объекта обновления события.

Пример динамического метода события:
```js
import createBot from 'telegrambo';

const bot = createBot(process.env.YOUR_BOT_TOKEN);

// Создание простого эхо-бота
bot.on('message', (event) => {

  // Динамический метод, который принимает один параметр
  // text сообщения для отправки,
  // он взят из обновления входящего сообщения.
  // chat_id автоматически берется из обновления входящего события.
  // Но при необходимости его можно переопределить.
  event.sendMessage({
    text: event.text
  });
})
```

<br>

## Также клиентская версия
Вы можете запустить телеграм-бота на стороне клиента, в браузере.

```js
// Для асинхронных запросов
import telegrambo from 'telegrambo/browser'; 
// или для синхронных
// import telegrambo from 'telegrambo/browser/sync'; 

const bot = telegrambo(YOU_BOT_TOKEN);

// Создание эхо-бота
bot.on('message', (event) => {
  event.sendMessage({
    text: event.text
  });
});

// Для long-polling можно использовать тот же подход, что и в Node.js,
// реализовав цикл с помощью setTimeout или requestAnimationFrame
// для отправки запросов getUpdates.
```

<br>
<br>

## Лицензия
Telegrambo распространяется под лицензией MIT.
