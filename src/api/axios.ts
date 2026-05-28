import axios, { type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/store/user";
import { ElMessage } from "element-plus";


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
    const userStore = useUserStore();
    if (response.data.error !== 0) {
        ElMessage.error(response.data.msg)
        const error = response.data.error
        if (error === 401) {
            //ac认证失败,通常是账号被其他人登录，直接注销
            userStore.logout()
        }
        else if (error === 402) {
            //ac过期，在这里进行无感刷新，由于刷新接口当前appid没权限，所以现在直接执行注销逻辑，直接去重新登录
            userStore.logout()
        }
        throw new Error(response.data.msg)
    }
    if (response.config.url && apiNoDoubleData.includes(response.config.url.split("?")[0])) {
        return response.data;
    }
    return response.data.data;
}, error => {
    // if (error.response?.status === 401) {
    //     useUserStore().logout();
    // }
    // console.error("API Error:", error);
    throw error;
});

export default api;