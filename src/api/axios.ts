import axios, { type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/store/user";


const api = axios.create({});
const apiNeedSign = ["/v2/user/login", "/get-region"];
const apiNoDoubleData = ["/dispatch/app"]
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
    const urlWithoutQuery = (config.url as string).split("?")[0];
    if (apiNeedSign.includes(urlWithoutQuery)) {
        await loginSign(config);
    } else {
        normalSign(config);
    }
    config.headers["x-ck-appid"] = import.meta.env.VITE_APPID;
    return config;
});

api.interceptors.response.use(response => {
    if (response.config.url && apiNoDoubleData.includes(response.config.url.split("?")[0])) {
        return response.data;
    }
    return response.data.data;
}, error => {
    if (error.response?.status === 401) {
        useUserStore().logout();
    }
    console.error("API Error:", error);
    throw error;
});

export default api;