const API_URL = `${import.meta.env.VITE_API_URL}/api`;
export const ASSETS_URL = import.meta.env.VITE_API_URL;

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return res;
  }

  return res;
}

export async function apiFetchFormData(endpoint, formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return res;
  }

  return res;
}

export async function adminApiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    window.location.href = "/admin";
    return res;
  }

  return res;
}
