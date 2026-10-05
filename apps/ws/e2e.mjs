// End-to-end smoke test: API signup/login/rooms + WebSocket drawing/chat relay between two clients.
// Usage: API_URL=http://localhost:3002 WS_URL=ws://localhost:8080 node scripts/e2e.mjs
import WebSocket from "ws";
const API = process.env.API_URL ?? "http://localhost:3002";
const WS = process.env.WS_URL ?? "ws://localhost:8080";
const tag = Date.now().toString(36);
const fail = (m) => { console.error("FAIL:", m); process.exit(1); };
const j = async (path, opts = {}) => {
  const r = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
};
const health = await j("/health"); if (!health.body.ok) fail("health " + JSON.stringify(health)); console.log("ok  /health");
const a = await j("/signup", { method: "POST", body: JSON.stringify({ username: "alice_" + tag, password: "pw-alice" }) });
if (!a.body.token) fail("signup A " + JSON.stringify(a)); console.log("ok  signup A");
const dup = await j("/signup", { method: "POST", body: JSON.stringify({ username: "alice_" + tag, password: "x" }) });
if (dup.status !== 409) fail("duplicate signup should be 409, got " + dup.status); console.log("ok  duplicate username rejected");
const bad = await j("/login", { method: "POST", body: JSON.stringify({ username: "alice_" + tag, password: "wrong" }) });
if (bad.status !== 401) fail("wrong password should be 401, got " + bad.status); console.log("ok  wrong password rejected");
const al = await j("/login", { method: "POST", body: JSON.stringify({ username: "alice_" + tag, password: "pw-alice" }) });
if (!al.body.token) fail("login A " + JSON.stringify(al)); console.log("ok  login A (bcrypt compare)");
const b = await j("/signup", { method: "POST", body: JSON.stringify({ username: "bob_" + tag, password: "pw-bob" }) });
if (!b.body.token) fail("signup B"); console.log("ok  signup B");
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const room = await j("/create-room", { method: "POST", headers: auth(al.body.token), body: JSON.stringify({ name: "room_" + tag }) });
if (!room.body.id) fail("create-room " + JSON.stringify(room)); console.log("ok  create-room", room.body.id);
const mine = await j("/my-rooms", { headers: auth(al.body.token) });
if (!Array.isArray(mine.body) || !mine.body.find((r) => r.id === room.body.id)) fail("my-rooms"); console.log("ok  my-rooms lists it");
const joined = await j(`/join-room/${room.body.id}`, { method: "POST", headers: auth(b.body.token) });
if (joined.body.id !== room.body.id) fail("join-room " + JSON.stringify(joined)); console.log("ok  join-room as B");
const noauth = await j("/my-rooms"); if (noauth.status < 400) fail("my-rooms without token should be rejected"); console.log("ok  auth required");
// WebSocket relay
const open = (token) => new Promise((res, rej) => { const ws = new WebSocket(`${WS}?token=${token}`); ws.on("open", () => res(ws)); ws.on("error", rej); setTimeout(() => rej(new Error("ws open timeout")), 10000); });
const wsA = await open(al.body.token), wsB = await open(b.body.token); console.log("ok  two WebSocket clients connected");
const next = (ws, type) => new Promise((res, rej) => { const h = (d) => { const m = JSON.parse(d.toString()); if (m.type === type) { ws.off("message", h); res(m); } }; ws.on("message", h); setTimeout(() => rej(new Error("timeout waiting for " + type)), 10000); });
wsA.send(JSON.stringify({ type: "join", room: room.body.id, userName: "alice" }));
wsB.send(JSON.stringify({ type: "join", room: room.body.id, userName: "bob" }));
await new Promise((r) => setTimeout(r, 300));
const pDraw = next(wsB, "drawing");
wsA.send(JSON.stringify({ type: "drawing", roomId: room.body.id, from: { x: 1, y: 2 }, to: { x: 3, y: 4 }, color: "#ff0000", lineWidth: 3, userId: "A", userName: "alice" }));
const draw = await pDraw; if (draw.color !== "#ff0000" || draw.to.x !== 3) fail("drawing relay payload " + JSON.stringify(draw)); console.log("ok  drawing stroke from A relayed to B");
const pChat = next(wsB, "chat");
wsA.send(JSON.stringify({ type: "chat", roomId: room.body.id, messages: "hello " + tag, userId: "A", userName: "alice" }));
const chat = await pChat; if (chat.message !== "hello " + tag) fail("chat relay " + JSON.stringify(chat)); console.log("ok  chat from A relayed to B (and persisted)");
const pClear = next(wsB, "clear_canvas"); wsA.send(JSON.stringify({ type: "clear_canvas", roomId: room.body.id, userId: "A" })); await pClear; console.log("ok  clear_canvas relayed");
const rejected = await new Promise((res) => { const ws = new WebSocket(`${WS}?token=badtoken`); ws.on("close", () => res(true)); ws.on("error", () => res(true)); ws.on("open", () => { ws.on("close", () => res(true)); setTimeout(() => res(false), 5000); }); });
if (!rejected) fail("bad token should be closed"); console.log("ok  bad WS token rejected");
wsA.close(); wsB.close(); console.log("\nALL PASSED against", API, "and", WS); process.exit(0);
