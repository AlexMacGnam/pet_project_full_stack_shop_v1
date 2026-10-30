import { request } from "./client.js";

export function getCart() {
  return request("/cart");
}

export function addToCart(productId, quantity = 1) {
  return request("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateCartItem(productId, quantity) {
  return request(`/cart/items/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(productId) {
  return request(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return request("/cart", {
    method: "DELETE",
  });
}

export function mergeCart(items) {
  return request("/cart/merge", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
