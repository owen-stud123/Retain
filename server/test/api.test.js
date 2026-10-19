// API integration tests. They need a disposable MongoDB database:
//
//   TEST_MONGO_URI="mongodb://127.0.0.1:27017/retain_test" npm test
//
// The suite DELETES all data in that database, so it refuses to run unless the database
// name contains "test". Never point it at the Atlas production database.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import mongoose from 'mongoose';

const mongoUri = process.env.TEST_MONGO_URI;
const skip = mongoUri ? false : 'TEST_MONGO_URI is not set';

let baseUrl;
let server;
let Category;
let User;

async function api(path, { method = 'GET', token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body))
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function signup(name, email, password = 'Password123!') {
  const { status, data } = await api('/auth/signup', { method: 'POST', body: { name, email, password } });
  assert.equal(status, 201, JSON.stringify(data));
  return data;
}

describe('Retain API', { skip }, () => {
  let userA;
  let userB;
  let adminToken;
  let food;
  let transport;

  before(async () => {
    const dbName = new URL(mongoUri.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.slice(1);
    if (!/test/i.test(dbName)) {
      throw new Error(`Refusing to run: database name "${dbName}" must contain "test".`);
    }
    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET ||= 'test-only-jwt-secret-0123456789abcdef';

    const { connectDB } = await import('../src/config/db.js');
    ({ default: Category } = await import('../src/models/Category.js'));
    ({ default: User } = await import('../src/models/User.js'));
    const { default: app } = await import('../src/app.js');

    await mongoose.connect(mongoUri);
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    await connectDB();
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;

    userA = await signup('Alice', 'alice@example.com');
    userB = await signup('Bob', 'bob@example.com');
    await User.create({ name: 'Admin', email: 'admin@example.com', password: 'AdminPass123!', role: 'admin' });
    adminToken = (await api('/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'AdminPass123!' } })).data.token;
    food = await Category.create({ name: 'Food' });
    transport = await Category.create({ name: 'Transport' });
  });

  after(async () => {
    await new Promise((resolve) => server?.close(resolve) ?? resolve());
    await mongoose.disconnect();
  });

  describe('authentication', () => {
    test('signup never grants the admin role', async () => {
      const { status, data } = await api('/auth/signup', {
        method: 'POST',
        body: { name: 'Eve', email: 'eve@example.com', password: 'Password123!', role: 'admin' }
      });
      assert.equal(status, 201);
      assert.equal(data.user.role, 'user');
    });

    test('signup validates input', async () => {
      assert.equal((await api('/auth/signup', { method: 'POST', body: { name: 'X', email: 'not-an-email', password: 'Password123!' } })).status, 400);
      assert.equal((await api('/auth/signup', { method: 'POST', body: { name: 'X', email: { $gt: '' }, password: 'Password123!' } })).status, 400);
      assert.equal((await api('/auth/signup', { method: 'POST', body: { name: 'X', email: 'x@example.com', password: 'short' } })).status, 400);
    });

    test('duplicate email returns 409 with a readable message', async () => {
      const { status, data } = await api('/auth/signup', { method: 'POST', body: { name: 'A', email: 'ALICE@example.com', password: 'Password123!' } });
      assert.equal(status, 409);
      assert.match(data.message, /already registered/);
    });

    test('login rejects a wrong password and accepts the right one', async () => {
      assert.equal((await api('/auth/login', { method: 'POST', body: { email: 'alice@example.com', password: 'wrong-password' } })).status, 401);
      const { status, data } = await api('/auth/login', { method: 'POST', body: { email: 'Alice@Example.com ', password: 'Password123!' } });
      assert.equal(status, 200);
      assert.ok(data.token);
      assert.equal(data.user.password, undefined);
    });

    test('/auth/me requires a valid token', async () => {
      assert.equal((await api('/auth/me')).status, 401);
      assert.equal((await api('/auth/me', { token: 'not-a-token' })).status, 401);
      const { status, data } = await api('/auth/me', { token: userA.token });
      assert.equal(status, 200);
      assert.equal(data.user.email, 'alice@example.com');
    });

    test('malformed JSON returns 400', async () => {
      assert.equal((await api('/auth/login', { method: 'POST', raw: '{bad' })).status, 400);
    });
  });

  describe('expenses', () => {
    let expenseId;

    test('protected routes require authentication', async () => {
      assert.equal((await api('/expenses')).status, 401);
      assert.equal((await api('/dashboard')).status, 401);
      assert.equal((await api('/budgets/2026-01')).status, 401);
    });

    test('create validates required fields, amount, category and payment method', async () => {
      const valid = { title: 'Lunch', amount: 12.5, category: food._id.toString(), date: '2026-03-10T00:00:00.000Z', paymentMethod: 'card' };
      const cases = [
        { ...valid, title: '  ' },
        { ...valid, title: 123 },
        { ...valid, amount: 0 },
        { ...valid, amount: -5 },
        { ...valid, amount: '' },
        { ...valid, category: 'abc' },
        { ...valid, category: new mongoose.Types.ObjectId().toString() },
        { ...valid, paymentMethod: 'cheque' },
        { ...valid, date: 'not-a-date' }
      ];
      for (const body of cases) {
        const { status } = await api('/expenses', { method: 'POST', token: userA.token, body });
        assert.equal(status, 400, `expected 400 for ${JSON.stringify(body)}`);
      }
      const { status, data } = await api('/expenses', { method: 'POST', token: userA.token, body: { ...valid, user: userB.user.id } });
      assert.equal(status, 201);
      assert.equal(data.category.name, 'Food');
      expenseId = data._id;
      const stored = await mongoose.model('Expense').findById(expenseId);
      assert.equal(stored.user.toString(), userA.user.id, 'owner comes from the token, not the request body');
    });

    test('another user cannot read, update or delete the expense', async () => {
      assert.equal((await api(`/expenses/${expenseId}`, { token: userB.token })).status, 404);
      assert.equal((await api(`/expenses/${expenseId}`, { method: 'PUT', token: userB.token, body: { amount: 1 } })).status, 404);
      assert.equal((await api(`/expenses/${expenseId}`, { method: 'DELETE', token: userB.token })).status, 404);
      const list = await api('/expenses', { token: userB.token });
      assert.equal(list.data.total, 0);
      assert.equal((await api(`/expenses/${expenseId}`, { token: userA.token })).data.amount, 12.5);
    });

    test('owner can update, including clearing notes', async () => {
      await api(`/expenses/${expenseId}`, { method: 'PUT', token: userA.token, body: { notes: 'with notes' } });
      const { status, data } = await api(`/expenses/${expenseId}`, {
        method: 'PUT', token: userA.token, body: { title: ' Dinner ', amount: '20', notes: '' }
      });
      assert.equal(status, 200);
      assert.equal(data.title, 'Dinner');
      assert.equal(data.amount, 20);
      assert.equal(data.notes, '');
      assert.equal((await api(`/expenses/${expenseId}`, { method: 'PUT', token: userA.token, body: { amount: -1 } })).status, 400);
    });

    test('invalid ids return 400 and unknown ids 404', async () => {
      assert.equal((await api('/expenses/not-an-id', { token: userA.token })).status, 400);
      assert.equal((await api(`/expenses/${new mongoose.Types.ObjectId()}`, { token: userA.token })).status, 404);
    });

    test('owner can delete', async () => {
      assert.equal((await api(`/expenses/${expenseId}`, { method: 'DELETE', token: userA.token })).status, 200);
      assert.equal((await api(`/expenses/${expenseId}`, { token: userA.token })).status, 404);
    });
  });

  describe('search, filters, sorting and pagination', () => {
    before(async () => {
      const titles = ['Coffee (large)', 'Bus ticket', 'Groceries', 'Taxi', 'Coffee beans', 'Rent', 'Cinema', 'Train', 'Dinner', 'Snacks', 'Fuel', 'Book'];
      for (const [index, title] of titles.entries()) {
        await api('/expenses', {
          method: 'POST',
          token: userA.token,
          body: {
            title,
            amount: (index + 1) * 10,
            category: (index % 2 ? transport : food)._id.toString(),
            date: new Date(Date.UTC(2026, 2, index + 1, 15, 30)).toISOString(),
            paymentMethod: index % 3 ? 'card' : 'cash'
          }
        });
      }
    });

    test('search is case-insensitive and treats regex characters literally', async () => {
      assert.equal((await api('/expenses?search=COFFEE', { token: userA.token })).data.total, 2);
      const special = await api(`/expenses?search=${encodeURIComponent('(large)')}`, { token: userA.token });
      assert.equal(special.status, 200);
      assert.equal(special.data.total, 1);
      assert.equal((await api(`/expenses?search=${encodeURIComponent('.*')}`, { token: userA.token })).data.total, 0);
    });

    test('filters by category, payment method and amount range', async () => {
      assert.equal((await api(`/expenses?category=${transport._id}`, { token: userA.token })).data.total, 6);
      assert.equal((await api('/expenses?paymentMethod=cash', { token: userA.token })).data.total, 4);
      assert.equal((await api('/expenses?minAmount=50&maxAmount=80', { token: userA.token })).data.total, 4);
    });

    test('a date-only end date includes expenses later that day', async () => {
      const { data } = await api('/expenses?startDate=2026-03-02&endDate=2026-03-04', { token: userA.token });
      assert.equal(data.total, 3);
    });

    test('invalid filter values return 400 instead of 500', async () => {
      for (const query of ['category=abc', 'startDate=nope', 'endDate=nope', 'minAmount=abc', 'paymentMethod=gold', 'search=a&search=b']) {
        const { status } = await api(`/expenses?${query}`, { token: userA.token });
        assert.equal(status, 400, query);
      }
    });

    test('sorts by amount and date in both directions', async () => {
      const asc = await api('/expenses?sortBy=amount&order=asc&limit=3', { token: userA.token });
      assert.deepEqual(asc.data.items.map((item) => item.amount), [10, 20, 30]);
      const desc = await api('/expenses?sortBy=date&order=desc&limit=1', { token: userA.token });
      assert.equal(desc.data.items[0].title, 'Book');
    });

    test('pagination metadata matches the filtered result', async () => {
      const page1 = await api('/expenses?limit=5&page=1&sortBy=amount&order=asc', { token: userA.token });
      const page3 = await api('/expenses?limit=5&page=3&sortBy=amount&order=asc', { token: userA.token });
      assert.equal(page1.data.total, 12);
      assert.equal(page1.data.pages, 3);
      assert.equal(page1.data.items.length, 5);
      assert.equal(page3.data.items.length, 2);
      const filtered = await api(`/expenses?limit=5&category=${food._id}`, { token: userA.token });
      assert.equal(filtered.data.total, 6);
      assert.equal(filtered.data.pages, 2);
      const seen = new Set();
      for (let page = 1; page <= 3; page += 1) {
        const { data } = await api(`/expenses?limit=5&page=${page}&sortBy=date`, { token: userA.token });
        data.items.forEach((item) => seen.add(item._id));
      }
      assert.equal(seen.size, 12, 'every record appears exactly once across pages');
    });
  });

  describe('budgets and dashboard', () => {
    test('budget validates month and amount', async () => {
      assert.equal((await api('/budgets/2026-13', { token: userA.token })).status, 400);
      assert.equal((await api('/budgets/2026-03', { method: 'PUT', token: userA.token, body: { amount: -1 } })).status, 400);
      assert.equal((await api('/budgets/2026-03', { method: 'PUT', token: userA.token, body: { amount: '' } })).status, 400);
    });

    test('budget totals only count the owner\'s expenses in that month', async () => {
      await api('/expenses', {
        method: 'POST',
        token: userB.token,
        body: { title: 'Bob only', amount: 999, category: food._id.toString(), date: '2026-03-05T00:00:00.000Z', paymentMethod: 'cash' }
      });
      await api('/expenses', {
        method: 'POST',
        token: userA.token,
        body: { title: 'April', amount: 1000, category: food._id.toString(), date: '2026-04-01T00:00:00.000Z', paymentMethod: 'cash' }
      });
      const { status, data } = await api('/budgets/2026-03', { method: 'PUT', token: userA.token, body: { amount: 500 } });
      assert.equal(status, 200);
      assert.equal(data.spent, 780);
      assert.equal(data.remaining, -280);
      assert.equal(data.percentUsed, 156);
      assert.equal(data.status, 'over');
      const approaching = await api('/budgets/2026-03', { method: 'PUT', token: userA.token, body: { amount: 900 } });
      assert.equal(approaching.data.status, 'approaching');
      const within = await api('/budgets/2026-03', { method: 'PUT', token: userA.token, body: { amount: 2000 } });
      assert.equal(within.data.status, 'within');
    });

    test('dashboard summarises the selected month', async () => {
      const { status, data } = await api('/dashboard?month=2026-03', { token: userA.token });
      assert.equal(status, 200);
      assert.equal(data.totalSpent, 780);
      assert.equal(data.budget.amount, 2000);
      assert.equal(data.highestExpense.amount, 120);
      assert.equal(data.recentExpenses.length, 5);
      const byName = Object.fromEntries(data.byCategory.map((item) => [item.name, item]));
      assert.equal(byName.Food.total, 360);
      assert.equal(byName.Food.count, 6);
      assert.equal(byName.Transport.total, 420);
      assert.equal((await api('/dashboard?month=bad', { token: userA.token })).status, 400);
    });

    test('an empty month has zero totals', async () => {
      const { data } = await api('/dashboard?month=2020-01', { token: userA.token });
      assert.equal(data.totalSpent, 0);
      assert.equal(data.highestExpense, null);
      assert.deepEqual(data.byCategory, []);
    });
  });

  describe('admin', () => {
    test('regular users cannot use admin endpoints', async () => {
      assert.equal((await api('/admin/insights', { token: userA.token })).status, 403);
      assert.equal((await api('/categories', { method: 'POST', token: userA.token, body: { name: 'Hack' } })).status, 403);
      assert.equal((await api(`/categories/${food._id}`, { method: 'PUT', token: userA.token, body: { name: 'Hack' } })).status, 403);
      assert.equal((await api(`/categories/${food._id}`, { method: 'DELETE', token: userA.token })).status, 403);
      assert.equal((await api('/categories', { token: userA.token })).status, 200, 'users can still read categories');
    });

    test('admin can create, rename and reject duplicate categories', async () => {
      const created = await api('/categories', { method: 'POST', token: adminToken, body: { name: 'Health' } });
      assert.equal(created.status, 201);
      assert.equal((await api('/categories', { method: 'POST', token: adminToken, body: { name: 'Food' } })).status, 409);
      assert.equal((await api('/categories', { method: 'POST', token: adminToken, body: { name: ' ' } })).status, 400);
      const renamed = await api(`/categories/${created.data._id}`, { method: 'PUT', token: adminToken, body: { name: 'Wellness' } });
      assert.equal(renamed.data.name, 'Wellness');
      assert.equal((await api(`/categories/${created.data._id}`, { method: 'PUT', token: adminToken, body: { name: 'Transport' } })).status, 409);
    });

    test('the default category cannot be renamed or deleted', async () => {
      const uncategorized = await Category.findOne({ isDefault: true });
      assert.equal((await api(`/categories/${uncategorized._id}`, { method: 'PUT', token: adminToken, body: { name: 'Other' } })).status, 400);
      assert.equal((await api(`/categories/${uncategorized._id}`, { method: 'DELETE', token: adminToken })).status, 400);
    });

    test('deleting a category moves its expenses to Uncategorized', async () => {
      const { status, data } = await api(`/categories/${transport._id}`, { method: 'DELETE', token: adminToken });
      assert.equal(status, 200);
      assert.equal(data.reassignedExpenses, 6);
      const uncategorized = await Category.findOne({ isDefault: true });
      const moved = await api(`/expenses?category=${uncategorized._id}`, { token: userA.token });
      assert.equal(moved.data.total, 6);
    });

    test('insights report platform totals', async () => {
      const { status, data } = await api('/admin/insights', { token: adminToken });
      assert.equal(status, 200);
      assert.equal(data.totalUsers, 4);
      assert.equal(data.totalExpenses, 14);
      assert.equal(data.totalExpenseValue, 780 + 999 + 1000);
      assert.ok(Array.isArray(data.topCategories));
      assert.ok(Array.isArray(data.bottomCategories));
      assert.equal(data.recentUsers.some((user) => 'password' in user), false);
    });
  });
});
