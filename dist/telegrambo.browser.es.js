const x = BrowserRequestSenderAsync, c = /* @__PURE__ */ new Map();
c.set("message", (e) => ({
  chat_id: e.chat.id,
  from_chat_id: e.chat.id,
  message_id: e.message_id,
  message_thread_id: e?.message_thread_id,
  direct_messages_topic_id: e?.direct_messages_topic?.topic_id
}));
const h = (e) => ({
  business_connection_id: e.business_connection_id,
  chat_id: e.chat.id,
  message_id: e.message_id
});
c.set("business_message", h);
c.set("edited_business_message", h);
c.set("deleted_business_messages", h);
c.set("business_connection", (e) => ({
  chat_id: e.user_chat_id
  // business_connection_id: event.id
}));
c.set("callback_query", (e) => ({
  chat_id: e.message.chat.id,
  callback_query_id: e.id,
  message_id: e.message.message_id
}));
c.set("inline_query", (e) => ({
  inline_query_id: e.id
}));
c.set("channel_post", (e) => ({
  chat_id: e.chat.id,
  message_id: e.message_id
}));
c.set("poll_answer", (e) => ({
  chat_id: "user" in e ? e.user.id : e.voter_chat.id
}));
c.set("chat_join_request", (e) => ({
  chat_id: e.from.id
}));
c.set("chat_boost", (e) => ({
  chat_id: e.boost.source.user.id
}));
c.set("removed_chat_boost", (e) => ({
  chat_id: e.source.user.id
}));
function y(e, t) {
  return c.has(e) ? c.get(e)(t) : {};
}
function C(e, t, r) {
  const i = r[t], d = y(t, i);
  return new Proxy(i, {
    get(s, n) {
      return n in s ? s[n] : n === "update" ? r : n === "payload" ? d : (a = {}) => e(n, { ...d, ...a });
    }
  });
}
function B() {
  const e = /* @__PURE__ */ new Map();
  return {
    has: (t) => e.has(t),
    get: (t) => e.get(t),
    add(t, r) {
      e.has(t) ? e.get(t).push(r) : e.set(t, [r]);
    }
  };
}
class m extends Error {
  constructor(t) {
    super(t), this.name = "BotContextErrors";
  }
}
function b(e, t = {}) {
  const r = B(), i = {};
  i.on = (o, s) => {
    typeof o == "function" && (s = o, o = null);
    const n = { handler: s };
    return r.add(o, n), {
      catch(a) {
        n.reject = a;
      }
    };
  }, i.setUpdate = async (o) => {
    const s = Object.keys(o).find((u) => u !== "update_id"), n = C(e, s, o), a = [];
    r.has(s) && a.push(...r.get(s)), r.has(null) && a.push(...r.get(null));
    const l = async ({ handler: u, reject: g }) => {
      try {
        return await u(n, s);
      } catch (_) {
        if (g)
          try {
            return await g(_, n, s);
          } catch (w) {
            return console.error("An error occurred within the .catch() handler itself:", w), _;
          }
        else
          return _;
      }
    };
    if (t.parallel === !0)
      return Promise.all(a.map(l));
    const f = [];
    for (const u of a)
      f.push(await l(u));
    return f;
  };
  const d = new Proxy(i, {
    get: (o, s) => o[s] ?? ((n = {}) => e(s, n)),
    set(o, s, n) {
      if (s in o)
        throw new m(`Can't rewrite method "${s}"`);
      if (typeof n != "function")
        throw new m(`New method "${s}" must be a function`);
      return o[s] = n(d), !0;
    }
  });
  return d;
}
function S(e, t = {}) {
  const r = x(e);
  return b(r, t);
}
const q = BrowserRequestSenderSync;
function E(e, t = {}) {
  const r = q(e);
  return b(r, t);
}
export {
  b as botContext,
  S as createAsyncBot,
  E as createSyncBot,
  S as default
};
//# sourceMappingURL=telegrambo.browser.es.js.map
