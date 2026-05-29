<script setup lang="ts">
import { useUserStore } from "@/store/user";
import { storeToRefs } from 'pinia'
import { getFamilyDeviceList } from "@/api";
import { watch, ref, nextTick, onMounted } from "vue";
import DeviceCard from "@/components/deviceDashBoard/deviceCard.vue";
import type { itemData } from "@/api";
import type { WebSocketMessage } from "@/common/websocket";
import DeviceControl from "@/components/deviceDashBoard/deviceControl.vue";
import { useStops } from "element-plus/es/components/slider/src/composables/use-stops.mjs";
import useStore from "element-plus/es/components/table/src/store/index.mjs";


interface roomDeviceList {
    [roomId: string]: itemData[]
}
const userStore = useUserStore()
const { currentChooseInfo, wsClient } = storeToRefs(userStore)
const roomList = ref<Array<{
    id: string;
    name: string;
    index: number
}>>([])
const roomDeviceList = ref<roomDeviceList>({})
const nowChooseDevice = ref<itemData | null>(null)
const dialogVisible = ref(false)
const changeUi = (data: WebSocketMessage) => {
    let hasWsControlRs = -1
    userStore.wsControlRes.forEach((item, index) => { //在确认此次的控制信息执行成功之后再改ui
        if (item.deviceid === data.deviceid && item.sequence === data.sequence) {
            hasWsControlRs = index
        }
    })
    if (hasWsControlRs !== -1) {
        Object.values(roomDeviceList.value).forEach((deviceArray) => {
            deviceArray.forEach((device) => {
                if (device.deviceid === userStore.wsControlRes[hasWsControlRs].deviceid) {
                    device.params.switches = userStore.wsControlRes[hasWsControlRs].switches!
                }
            })
        })
        userStore.wsControlRes.splice(hasWsControlRs, 1)
        return;
    }
    const { action } = data
    if (action === "sysmsg") {  //上下线
        const { deviceid, params: { online } } = data
        Object.values(roomDeviceList.value).forEach((deviceArray) => {
            deviceArray.forEach((device) => {
                if (device.deviceid === deviceid) {
                    device.params.online = online!
                }
            })
        })
        return;
    }
    if (action !== "update") return  //别的客户端更新状态后，本客户端同步
    const { deviceid, params: { switches } } = data
    Object.values(roomDeviceList.value).forEach((deviceArray) => {
        deviceArray.forEach((device) => {
            if (device.deviceid === deviceid) {
                device.params.switches = switches!
            }
        })
    })

}

const onDeviceCardClick = (device: itemData) => {
    if (device.extra.uiid !== 4 || device.params.online === false)
        return;
    nowChooseDevice.value = device
    dialogVisible.value = true
}

onMounted(() => {
    const ws = userStore.wsClient?.ws
    if (!ws) {
        userStore.connectWebSocket()
    }
})


watch(currentChooseInfo, async (newVal, oldVal) => {
    if (newVal.familyId && newVal.familyId !== oldVal.familyId) {
        const res = await getFamilyDeviceList(newVal.familyId)
        roomDeviceList.value = {}
        res.thingList.forEach((thing) => {
            const itemData = thing.itemData
            const roomId = itemData.family.roomid || "-1"// -1是未分配
            if (!roomDeviceList.value[roomId]) {
                roomDeviceList.value[roomId] = []
            }
            roomDeviceList.value[roomId].push(itemData)
        })
        roomList.value = [{ id: "-1", name: "未分配", index: -1 }, ...(userStore.familyInfo.familyList.find(family => family.id === newVal.familyId)?.roomList || [])]
    }
    await nextTick()
    if (newVal.roomName) {
        const elements = document.querySelectorAll('.room-name')
        for (const el of elements) {
            if (el.textContent?.trim() === newVal.roomName) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
                break
            }
        }
    } else {
        document.getElementById('family-name')?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
}, {})

watch(wsClient, (newVal) => {
    if (newVal) {
        newVal.onMessage(changeUi)
    }
}, { immediate: true })



</script>

<template>
    <div id="family-name">{{ currentChooseInfo.familyName }}</div>

    <div v-for="(room) in roomList" :key="room.id">
        <div class="room-name">{{ room.name }}</div>
        <div v-if="roomDeviceList[room.id]?.length === undefined || roomDeviceList[room.id].length === 0">
            <el-empty description="无设备" />
        </div>
        <div v-else style="display: flex; flex-wrap: wrap; gap: 16px; margin-left: 16px">
            <div v-for="(device) in roomDeviceList[room.id]" :key="device.deviceid" @click="onDeviceCardClick(device)">
                <DeviceCard :device="device" />
            </div>
        </div>
    </div>
    <el-dialog v-model="dialogVisible" :title="nowChooseDevice?.name" width="30%" center>
        <DeviceControl :device="nowChooseDevice" />
    </el-dialog>

</template>

<style scoped>
#family-name {
    font-size: 40px;
    font-weight: bold;
    margin: 16px 0px 16px 16px;
}

.room-name {
    font-size: 20px;
    font-weight: bold;
    margin: 16px;
}
</style>
