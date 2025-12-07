const p = /* @__PURE__ */ new Set(["chat_id", "from_chat_id", "text"]);
function w(e) {
  const n = {};
  for (let [r, a] of e)
    p.has(r) ? n[r] = String(a) : typeof a == "object" ? n[r] = JSON.stringify(a) : n[r] = a;
  return n;
}
function x(e, { timeout: n = 3e4, apiUrl: r = "https://api.telegram.org" } = {}) {
  if (!e || typeof e != "string")
    throw new Error("Token must be a non-empty string");
  return async function(c, o = {}) {
    if (!c || typeof c != "string")
      throw new Error("Method must be a non-empty string");
    const s = `${r}/bot${e}/${c}`, t = Object.entries(o), f = t.some(([l, u]) => _(u) ? !0 : l === "media" && Array.isArray(u) ? u.some((h) => _(h?.media)) : !1) ? S(t) : E(w(t));
    return j(s, f, n);
  };
}
function _(e) {
  return !e || typeof e != "object" ? !1 : e instanceof Blob || e instanceof File || e.source && (e.source instanceof Blob || e.source instanceof File);
}
function E(e) {
  return {
    body: JSON.stringify(e),
    headers: {
      "Content-Type": "application/json"
    }
  };
}
function S(e) {
  const n = new FormData(), r = [];
  let a = 0;
  function c(o, s) {
    if (_(s)) {
      const t = `file${a++}`, i = s instanceof Blob || s instanceof File ? s : s.source, f = s.filename || (s instanceof File ? s.name : "file");
      return r.push({ name: t, file: i, filename: f }), `attach://${t}`;
    }
    return o === "media" && Array.isArray(s) ? s.map((t) => {
      if (t && typeof t == "object" && _(t.media)) {
        const i = `file${a++}`, f = t.media instanceof Blob || t.media instanceof File ? t.media : t.media.source, l = t.media.filename || (t.media instanceof File ? t.media.name : "file");
        return r.push({ name: i, file: f, filename: l }), { ...t, media: `attach://${i}` };
      }
      return t;
    }) : s;
  }
  for (const [o, s] of e) {
    const t = c(o, s), i = typeof t == "object" && t !== null ? JSON.stringify(t) : String(t);
    n.append(o, i);
  }
  for (const { name: o, file: s, filename: t } of r)
    n.append(o, s, t);
  return {
    body: n,
    headers: {}
  };
}
async function j(e, { body: n, headers: r }, a) {
  const c = new AbortController(), o = setTimeout(() => c.abort(), a);
  try {
    const s = await fetch(e, {
      method: "POST",
      headers: r,
      body: n,
      signal: c.signal
    });
    clearTimeout(o);
    const t = await s.json();
    if (t.ok)
      return t.result;
    const i = new Error(t.description || "API Error");
    throw i.code = t.error_code, i;
  } catch (s) {
    throw clearTimeout(o), s.name === "AbortError" ? new Error("Request timeout") : s;
  }
}
const d = /* @__PURE__ */ new Map();
d.set("message", (e) => ({
  chat_id: e.chat.id,
  from_chat_id: e.chat.id,
  message_id: e.message_id,
  message_thread_id: e?.message_thread_id,
  direct_messages_topic_id: e?.direct_messages_topic?.topic_id
}));
const g = (e) => ({
  business_connection_id: e.business_connection_id,
  chat_id: e.chat.id,
  message_id: e.message_id
});
d.set("business_message", g);
d.set("edited_business_message", g);
d.set("deleted_business_messages", g);
d.set("business_connection", (e) => ({
  chat_id: e.user_chat_id
  // business_connection_id: event.id
}));
d.set("callback_query", (e) => ({
  chat_id: e.message.chat.id,
  callback_query_id: e.id,
  message_id: e.message.message_id
}));
d.set("inline_query", (e) => ({
  inline_query_id: e.id
}));
d.set("channel_post", (e) => ({
  chat_id: e.chat.id,
  message_id: e.message_id
}));
d.set("poll_answer", (e) => ({
  chat_id: "user" in e ? e.user.id : e.voter_chat.id
}));
d.set("chat_join_request", (e) => ({
  chat_id: e.from.id
}));
d.set("chat_boost", (e) => ({
  chat_id: e.boost.source.user.id
}));
d.set("removed_chat_boost", (e) => ({
  chat_id: e.source.user.id
}));
function C(e, n) {
  return d.has(e) ? d.get(e)(n) : {};
}
function q(e, n, r) {
  const a = r[n], c = C(n, a);
  return new Proxy(a, {
    get(s, t) {
      return t in s ? s[t] : t === "update" ? r : t === "payload" ? c : (i = {}) => e(t, { ...c, ...i });
    }
  });
}
function O() {
  const e = /* @__PURE__ */ new Map();
  return {
    has: (n) => e.has(n),
    get: (n) => e.get(n),
    add(n, r) {
      e.has(n) ? e.get(n).push(r) : e.set(n, [r]);
    }
  };
}
class y extends Error {
  constructor(n) {
    super(n), this.name = "BotContextErrors";
  }
}
function B(e, n = {}) {
  const r = O(), a = {};
  a.on = (o, s) => {
    typeof o == "function" && (s = o, o = null);
    const t = { handler: s };
    return r.add(o, t), {
      catch(i) {
        t.reject = i;
      }
    };
  }, a.setUpdate = async (o) => {
    const s = Object.keys(o).find((u) => u !== "update_id"), t = q(e, s, o), i = [];
    r.has(s) && i.push(...r.get(s)), r.has(null) && i.push(...r.get(null));
    const f = async ({ handler: u, reject: h }) => {
      try {
        return await u(t, s);
      } catch (m) {
        if (h)
          try {
            return await h(m, t, s);
          } catch (b) {
            return console.error("An error occurred within the .catch() handler itself:", b), m;
          }
        else
          return m;
      }
    };
    if (n.parallel === !0)
      return Promise.all(i.map(f));
    const l = [];
    for (const u of i)
      l.push(await f(u));
    return l;
  };
  const c = new Proxy(a, {
    get: (o, s) => o[s] ?? ((t = {}) => e(s, t)),
    set(o, s, t) {
      if (s in o)
        throw new y(`Can't rewrite method "${s}"`);
      if (typeof t != "function")
        throw new y(`New method "${s}" must be a function`);
      return o[s] = t(c), !0;
    }
  });
  return c;
}
function F(e, n = {}) {
  const r = x(e);
  return B(r, n);
}
export {
  F as default
};
//# sourceMappingURL=telegrambo.browser.es.js.map
