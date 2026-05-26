import axios, { type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/store/user";


const api = axios.create({

});

const loginSign = async (config: InternalAxiosRequestConfig) => {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(import.meta.env.VITE_APPSECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const toSign = JSON.stringify(config.data);
    const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(toSign));
    const sign = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    config.headers["Authorization"] = `Sign ${sign}`;
}

const normalSign = (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    config.headers["Authorization"] = `Bearer ${userStore.accessToken}`;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (config.url === "/v2/user/login") {
        await loginSign(config);
    } else {
        normalSign(config);
    }
    config.headers["x-ck-appid"] = import.meta.env.VITE_APPID;
    return config;
});

api.interceptors.response.use(response => {
    return response.data.data;
}, error => {
    if (error.response?.status === 401) {
        useUserStore().logout();
    }
    console.error("API Error:", error);
    throw error;
});

export default api;