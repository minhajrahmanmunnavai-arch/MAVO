export function getPackingSlipAddressLines(address = {}) {
  const region =
    address.region ||
    [address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  return [
    address.address || address.street || address.addressLine1,
    address.addressLine2,
    region,
    address.country,
  ].filter(Boolean);
}

function addPdfField(document, label, value, y) {
  if (label) {
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.text(label, 20, y);
  }
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  const lines = document.splitTextToSize(String(value || "—"), 115);
  document.text(lines, label ? 70 : 20, y);
  return y + Math.max(lines.length * 6, 8);
}

export async function downloadPackingSlipPdf(order) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = document.internal.pageSize.getWidth();
  const customerName = order.customer.name || "Customer";
  let y = 24;

  document.setTextColor(24, 24, 27);
  document.setFont("helvetica", "bold");
  document.setFontSize(24);
  document.text("MAVO", 20, y);
  y += 10;

  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.text(`Hello ${customerName}, thank you for shopping with MAVO.`, 20, y);
  y += 8;
  document.setTextColor(100, 100, 110);
  document.text(`Packing slip for order #${order.id}  |  ${order.date}`, 20, y);
  y += 13;

  const addSection = (title) => {
    document.setDrawColor(225, 225, 230);
    document.line(20, y - 4, pageWidth - 20, y - 4);
    document.setTextColor(24, 24, 27);
    document.setFont("helvetica", "bold");
    document.setFontSize(12);
    document.text(title, 20, y);
    y += 9;
  };

  addSection("Customer profile");
  y = addPdfField(document, "Name", customerName, y);
  y = addPdfField(document, "Email", order.customer.email, y);
  y = addPdfField(document, "Phone", order.customer.phone, y);
  y += 3;

  addSection("Destination address");
  const addressLines = getPackingSlipAddressLines(order.shippingAddress);
  y = addPdfField(
    document,
    "Ship to",
    order.shippingAddress.fullName || customerName,
    y
  );
  addressLines.forEach((line) => {
    y = addPdfField(document, "", line, y);
  });
  y += 3;

  addSection("Payment method");
  y = addPdfField(document, "Method", order.paymentMethod, y);
  y += 3;

  document.setFillColor(245, 247, 250);
  document.roundedRect(20, y, pageWidth - 40, 20, 2, 2, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.setTextColor(24, 24, 27);
  document.text("Grand total", 25, y + 12);
  document.setTextColor(37, 99, 235);
  document.text(
    `BDT ${Number(order.total || 0).toFixed(2)}`,
    pageWidth - 25,
    y + 12,
    { align: "right" }
  );

  document.save(`MAVO-packing-slip-${order.id}.pdf`);
}
