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

ContextDataEvents.set('message', event => ({
  chat_id: event.chat.id,
  message_id: event.message_id
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

ContextDataEvents.set('callback_query', event => ({
  chat_id: event.message.chat.id,
  callback_query_id: event.id,
  message_id: event.message.message_id
}));

ContextDataEvents.set('inline_query', event => ({
  inline_query_id: event.id
}));


