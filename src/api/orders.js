import { request } from "./client";

export function getOrders() {
  return request("/orders");
}

export function createOrder(orderData) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}
