import { request } from "./client.js";

export function getCoupons() {
  return request("/coupons");
}

export function createCoupon(data) {
  return request("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCoupon(code, data) {
  return request(`/coupons/${code}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCoupon(code) {
  return request(`/coupons/${code}`, { method: "DELETE" });
}
