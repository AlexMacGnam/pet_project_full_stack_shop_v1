import { request } from "./client.js";

export function createReview(data) {
  return request("/reviews", { method: "POST", body: JSON.stringify(data) });
}

export function updateReview(id, data) {
  return request(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteReview(id) {
  return request(`/reviews/${id}`, { method: "DELETE" });
}

export function getProductReviews(productId) {
  return request(`/products/${productId}/reviews`);
}

export function getMyReviews() {
  return request("/reviews/my");
}

export function getAllRatings() {
  return request("/reviews/ratings");
}
