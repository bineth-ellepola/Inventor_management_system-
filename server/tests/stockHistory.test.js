const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Material = require("../models/Material");
const { getStockHistory } = require("../controllers/stockHistoryController");

const originalFind = Material.find;
const originalCount = Material.countDocuments;
afterEach(() => {
  Material.find = originalFind;
  Material.countDocuments = originalCount;
});
const response = () => ({
  code: 200,
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
});
function mockQuery(items = []) {
  const calls = {};
  Material.find = (filter) => {
    calls.filter = filter;
    const query = {};
    for (const method of ["select", "sort", "skip", "limit", "populate"]) {
      query[method] = (value) => { calls[method] = value; return query; };
    }
    query.then = (resolve, reject) => Promise.resolve(items).then(resolve, reject);
    return query;
  };
  Material.countDocuments = async (filter) => { calls.countFilter = filter; return items.length; };
  return calls;
}

test("history uses only approved adjustments and their approval time, with stable pagination", async () => {
  const items = [{ requestType: "refill", quantity: 10, approvedAt: "2026-11-17T10:00:00Z" }];
  const calls = mockQuery(items);
  const res = response();
  await getStockHistory({ query: { page: "2", limit: "5" } }, res);
  assert.deepEqual(calls.filter, { status: "Approved", requestType: { $in: ["refill", "reduce"] } });
  assert.deepEqual(calls.sort, { approvedAt: -1, _id: -1 });
  assert.equal(calls.skip, 5);
  assert.equal(calls.limit, 5);
  assert.deepEqual(calls.countFilter, calls.filter);
  assert.deepEqual(res.body.items, items);
});

test("filters a material and inclusive Sri Lanka calendar dates", async () => {
  const calls = mockQuery();
  const res = response();
  await getStockHistory({ query: {
    materialId: "507f1f77bcf86cd799439011", from: "2026-11-17", to: "2026-11-17",
    direction: "reduce", search: "Acid (A)+", category: "Chemical",
  } }, res);
  assert.equal(res.code, 200);
  assert.equal(calls.filter.refillTarget, "507f1f77bcf86cd799439011");
  assert.equal(calls.filter.requestType, "reduce");
  assert.equal(calls.filter.approvedAt.$gte.toISOString(), "2026-11-16T18:30:00.000Z");
  assert.equal(calls.filter.approvedAt.$lt.toISOString(), "2026-11-17T18:30:00.000Z");
  assert.equal(calls.filter.name.$regex, "Acid \\(A\\)\\+");
});

test("invalid filters are rejected before reading history", async () => {
  Material.find = () => { throw new Error("Should not query"); };
  for (const query of [
    { from: "2026-02-30" }, { from: "invalid" }, { from: "2026-11-18", to: "2026-11-17" },
    { materialId: "bad" }, { direction: "new" },
  ]) {
    const res = response();
    await getStockHistory({ query }, res);
    assert.equal(res.code, 400);
  }
});

test("empty results retain one page and database failures return an error", async () => {
  mockQuery();
  const res = response();
  await getStockHistory({ query: {} }, res);
  assert.equal(res.body.totalPages, 1);
  assert.equal(res.body.total, 0);
  Material.find = () => { throw new Error("Database unavailable"); };
  await getStockHistory({ query: {} }, res);
  assert.equal(res.code, 500);
});

test("history route precedes the ID route and enforces manager access", () => {
  const router = require("../routes/materialRoutes");
  const historyIndex = router.stack.findIndex((layer) => layer.route?.path === "/history");
  const idIndex = router.stack.findIndex((layer) => layer.route?.path === "/:id");
  assert.ok(historyIndex >= 0 && historyIndex < idIndex);
  const guard = router.stack[historyIndex].route.stack[0].handle;
  for (const [user, code] of [[undefined, 401], [{ role: "storekeeper" }, 403]]) {
    const res = response();
    guard({ user }, res, () => assert.fail("Must deny access"));
    assert.equal(res.code, code);
  }
  let allowed = false;
  guard({ user: { role: "manager" } }, response(), () => { allowed = true; });
  assert.equal(allowed, true);
});
