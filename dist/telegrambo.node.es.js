import b from "https";
import { URL as $ } from "url";
const w = /* @__PURE__ */ new Set(["chat_id", "from_chat_id", "text"]);
function C(t) {
  const e = {};
  for (let [n, u] of t)
    w.has(n) ? e[n] = String(u) : typeof u == "object" ? e[n] = JSON.stringify(u) : e[n] = u;
  return e;
}
function x(t, { timeout: e = 3e4, apiUrl: n = "https://api.telegram.org" } = {}) {
  if (!t || typeof t != "string")
    throw new Error("Token must be a non-empty string");
  return async function(f, a = {}) {
    if (!f || typeof f != "string")
      throw new Error("Method must be a non-empty string");
    const o = `${n}/bot${t}/${f}`, i = Object.entries(a), r = i.some(([c, s]) => _(s) ? !0 : c === "media" && Array.isArray(s) ? s.some((d) => _(d?.media)) : !1) ? B(i) : S(C(i));
    return q(o, r, e);
  };
}
function _(t) {
  return !t || typeof t != "object" ? !1 : t instanceof Buffer || typeof t.pipe == "function" || t.source instanceof Buffer || typeof t.source?.pipe == "function";
}
function S(t) {
  const e = JSON.stringify(t);
  return {
    body: Buffer.from(e),
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(e)
    }
  };
}
function B(t) {
  const e = `----TB${Date.now()}${Math.random().toString(36).slice(2)}`, n = `\r
`, u = [], f = [];
  let a = 0;
  function o(r, c) {
    if (_(c)) {
      const s = `file${a++}`;
      return f.push({ name: s, value: c }), `attach://${s}`;
    }
    return r === "media" && Array.isArray(c) ? c.map((s) => {
      if (s && typeof s == "object" && _(s.media)) {
        const d = `file${a++}`;
        return f.push({ name: d, value: s.media }), { ...s, media: `attach://${d}` };
      }
      return s;
    }) : c;
  }
  function i(r) {
    const c = r instanceof Buffer || typeof r.pipe == "function";
    return {
      source: c ? r : r.source,
      filename: c ? "file" : r.filename || "file",
      contentType: c ? "application/octet-stream" : r.contentType || "application/octet-stream"
    };
  }
  for (const [r, c] of t) {
    const s = o(r, c);
    u.push(
      `--${e}${n}`,
      `Content-Disposition: form-data; name="${r}"${n}${n}`,
      typeof s == "object" && s !== null ? JSON.stringify(s) : String(s),
      n
    );
  }
  for (const { name: r, value: c } of f) {
    const { source: s, filename: d, contentType: m } = i(c);
    u.push(
      `--${e}${n}`,
      `Content-Disposition: form-data; name="${r}"; filename="${d}"${n}`,
      `Content-Type: ${m}${n}${n}`,
      s,
      n
    );
  }
  u.push(`--${e}--${n}`);
  const h = Buffer.concat(u.map((r) => Buffer.isBuffer(r) ? r : Buffer.from(r)));
  return {
    body: h,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${e}`,
      "Content-Length": h.length
    }
  };
}
function q(t, { body: e, headers: n }, u) {
  return new Promise((f, a) => {
    const { hostname: o, port: i, pathname: h } = new $(t), r = b.request({
      hostname: o,
      port: i || 443,
      path: h,
      method: "POST",
      headers: n,
      timeout: u
    }, (c) => {
      const s = [];
      c.on("data", (d) => s.push(d)), c.on("end", () => {
        try {
          const d = JSON.parse(Buffer.concat(s).toString());
          f(d);
        } catch (d) {
          a(new Error(`Parse error: ${d.message}`));
        }
      });
    });
    r.on("error", a), r.on("timeout", () => {
      r.destroy(), a(new Error("Request timeout"));
    }), r.write(e), r.end();
  });
}
const l = /* @__PURE__ */ new Map();
l.set("message", (t) => ({
  chat_id: t.chat.id,
  from_chat_id: t.chat.id,
  message_id: t.message_id,
  message_thread_id: t?.message_thread_id,
  direct_messages_topic_id: t?.direct_messages_topic?.topic_id
}));
const p = (t) => ({
  business_connection_id: t.business_connection_id,
  chat_id: t.chat.id,
  message_id: t.message_id
});
l.set("business_message", p);
l.set("edited_business_message", p);
l.set("deleted_business_messages", p);
l.set("business_connection", (t) => ({
  chat_id: t.user_chat_id
  // business_connection_id: event.id
}));
l.set("callback_query", (t) => ({
  chat_id: t.message.chat.id,
  callback_query_id: t.id,
  message_id: t.message.message_id
}));
l.set("inline_query", (t) => ({
  inline_query_id: t.id
}));
l.set("channel_post", (t) => ({
  chat_id: t.chat.id,
  message_id: t.message_id
}));
l.set("poll_answer", (t) => ({
  chat_id: "user" in t ? t.user.id : t.voter_chat.id
}));
l.set("chat_join_request", (t) => ({
  chat_id: t.from.id
}));
l.set("chat_boost", (t) => ({
  chat_id: t.boost.source.user.id
}));
l.set("removed_chat_boost", (t) => ({
  chat_id: t.source.user.id
}));
function E(t, e) {
  return l.has(t) ? l.get(t)(e) : {};
}
function O(t, e, n) {
  const u = n[e], f = E(e, u);
  return new Proxy(u, {
    get(o, i) {
      return i in o ? o[i] : i === "update" ? n : i === "payload" ? f : (h = {}) => t(i, { ...f, ...h });
    }
  });
}
function T() {
  const t = /* @__PURE__ */ new Map();
  return {
    has: (e) => t.has(e),
    get: (e) => t.get(e),
    add(e, n) {
      t.has(e) ? t.get(e).push(n) : t.set(e, [n]);
    }
  };
}
class y extends Error {
  constructor(e) {
    super(e), this.name = "BotContextErrors";
  }
}
function j(t, e = {}) {
  const n = T(), u = {};
  u.on = (a, o) => {
    typeof a == "function" && (o = a, a = null);
    const i = { handler: o };
    return n.add(a, i), {
      catch(h) {
        i.reject = h;
      }
    };
  }, u.setUpdate = async (a) => {
    const o = Object.keys(a).find((s) => s !== "update_id"), i = O(t, o, a), h = [];
    n.has(o) && h.push(...n.get(o)), n.has(null) && h.push(...n.get(null));
    const r = async ({ handler: s, reject: d }) => {
      try {
        return await s(i, o);
      } catch (m) {
        if (d)
          try {
            return await d(m, i, o);
          } catch (g) {
            return console.error("An error occurred within the .catch() handler itself:", g), m;
          }
        else
          return m;
      }
    };
    if (e.parallel === !0)
      return Promise.all(h.map(r));
    const c = [];
    for (const s of h)
      c.push(await r(s));
    return c;
  };
  const f = new Proxy(u, {
    get: (a, o) => a[o] ?? ((i = {}) => t(o, i)),
    set(a, o, i) {
      if (o in a)
        throw new y(`Can't rewrite method "${o}"`);
      if (typeof i != "function")
        throw new y(`New method "${o}" must be a function`);
      return a[o] = i(f), !0;
    }
  });
  return f;
}
function D(t, e = {}) {
  const n = x(t);
  return j(n, e);
}
export {
  j as botContext,
  D as createNodeBot,
  D as default
};
//# sourceMappingURL=telegrambo.node.es.js.map
