import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { userLogin, getLongLinkInfo, getFamilyDeviceList } from "@/api";
import router from "@/router";
import api from "@/api/axios";
import { plainApiRegionDomainMap, dispatchLongLinkUrlMap } from "@/common";
import { useWebSocket } from "@/common/websocket";
import { ElLoading } from 'element-plus'
import type { loginResponse, regionResponse, familyResponse, longLinkInfo, itemData, familyDeviceListResponse } from "@/api";


interface roomDeviceList {
    [roomId: string]: itemData[]
}

export const useUserStore = defineStore("user", () => {
    const accessToken = ref<string>("");
    const refreshToken = ref<string>("");
    const userInfo = ref<{ apikey: string }>({ apikey: "" });
    const region = ref<string>("");
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

    const roomDeviceList = ref<roomDeviceList>({})



    const wsClient = ref<ReturnType<typeof useWebSocket> | null>(null)
    const connectWebSocket = () => {
        if (wsClient.value?.ws != null) //只要左边的表达式不为null或者undefined就说明ws实例已经至少建过一次了，等它重连就可以了，直接return
            return;
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
        api.defaults.baseURL = plainApiRegionDomainMap[region.value];
        const data: loginResponse = await userLogin(phoneNumber, password, countryCode);
        accessToken.value = data.at;
        refreshToken.value = data.rt;
        userInfo.value = data.user;
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
        wsClient.value?.close({ manualClose: true })
        wsClient.value = null
        router.push("/login");
    };
    watch(familyInfo, (newVal) => {
        if (newVal.familyList?.length == 0)
            return;
        const temRoomDeviceList: roomDeviceList = {}
        const promiseArray: Array<Promise<familyDeviceListResponse>> = []
        const loading = ElLoading.service({
            lock: true,
            text: 'Loading',
            background: 'rgba(0, 0, 0, 0.7)',
        })
        newVal.familyList.forEach((family) => {
            promiseArray.push(getFamilyDeviceList(family.id))
        })
        Promise.allSettled(promiseArray).then(results => {
            results.forEach(result => {
                if (result.status === "fulfilled") {
                    result.value.thingList.forEach((thing) => {
                        const itemData = thing.itemData
                        const roomId = itemData.family.roomid || "-1"// -1是未分配
                        const familyId = itemData.family.familyid
                        const mixedId = familyId + "+" + roomId
                        if (!temRoomDeviceList[mixedId]) {
                            temRoomDeviceList[mixedId] = []
                        }
                        temRoomDeviceList[mixedId].push(itemData)
                    })
                }
            })
            roomDeviceList.value = temRoomDeviceList
            loading.close()
        })
    });

    return { accessToken, refreshToken, userInfo, region, familyInfo, currentChooseInfo, longLinkInfo, wsClient, login, logout, connectWebSocket, roomDeviceList };
}, {
    persist: {
        pick: ['accessToken', 'refreshToken', 'userInfo', 'region', 'familyInfo', 'longLinkInfo'],
    },
});