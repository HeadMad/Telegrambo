import S from "https";
import { URL as x } from "url";
import { promises as E } from "fs";
const j = /* @__PURE__ */ new Set(["chat_id", "from_chat_id", "text"]);
function O(t) {
  const e = {};
  for (let [n, u] of t)
    j.has(n) ? e[n] = String(u) : typeof u == "object" ? e[n] = JSON.stringify(u) : e[n] = u;
  return e;
}
function q(t, { timeout: e = 3e4, apiUrl: n = "https://api.telegram.org" } = {}) {
  if (!t || typeof t != "string")
    throw new Error("Token must be a non-empty string");
  return async function(f, i = {}) {
    if (!f || typeof f != "string")
      throw new Error("Method must be a non-empty string");
    const r = `${n}/bot${t}/${f}`, o = Object.entries(i), d = o.some(([c, s]) => y(s) ? !0 : c === "media" && Array.isArray(s) ? s.some((a) => y(a?.media)) : !1) ? await T(o) : P(O(o));
    return R(r, d, e);
  };
}
function y(t) {
  return !t || typeof t != "object" ? !1 : t instanceof Buffer || typeof t.pipe == "function" && t.path || // Ensure it's a file stream
  t.source instanceof Buffer || typeof t.source?.pipe == "function" && t.source.path;
}
function P(t) {
  const e = JSON.stringify(t), n = Buffer.from(e);
  return {
    body: n,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": n.length
    }
  };
}
async function N(t) {
  if (t instanceof Buffer)
    return { size: t.length, stream: t };
  if (typeof t.pipe == "function" && t.path)
    return { size: (await E.stat(t.path)).size, stream: t };
  throw new Error("Invalid file source provided.");
}
async function T(t) {
  const e = `----TB${Date.now()}${Math.random().toString(36).slice(2)}`, n = `\r
`, u = `--${e}--${n}`, f = [];
  let i = 0;
  const r = [], o = {};
  let h = 0;
  for (const [c, s] of t)
    if (y(s)) {
      const a = `file${h++}`;
      r.push({ fieldName: a, file: s }), o[c] = `attach://${a}`;
    } else c === "media" && Array.isArray(s) ? o[c] = s.map((a) => {
      if (a && typeof a == "object" && y(a.media)) {
        const p = `file${h++}`;
        return r.push({ fieldName: p, file: a.media }), { ...a, media: `attach://${p}` };
      }
      return a;
    }) : o[c] = s;
  for (const [c, s] of Object.entries(o)) {
    const a = typeof s == "object" && s !== null, p = a ? JSON.stringify(s) : String(s);
    let m = `--${e}${n}`;
    m += `Content-Disposition: form-data; name="${c}"${n}`, a && (m += `Content-Type: application/json${n}`), m += `${n}${p}${n}`;
    const _ = Buffer.from(m);
    f.push(_), i += _.length;
  }
  for (const { fieldName: c, file: s } of r) {
    const { source: a, filename: p = "file", contentType: m = "application/octet-stream" } = s, { size: _, stream: B } = await N(a || s), C = [
      `--${e}${n}`,
      `Content-Disposition: form-data; name="${c}"; filename="${p}"${n}`,
      `Content-Type: ${m}${n}${n}`
    ].join(""), b = Buffer.from(C);
    f.push(b), i += b.length, f.push(B), i += _;
    const w = Buffer.from(n);
    f.push(w), i += w.length;
  }
  const d = Buffer.from(u);
  return f.push(d), i += d.length, {
    body: f,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${e}`,
      "Content-Length": i
    }
  };
}
function R(t, { body: e, headers: n }, u) {
  return new Promise((f, i) => {
    const { hostname: r, port: o, pathname: h } = new x(t), d = S.request(
      {
        hostname: r,
        port: o || 443,
        path: h,
        method: "POST",
        headers: n,
        timeout: u
      },
      (c) => {
        const s = [];
        c.on("data", (a) => s.push(a)), c.on("end", () => {
          const a = Buffer.concat(s).toString();
          try {
            const p = JSON.parse(a);
            f(p);
          } catch {
            i(new Error(`Failed to parse response: ${a}`));
          }
        });
      }
    );
    d.on("error", i), d.on("timeout", () => {
      d.destroy(), i(new Error("Request timeout"));
    }), Array.isArray(e) ? (async () => {
      try {
        for (const c of e)
          c instanceof Buffer ? d.write(c) : await new Promise((s, a) => {
            c.on("error", a), c.pipe(d, { end: !1 }), c.on("end", s);
          });
        d.end();
      } catch (c) {
        d.destroy(c);
      }
    })() : (d.write(e), d.end());
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
const g = (t) => ({
  business_connection_id: t.business_connection_id,
  chat_id: t.chat.id,
  message_id: t.message_id
});
l.set("business_message", g);
l.set("edited_business_message", g);
l.set("deleted_business_messages", g);
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
function A(t, e) {
  return l.has(t) ? l.get(t)(e) : {};
}
function k(t, e, n) {
  const u = n[e], f = A(e, u);
  return new Proxy(u, {
    get(r, o) {
      return o in r ? r[o] : o === "update" ? n : o === "payload" ? f : (h = {}) => t(o, { ...f, ...h });
    }
  });
}
function D() {
  const t = /* @__PURE__ */ new Map();
  return {
    has: (e) => t.has(e),
    get: (e) => t.get(e),
    add(e, n) {
      t.has(e) ? t.get(e).push(n) : t.set(e, [n]);
    }
  };
}
class $ extends Error {
  constructor(e) {
    super(e), this.name = "BotContextErrors";
  }
}
function J(t, e = {}) {
  const n = D(), u = {};
  u.on = (i, r) => {
    typeof i == "function" && (r = i, i = null);
    const o = { handler: r };
    return n.add(i, o), {
      catch(h) {
        o.reject = h;
      }
    };
  }, u.setUpdate = async (i) => {
    const r = Object.keys(i).find((s) => s !== "update_id"), o = k(t, r, i), h = [];
    n.has(r) && h.push(...n.get(r)), n.has(null) && h.push(...n.get(null));
    const d = async ({ handler: s, reject: a }) => {
      try {
        return await s(o, r);
      } catch (p) {
        if (a)
          try {
            return await a(p, o, r);
          } catch (m) {
            return console.error("An error occurred within the .catch() handler itself:", m), p;
          }
        else
          return p;
      }
    };
    if (e.parallel === !0)
      return Promise.all(h.map(d));
    const c = [];
    for (const s of h)
      c.push(await d(s));
    return c;
  };
  const f = new Proxy(u, {
    get: (i, r) => i[r] ?? ((o = {}) => t(r, o)),
    set(i, r, o) {
      if (r in i)
        throw new $(`Can't rewrite method "${r}"`);
      if (typeof o != "function")
        throw new $(`New method "${r}" must be a function`);
      return i[r] = o(f), !0;
    }
  });
  return f;
}
function I(t, { timeout: e = 3e4, apiUrl: n = "https://api.telegram.org", ...u } = {}) {
  const f = q(t, { timeout: e, apiUrl: n });
  return J(f, u);
}
export {
  I as default
};
//# sourceMappingURL=telegrambo.node.es.js.map
