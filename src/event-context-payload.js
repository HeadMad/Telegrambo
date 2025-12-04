const ContextDataEvents = new Map();

export default eventContextPayload;


/**
 * Generates the payload for a given event context.
 *
 * @param {string} eventName - The name of the event.
 * @param {any} eventData - The data associated with the event.
 * @return {object} The payload for the event context.
 */
function eventContextPayload(eventName, eventData) {
  if (ContextDataEvents.has(eventName))
    return ContextDataEvents.get(eventName)(eventData);

    return {};
}
  
  // Incomming messages
  ContextDataEvents.set('message', event => ({
    chat_id: event.chat.id,
    from_chat_id: event.chat.id,
    message_id: event.message_id,
    message_thread_id: event?.message_thread_id,
    direct_messages_topic_id: event?.direct_messages_topic.topic_id
}));

// Обработчик для бизнесс аккаунта
const businessHandler = event => ({
  business_connection_id: event.business_connection_id,
  chat_id: event.chat.id,
  message_id: event.message_id
});

ContextDataEvents.set('business_message', businessHandler);
ContextDataEvents.set('edited_business_message', businessHandler);
ContextDataEvents.set('deleted_business_messages', businessHandler);

ContextDataEvents.set('business_connection', event => ({
  chat_id: event.user_chat_id,
  // business_connection_id: event.id
}));


// request of pushed inline button
ContextDataEvents.set('callback_query', event => ({
  chat_id: event.message.chat.id,
  callback_query_id: event.id,
  message_id: event.message.message_id
}));


ContextDataEvents.set('inline_query', event => ({
  inline_query_id: event.id
}));

// Post to channel
ContextDataEvents.set('channel_post', event => ({
  chat_id: event.chat.id,
  message_id: event.message_id
}));

// Voited in poll
ContextDataEvents.set('poll_answer', event => ({
  chat_id: 'user' in event ? event.user.id : event.voter_chat.id
}));

// Запрос на  вступление в чат
ContextDataEvents.set('chat_join_request', event => ({
  chat_id: event.from.id
}));

// Чат получил boost
ContextDataEvents.set('chat_boost', event => ({
  chat_id: event.boost.source.user.id
}));

// Пользователь удалил boost
ContextDataEvents.set('removed_chat_boost', event => ({
  chat_id: event.source.user.id
}));


