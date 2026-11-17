const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const Material = require("../models/Material");
const { monthRange, summarize, createMonthlyStockPdf } = require("../utils/monthlyStockReport");
const { getMonthlyStockReport } = require("../controllers/stockHistoryController");

const originalFind = Material.find;
afterEach(() => { Material.find = originalFind; });
const response = () => ({
  code: 200, headers: {},
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
  set(key, value) { this.headers[key] = value; return this; },
  send(body) { this.body = body; return this; },
});
const movement = (overrides = {}) => ({
  name: "Citric acid", refillTarget: "material-1", unitType: "kg", category: "Chemical",
  requestType: "refill", quantity: 10, approvedAt: new Date("2026-11-10T10:00:00Z"),
  createdBy: { name: "Store Keeper" }, approvedBy: { name: "Manager" }, ...overrides,
});

test("monthly boundaries use Sri Lanka midnight, including leap years and December rollover", () => {
  const november = monthRange("2026-11");
  assert.equal(november.start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(november.end.toISOString(), "2026-11-30T18:30:00.000Z");
  assert.equal(monthRange("2024-02").end.toISOString(), "2024-02-29T18:30:00.000Z");
  assert.equal(monthRange("2026-12").end.toISOString(), "2026-12-31T18:30:00.000Z");
  for (const value of [undefined, "", "2026-13", "2026-00", "2026-1", "2026-11-01", ["2026-11"]]) {
    assert.equal(monthRange(value), null);
  }
});

test("summary keeps material identities and units separate and totals both directions", () => {
  const summary = summarize([
    movement(), movement({ requestType: "reduce", quantity: 3.5 }),
    movement({ refillTarget: "material-2", quantity: 4 }),
    movement({ unitType: "g", quantity: 500 }),
  ]);
  assert.equal(summary.length, 3);
  assert.equal(summary[0].increase, 10);
  assert.equal(summary[0].reduction, 3.5);
  assert.equal(summary[2].unit, "g");
});

test("PDF generation supports empty months and reports spanning several pages", async () => {
  const empty = await createMonthlyStockPdf("2026-11", []);
  assert.equal(empty.subarray(0, 5).toString(), "%PDF-");
  assert.ok(empty.toString().includes("%%EOF"));
  const large = await createMonthlyStockPdf("2026-11", Array.from({ length: 150 }, (_, i) => movement({ quantity: i + 1 })));
  const pages = large.toString().match(/\/Type \/Page\b/g) || [];
  assert.ok(pages.length > 1);
  assert.ok(large.toString().includes("%%EOF"));
});

test("report queries the full approved month without history pagination or filters", async () => {
  let filter;
  Material.find = (value) => {
    filter = value;
    return { sort() { return this; }, populate() { return this; }, lean: async () => [movement()] };
  };
  const res = response();
  await getMonthlyStockReport({ query: { month: "2026-11", page: "2", limit: "1", direction: "reduce" } }, res);
  assert.equal(res.code, 200);
  assert.equal(filter.status, "Approved");
  assert.deepEqual(filter.requestType, { $in: ["refill", "reduce"] });
  assert.equal(filter.approvedAt.$lt.toISOString(), "2026-11-30T18:30:00.000Z");
  assert.equal(res.headers["Content-Type"], "application/pdf");
  assert.equal(res.headers["Content-Disposition"], 'attachment; filename="stock-report-2026-11.pdf"');
  assert.equal(res.body.subarray(0, 5).toString(), "%PDF-");
});

test("invalid months and query failures return useful errors", async () => {
  Material.find = () => { throw new Error("Database unavailable"); };
  const res = response();
  await getMonthlyStockReport({ query: {} }, res);
  assert.equal(res.code, 400);
  await getMonthlyStockReport({ query: { month: "2026-11" } }, res);
  assert.equal(res.code, 500);
});

test("monthly PDF endpoint only allows managers", () => {
  const router = require("../routes/materialRoutes");
  const route = router.stack.find((layer) => layer.route?.path === "/reports/monthly");
  assert.ok(route);
  const guard = route.route.stack[0].handle;
  for (const [user, code] of [[undefined, 401], [{ role: "storekeeper" }, 403]]) {
    const res = response();
    guard({ user }, res, () => assert.fail("Must deny access"));
    assert.equal(res.code, code);
  }
  let allowed = false;
  guard({ user: { role: "manager" } }, response(), () => { allowed = true; });
  assert.equal(allowed, true);
});
