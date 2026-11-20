import "./OrderPackingSlip.css";
import { getPackingSlipAddressLines } from "./packingSlipPdf.js";

export default function OrderPackingSlip({ order }) {
  const addressLines = getPackingSlipAddressLines(order.shippingAddress);

  return (
    <article className="packing-slip">
      <h1>MAVO</h1>
      <p className="packing-slip-greeting">
        Hello {order.customer.name || "Customer"}, thank you for shopping with
        MAVO.
      </p>
      <p className="packing-slip-order">
        Packing slip for order #{order.id} · {order.date}
      </p>

      <section>
        <h2>Customer profile</h2>
        <p><strong>Name:</strong> {order.customer.name}</p>
        <p><strong>Email:</strong> {order.customer.email}</p>
        <p><strong>Phone:</strong> {order.customer.phone}</p>
      </section>

      <section>
        <h2>Destination address</h2>
        <p>{order.shippingAddress.fullName || order.customer.name}</p>
        {addressLines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
      </section>

      <section>
        <h2>Payment method</h2>
        <p>{order.paymentMethod}</p>
      </section>

      <p className="packing-slip-total">
        <strong>Grand total</strong>
        <strong>৳{Number(order.total || 0).toFixed(2)}</strong>
      </p>
    </article>
  );
}
