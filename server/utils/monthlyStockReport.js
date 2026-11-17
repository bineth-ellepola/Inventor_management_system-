const PDFDocument = require("pdfkit");

const monthRange = (month) => {
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) < 1900) return null;
  const start = new Date(`${month}-01T00:00:00+05:30`);
  const next = new Date(`${month}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: new Date(next.getTime() - 330 * 60000) };
};

const summarize = (items) => {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.refillTarget || item.name}:${item.unitType}`;
    if (!groups.has(key)) groups.set(key, { name: item.name, unit: item.unitType, increase: 0, reduction: 0 });
    const group = groups.get(key);
    group[item.requestType === "reduce" ? "reduction" : "increase"] += item.quantity;
  }
  return [...groups.values()];
};

const createMonthlyStockPdf = (month, items) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true, info: { Title: `Monthly stock changes - ${month}`, Author: "NANCE Inventory Management System" } });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
  const number = (value) => Number(value.toFixed(6)).toLocaleString("en-GB", { maximumFractionDigits: 6 });
  const text = (value) => String(value ?? "Unavailable");
  const ensureSpace = (height) => {
    if (doc.y + height > doc.page.height - 65) doc.addPage();
  };
  const heading = (title) => {
    ensureSpace(60);
    doc.moveDown().font("Helvetica-Bold").fontSize(13).fillColor("#222222").text(title).moveDown(0.5);
  };
  doc.font("Helvetica-Bold").fontSize(20).text("NIMS | Monthly Stock Report");
  doc.font("Helvetica").fontSize(11).moveDown().text(`Month: ${month} | Time zone: Asia/Colombo`);
  doc.fontSize(9).moveDown(0.5).text("Approved refills and reductions across all materials. Dates reflect approval time.");
  doc.text("Initial stock creation, pending and rejected requests are excluded.");
  doc.text(`Generated: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Colombo" })}`);
  doc.moveDown().fontSize(11).text(`Total movements: ${items.length}`);

  if (!items.length) {
    doc.moveDown().text("No approved stock increases or reductions were recorded in this month.");
  } else {
    heading("Summary by material");
    for (const group of summarize(items)) {
      const line = `${text(group.name)} (${text(group.unit)})\nIncreased: ${number(group.increase)}    Reduced: ${number(group.reduction)}    Net change: ${number(group.increase - group.reduction)}`;
      doc.font("Helvetica").fontSize(10);
      ensureSpace(doc.heightOfString(line, { width: 515 }) + 16);
      doc.text(line, { width: 515 }).moveDown(0.7);
    }
    heading("Movement details (oldest first)");
    for (const item of items) {
      const date = new Date(item.approvedAt).toLocaleString("en-GB", { timeZone: "Asia/Colombo" });
      const reduction = item.requestType === "reduce";
      const line = `${date} | ${reduction ? "REDUCTION" : "INCREASE"} | ${reduction ? "-" : "+"}${number(item.quantity)} ${text(item.unitType)}\n${text(item.name)} | ${text(item.category)}\nRequested by: ${text(item.createdBy?.name)} | Approved by: ${text(item.approvedBy?.name)}`;
      doc.font("Helvetica").fontSize(10);
      ensureSpace(doc.heightOfString(line, { width: 515 }) + 22);
      doc.text(line, { width: 515 }).moveDown();
    }
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor("#666666").text(`NIMS | ${month} | Page ${i + 1} of ${range.count}`, 40, doc.page.height - 45, { lineBreak: false });
  }
  doc.end();
});

module.exports = { monthRange, summarize, createMonthlyStockPdf };
