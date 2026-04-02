export type AuthUser = {
  id: string;
  name: string;
  username: string;
  phone: string;
  profilePicture: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const AUTH_TOKEN_KEY = "fintrack_auth_token";
export const AUTH_USER_KEY = "fintrack_auth_user";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string" ? data.message : "Request failed.",
    );
  }

  return data as T;
}

export function persistAuthSession(payload: AuthResponse) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthUser() {
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signIn(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(token: string) {
  const data = await request<{ user: AuthUser }>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user;
}

export async function updateProfile(payload: {
  name: string;
  username: string;
  phone: string;
  profilePicture: string;
}) {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  const data = await request<{ message: string; user: AuthUser }>("/auth/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return data;
}

export async function changeEmail(payload: {
  email: string;
  password: string;
}) {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  return request<{ message: string; user: AuthUser }>("/auth/email", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  nextPassword: string;
}) {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  return request<{ message: string }>("/auth/password", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(password: string) {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  return request<{ message: string }>("/auth/me", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
}
