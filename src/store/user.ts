import { defineStore } from "pinia";
import { ref } from "vue";
import { userLogin, getLongLinkInfo } from "@/api";
import router from "@/router";
import api from "@/api/axios";
import { plainApiRegionDomainMap, regionMap, dispatchLongLinkUrlMap } from "@/common";
import { useWebSocket } from "@/common/websocket";
import type { loginResponse, regionResponse, familyResponse, longLinkInfo } from "@/api";

export const useUserStore = defineStore("user", () => {
    const accessToken = ref<string>("");
    const refreshToken = ref<string>("");
    const userInfo = ref<{ apikey: string }>({ apikey: "" });
    const region = ref<string>("");
    const wsControlRes = ref<Array<{ sequence: string, deviceid: string, switches: Array<{ outlet: number, switch: "on" | "off" }> }>>([])
    const familyInfo = ref<familyResponse>({
        familyList: [],
        currentFamilyId: ""
    })
    const currentChooseInfo = ref<{
        familyId: string,
        familyName: string,
        roomId?: string,
        roomName?: string
    }>({
        familyId: "",
        familyName: "",
    });
    const longLinkInfo = ref<longLinkInfo>({
        IP: "",
        port: -1,
        domain: "",
        error: -1,
        reason: ""
    })

    const wsClient = ref<ReturnType<typeof useWebSocket> | null>(null)
    const connectWebSocket = () => {
        const { domain, port } = longLinkInfo.value
        if (!domain || port <= 0) return
        wsClient.value = useWebSocket(domain, port, {
            at: accessToken.value,
            apikey: userInfo.value.apikey,
            appid: import.meta.env.VITE_APPID,
        })
        wsClient.value!.connect()
    }

    const getLongLink = async () => {
        const data = await getLongLinkInfo(dispatchLongLinkUrlMap[region.value]);
        longLinkInfo.value = data;
    };

    const login = async (phoneNumber: string, password: string, countryCode: string) => {
        let temRegion = regionMap.find((r) => r.countryCode === countryCode)?.region || "cn"
        api.defaults.baseURL = plainApiRegionDomainMap[temRegion];
        const data: loginResponse = await userLogin(phoneNumber, password, countryCode);
        accessToken.value = data.at;
        refreshToken.value = data.rt;
        userInfo.value = data.user;
        region.value = temRegion;
        getLongLink().then(() => {
            connectWebSocket()
        })
    };

    const logout = () => {
        accessToken.value = "";
        refreshToken.value = "";
        userInfo.value = { apikey: "" };
        region.value = "";
        familyInfo.value = {
            familyList: [],
            currentFamilyId: ""
        };
        currentChooseInfo.value = {
            familyId: "",
            familyName: "",
        };
        longLinkInfo.value = {
            IP: "",
            port: -1,
            domain: "",
            error: -1,
            reason: ""
        }
        wsClient.value?.close()
        wsClient.value = null
        router.push("/login");
    };

    return { accessToken, refreshToken, userInfo, region, familyInfo, currentChooseInfo, longLinkInfo, wsClient, login, logout, connectWebSocket, wsControlRes };
}, {
    persist: {
        pick: ['accessToken', 'refreshToken', 'userInfo', 'region', 'familyInfo', 'longLinkInfo'],
    },
});