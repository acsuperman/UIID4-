import { defineStore } from "pinia";
import { ref } from "vue";
import { userLogin } from "@/api";
import router from "@/router";

export const useUserStore = defineStore("user", () => {
    const accessToken = ref<string>("");
    const refreshToken = ref<string>("");
    const userInfo = ref({});
    const region = ref<string>("");

    const login = async (phoneNumber: string, password: string, countryCode: string) => {
        const data = await userLogin(phoneNumber, password, countryCode);
        accessToken.value = data.at;
        refreshToken.value = data.rt;
        userInfo.value = data.user;
        region.value = data.region;
    };

    const logout = () => {
        accessToken.value = "";
        refreshToken.value = "";
        userInfo.value = {};
        region.value = "";
        router.push("/login");
    };

    return { accessToken, refreshToken, userInfo, region, login, logout };
}, {
    persist: true,
});