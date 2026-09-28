import { AppData, Bill } from "./types";

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function worksheet(name: string, headers: string[], rows: unknown[][]): string {
  const headerCells = headers.map((header) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join("");
  const dataRows = rows.map((row) => `<Row>${row.map((value) => {
    const numeric = typeof value === "number" && Number.isFinite(value);
    return `<Cell><Data ss:Type="${numeric ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
  }).join("")}</Row>`).join("");
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table><Row>${headerCells}</Row>${dataRows}</Table></Worksheet>`;
}

/** Downloads an Excel-compatible workbook containing the billing data. */
export function downloadExcelExport(data: AppData): void {
  const bills = [...data.bills].sort((a, b) => a.date.localeCompare(b.date));
  const billRows = bills.map((bill: Bill) => [
    bill.billNumber, bill.date, bill.time, bill.customerName ?? "", bill.customerPhone ?? "",
    bill.subtotal, bill.discount, bill.deliveryCharge ?? 0, bill.grandTotal,
    bill.paidAmount ?? bill.grandTotal, bill.dueAmount ?? 0
  ]);
  const itemRows = bills.flatMap((bill) => bill.items.map((item) => [
    bill.billNumber, bill.date, item.productName, item.variantSize, item.sku ?? "",
    item.quantity, item.price, item.amount
  ]));
  const dueRows = bills.filter((bill) => (bill.dueAmount ?? 0) > 0).map((bill) => [
    bill.billNumber, bill.date, bill.customerName ?? "", bill.customerPhone ?? "",
    bill.grandTotal, bill.paidAmount ?? 0, bill.dueAmount ?? 0
  ]);
  const productRows = data.products.flatMap((product) => product.variants.map((variant) => [
    product.name, product.category ?? "", product.status, variant.size, variant.sku ?? "", variant.price
  ]));
  const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#F3E0CC" ss:Pattern="Solid"/></Style></Styles>${worksheet("Bills", ["Bill Number", "Date", "Time", "Customer", "Phone", "Subtotal", "Discount", "Delivery Charge", "Grand Total", "Paid", "Due"], billRows)}${worksheet("Bill Items", ["Bill Number", "Date", "Product", "Size", "SKU", "Quantity", "Rate", "Amount"], itemRows)}${worksheet("Dues", ["Bill Number", "Date", "Customer", "Phone", "Grand Total", "Paid", "Due"], dueRows)}${worksheet("Products", ["Product", "Category", "Status", "Size", "SKU", "Price"], productRows)}</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `skandhas-masala-export-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
