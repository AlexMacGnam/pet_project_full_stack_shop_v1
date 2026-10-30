const BASE_URL = "/api";

// Shared in-flight refresh promise so concurrent 401s trigger a single
// /auth/refresh call instead of racing each other and burning the
// rotated-out refresh token.
let refreshPromise = null;

async function doRequest(endpoint, options = {}) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  return res;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        if (refreshRes.status === 401) {
          window.dispatchEvent(new Event("auth:expired"));
        }
        return false;
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await refreshRes.json();
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);
      return true;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function request(endpoint, options = {}) {
  let res = await doRequest(endpoint, options);

  // Try to refresh access token once on 401
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doRequest(endpoint, options);
    }
  }

  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.error || "Something went wrong");
    error.email = data.email || null;
    throw error;
  }

  return res.json();
}
