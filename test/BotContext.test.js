import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import BotContext from '../src/BotContext.js';

describe('BotContext', () => {
  let bot;
  let mockRequestSender;

  beforeEach(() => {
    mockRequestSender = jest.fn((method, payload) => 
      Promise.resolve({ ok: true, result: { method, payload } })
    );
  });

  it('should register and call a handler with a valid context object', async () => {
    bot = BotContext(mockRequestSender);
    let receivedContext;
    const handler = jest.fn(ctx => {
      receivedContext = ctx;
    });
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'hello' } };

    bot.on('message', handler);
    await bot.setUpdate(update);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(receivedContext.text).toBe('hello');
    expect(receivedContext.chat.id).toBe(123);
  });

  it('should call both specific and catch-all handlers', async () => {
    bot = BotContext(mockRequestSender);
    const messageHandler = jest.fn();
    let anyHandlerCtx;
    const anyHandler = jest.fn(ctx => {
      anyHandlerCtx = ctx;
    });
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'hello' } };

    bot.on('message', messageHandler);
    bot.on(anyHandler);
    
    await bot.setUpdate(update);

    expect(messageHandler).toHaveBeenCalledTimes(1);
    expect(anyHandler).toHaveBeenCalledTimes(1);
    expect(anyHandlerCtx.text).toBe('hello');
  });

  it('should proxy event context methods to the request sender', async () => {
    bot = BotContext(mockRequestSender);
    const update = { update_id: 1, message: { message_id: 42, chat: { id: 123 }, text: 'proxy test' } };

    bot.on('message', (ctx) => {
      return ctx.sendMessage({ text: 'response' });
    });

    await bot.setUpdate(update);

    expect(mockRequestSender).toHaveBeenCalledTimes(1);
    expect(mockRequestSender).toHaveBeenCalledWith('sendMessage', 
      expect.objectContaining({
        chat_id: 123,
        text: 'response'
      })
    );
  });

  it('should handle errors with a specific .catch() block', async () => {
    bot = BotContext(mockRequestSender);
    let capturedError, capturedCtx;
    const errorHandler = jest.fn((err, ctx) => {
      capturedError = err;
      capturedCtx = ctx;
    });
    const testError = new Error('Handler failed');
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'test error' } };

    bot.on('message', () => {
      throw testError;
    }).catch(errorHandler);

    await bot.setUpdate(update);

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(capturedError).toBe(testError);
    expect(typeof capturedCtx).toBe('object');
    expect(capturedCtx.text).toBe('test error');
  });

  it('should return the error in results if no .catch() is provided', async () => {
    bot = BotContext(mockRequestSender);
    const testError = new Error('Handler failed');
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'test error' } };

    bot.on('message', () => {
      throw testError;
    });

    const results = await bot.setUpdate(update);

    expect(results).toHaveLength(1);
    expect(results[0]).toBe(testError);
  });

  it('should execute handlers sequentially by default', async () => {
    bot = BotContext(mockRequestSender);
    const order = [];
    const handler1 = jest.fn(() => new Promise(resolve => setTimeout(() => {
      order.push(1);
      resolve(1);
    }, 50)));
    const handler2 = jest.fn(() => {
      order.push(2);
      return Promise.resolve(2);
    });
    
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'seq test' } };
    bot.on('message', handler1);
    bot.on('message', handler2);

    await bot.setUpdate(update);

    expect(order).toEqual([1, 2]);
  });

  it('should execute handlers in parallel if params.parallel is true', async () => {
    bot = BotContext(mockRequestSender, { parallel: true });
    const order = [];
    const handler1 = jest.fn(() => new Promise(resolve => setTimeout(() => {
      order.push(1);
      resolve(1);
    }, 50)));
    const handler2 = jest.fn(() => {
      order.push(2);
      return Promise.resolve(2);
    });
    
    const update = { update_id: 1, message: { chat: { id: 123 }, text: 'parallel test' } };
    bot.on('message', handler1);
    bot.on('message', handler2);

    await bot.setUpdate(update);

    // With parallel execution, handler2 should resolve first.
    expect(order).toEqual([2, 1]);
  });
});
