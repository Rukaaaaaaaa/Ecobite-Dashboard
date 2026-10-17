// Browser contract smoke test. Uses a disposable HTTP stub, never the team database.
// Requires an installed Chromium browser; set ECOBITE_BROWSER if Edge isn't at the default path.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createServer } from 'vite';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = await mkdtemp(join(tmpdir(), 'ecobite-order-smoke-'));
let browser;
let socket;
let vite;
const errors = [];
const mutations = [];
const requests = [];
const order = {
  id: 'ord_smoke', orderCode: 'EB-SMOKE-001', restaurantId: 'res_smoke', status: 'paid',
  customer: 'Khách kiểm thử', phoneMasked: '091••••678',
  items: [{ foodBagId: 'bag_1', name: 'Cơm kiểm thử', quantity: 2, unitPrice: 30000, ownBox: true },
    { foodBagId: 'bag_2', name: 'Canh kiểm thử', quantity: 1, unitPrice: 10000, ownBox: false }],
  money: { subtotal: 70000, ownBoxDiscount: 4000, promoDiscount: 0, total: 66000 },
  paymentMethod: 'cash', paymentStatus: 'pending', pickupSlot: { date: '2026-10-15', start: '18:30', end: '19:00' },
  statusHistory: { paid: '2026-10-15T10:00:00.000+07:00' }, createdAt: '2026-10-15T10:00:00.000+07:00',
};
let session = { account: { id: 'usr_smoke', name: 'Chủ quán kiểm thử', phone: '0988888888' },
  restaurant: { id: 'res_smoke', name: 'Quán kiểm thử', address: 'Hà Nội', phone: '0988888888' } };
let visibleOrders = [];
let expireSession = false;
let registrations = 0;
const api = createHttpServer(async (req, res) => {
  requests.push(`${req.method} ${req.url}: ${order.status}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const send = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (req.url === '/api/merchant/register') {
    assert.equal(body.phone, '0977000001');
    assert.equal(body.password, 'Restaurant123');
    assert.equal(body.restaurantName, 'Bếp đăng ký');
    assert.equal(body.fullName, 'Chủ quán mới');
    assert.equal(body.address, '12 Cầu Giấy, Hà Nội');
    assert.equal(body.restaurantId, undefined);
    registrations++;
    session = { account: { id: 'merchant_new', name: body.fullName, phone: body.phone },
      restaurant: { id: 'res_new', name: body.restaurantName, address: body.address, phone: body.phone, published: false } };
    visibleOrders = [];
    send({ ...session, accessToken: 'smoke-token' }, 201); return;
  }
  if (req.url === '/api/merchant/login') { send({ ...session, accessToken: 'smoke-token' }, 201); return; }
  if (req.headers.authorization !== 'Bearer smoke-token' || expireSession) { send({ code: 'unauthenticated', message: 'Session expired' }, 401); return; }
  if (req.url === '/api/merchant/session') { send(session); return; }
  if (req.url === '/api/merchant/manage/profile') { send({ name: session.restaurant.name, street: session.restaurant.address, phone: session.restaurant.phone, businessType: '', description: '', ward: '', district: '', city: '', directions: '', zalo: '', lat: null, lng: null, openingHours: [], bank: { bankName: '', accountNumber: '', accountHolder: '' } }); return; }
  if (req.url === '/api/merchant/manage/products') { send([]); return; }
  if (req.url === '/api/merchant/manage/wallet') { send({ available: 0, holding: 0, bank: null, lastWithdrawal: null, period: { from: '2026-10-01', to: '2026-10-17', moneyIn: 0, moneyOut: 0, withdrawals: 0, fee: 0 } }); return; }
  if (req.url === '/api/merchant/manage/wallet/transactions') { send([]); return; }
  if (req.url === '/api/merchant/orders') { send(visibleOrders); return; }
  if (req.url === '/api/merchant/orders/ord_smoke') { send(order); return; }
  if (req.url === '/api/merchant/orders/ord_smoke/advance') {
    assert.equal(body.expectedStatus, order.status);
    mutations.push(body.expectedStatus);
    order.status = order.status === 'paid' ? 'preparing' : 'ready';
    send(order, 201); return;
  }
  if (req.url === '/api/merchant/pickup/lookup') { assert.equal(body.token, 'pk_CaseSensitive_smoke'); send(order, 201); return; }
  if (req.url === '/api/merchant/orders/ord_smoke/verify-pickup') {
    assert.equal(body.token, 'pk_CaseSensitive_smoke');
    order.status = 'qr_verified'; send(order, 201); return;
  }
  send({ code: 'not_found', message: req.url }, 404);
});

try {
  await new Promise((resolve, reject) => { api.once('error', reject); api.listen(3000, '127.0.0.1', resolve); });
  vite = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true },
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:3000/api'), 'import.meta.env.VITE_DEMO_MODE': JSON.stringify('false') } });
  await vite.listen();
  browser = spawn(process.env.ECOBITE_BROWSER || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { windowsHide: true, stdio: 'ignore' });
  browser.on('error', (error) => errors.push(error.message));
  let page;
  for (let i = 0; i < 100; i++) {
    try {
      const port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
      if (page) break;
    } catch {}
    await pause(100);
  }
  assert.ok(page, `Browser did not start: ${errors.join(', ')}`);
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const calls = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const call = calls.get(message.id);
      calls.delete(message.id);
      if (message.error) call?.reject(new Error(message.error.message)); else call?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; calls.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 160; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timed out: ${expression}\nVisibility: ${await evaluate('document.visibilityState')}\nRequests: ${requests.slice(-12).join('\n')}\n${await evaluate('document.body.innerText')}`);
  };
  const input = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const navigate = (path) => evaluate(`history.pushState({}, '', ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent('popstate'));`);
  await cdp('Runtime.enable');
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true });
  await cdp('Page.bringToFront');
  await cdp('Page.navigate', { url: 'http://127.0.0.1:5174/login' });
  await waitFor(`!!document.querySelector('input[type="password"]')`);
  await input('input[type="tel"]', '0988888888');
  await input('input[type="password"]', 'OwnerTest123');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`document.body.innerText.includes('Chưa có đơn hàng')`);
  visibleOrders = [order];
  await waitFor(`document.body.innerText.includes('EB-SMOKE-001')`);
  await navigate('/orders/pending');
  await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent === 'Xác nhận')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Xác nhận').click()`);
  await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent === 'Đã soạn xong')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Đã soạn xong').click()`);
  await waitFor(`document.body.innerText.includes('Chờ khách lấy')`);
  assert.deepEqual(mutations, ['paid', 'preparing']);
  await navigate('/orders/ord_smoke');
  await waitFor(`document.body.innerText.includes('Tiền mặt · cần thu tại quán') && document.body.innerText.includes('Canh kiểm thử')`);
  await navigate('/orders/verify');
  await waitFor(`!!document.querySelector('input[aria-label="Mã nhận hàng"]')`);
  await input('input[aria-label="Mã nhận hàng"]', 'pk_CaseSensitive_smoke');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent === 'Xác minh và giao túi')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent === 'Xác minh và giao túi').click()`);
  await waitFor(`document.body.innerText.includes('Khách xác nhận đã nhận túi')`);
  assert.equal(order.status, 'qr_verified');
  await navigate('/orders');
  await waitFor(`document.body.innerText.includes('Đã xác minh · chờ khách xác nhận')`);
  // Simulate the customer-side confirmation arriving on the shared backend.
  order.status = 'picked_up'; order.paymentStatus = 'success';
  await waitFor(`document.querySelector('tbody')?.innerText.includes('Hoàn thành')`);
  await navigate('/wallet');
  await waitFor(`document.body.innerText.includes('Số dư khả dụng')`);
  await navigate('/products');
  await waitFor(`document.body.innerText.includes('Bạn chưa có sản phẩm nào')`);
  await navigate('/profile');
  await waitFor(`document.body.innerText.includes('Thông tin nhà hàng') && document.body.innerText.includes('Quán kiểm thử')`);
  await navigate('/orders');
  expireSession = true;
  await waitFor(`location.pathname === '/login'`);
  expireSession = false;
  await waitFor(`!!document.querySelector('a[href="/register"]')`);
  await evaluate(`document.querySelector('a[href="/register"]').click()`);
  await waitFor(`!!document.querySelector('input[name="restaurantName"]')`);
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`document.body.innerText.includes('Nhập tên nhà hàng')`);
  assert.equal(registrations, 0);
  await input('input[name="fullName"]', 'Chủ quán mới');
  await input('input[name="phone"]', '0977000001');
  await input('input[name="restaurantName"]', 'Bếp đăng ký');
  await input('input[name="address"]', '12 Cầu Giấy, Hà Nội');
  await input('input[name="password"]', 'Restaurant123');
  await input('input[name="confirm"]', 'Wrong123');
  await evaluate(`document.querySelector('input[type="checkbox"]').click()`);
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`document.body.innerText.includes('Hai mật khẩu chưa khớp nhau')`);
  assert.equal(registrations, 0);
  await input('input[name="confirm"]', 'Restaurant123');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`location.pathname === '/' && document.body.innerText.includes('Chủ quán mới') && document.body.innerText.includes('Chưa có đơn hàng')`);
  assert.equal(registrations, 1);
  await evaluate(`document.querySelector('button.me').click()`);
  await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Đăng xuất')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Đăng xuất').click()`);
  await waitFor(`location.pathname === '/login' && !!document.querySelector('input[type="password"]')`);
  await input('input[type="tel"]', '0977000001');
  await input('input[type="password"]', 'Restaurant123');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await waitFor(`location.pathname === '/' && document.body.innerText.includes('Bếp đăng ký')`);
  assert.deepEqual(errors, []);
  console.log('PASS: signup validation, automatic sign-in, logout/login, new-order polling, preparing/ready updates, multi-item cash detail, pickup verification, customer completion polling, restored wallet/products/profile navigation, session expiry.');
} finally {
  socket?.close();
  browser?.kill();
  await vite?.close();
  api.closeAllConnections();
  await new Promise((resolve) => api.close(resolve));
  // Only this test's newly created temporary browser profile is removed.
  assert.equal(dirname(resolve(profile)), resolve(tmpdir()));
  assert.ok(basename(profile).startsWith('ecobite-order-smoke-'));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
