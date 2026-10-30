import { request } from "./client.js";

export function createReport(data) {
  return request("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getReports() {
  return request("/reports");
}

export function patchReport(id, status) {
  return request(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function refundReport(id) {
  return request(`/reports/${id}/refund`, { method: "POST" });
}
