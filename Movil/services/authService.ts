import { getToken } from "@/src/lib/authToken";
import axios from "axios";

const api = axios.create({
  // baseURL: "http://192.168.1.13:8000/api", // ip 5g casa juan
  baseURL: "https://tumercadosena.shop/api/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* =========================
   INTERCEPTOR JWT
========================= */
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   REGISTRO – PASO 1
========================= */
export const iniciarRegistroService = (payload: {
  nickname: string;
  email: string;
  password: string;
  password_confirmation: string;
  descripcion?: string;
  link?: string;
  rol_id: 1;
  estado_id: 1;
  notifica_correo: boolean;
  notifica_push: boolean;
  uso_datos: boolean;
}) => {
  return api.post("/auth/iniciar-registro", payload);
};

/* =========================
   REGISTRO – PASO 2 (VERIFY)
========================= */
export const completarRegistroService = (payload: {
  cuenta_id: number;
  clave: string;
  datosEncriptados: string;
  device_name: string;
}) => {
  return api.post("/auth/register", payload);
};

/* =========================
   LOGIN
========================= */
export const loginService = (payload: {
  email: string;
  password: string;
  device_name: string;
}) => {
  return api.post("/auth/login", payload);
};

/* =========================
   USUARIO AUTENTICADO
========================= */
export const meService = () => {
  return api.get("/auth/me");
};

/* =========================
   REFRESH TOKEN
========================= */
export const refreshTokenService = () => {
  return api.post("/auth/refresh");
};

/* =========================
   LOGOUT
========================= */
export const logoutService = (all_devices = false) => {
  return api.post("/auth/logout", { all_devices });
};

export default api;
