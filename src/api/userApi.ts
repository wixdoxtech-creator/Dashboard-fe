const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const userRegister = (name: string, email: string, password: string) => {
  return fetch(`${API_BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: "userRegister",
      data: { name, email, password },
    }),
  }).then((res) => res.json());
};


export const userLogin = (email: string, password: string, fcmToken: string) => {
  return fetch(`${API_BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: "login",
      email,
      password,
      fcm_token: fcmToken,
    }),
  }).then((res) => res.json());
};