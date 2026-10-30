import { request } from "./client.js";

export function createPaymentSession(orderId, couponCode) {
  return request("/payments/create-session", {
    method: "POST",
    body: JSON.stringify({ orderId, ...(couponCode && { couponCode }) }),
  });
}

export function getInvoice(orderId) {
  return request(`/payments/invoice/${orderId}`);
}
