<script setup lang="ts">
import { useUserStore } from "@/store/user";
import { storeToRefs } from 'pinia'
import { getFamilyDeviceList } from "@/api";
import { watch, ref, onMounted } from "vue";
import DeviceCard from "@/components/deviceDashBoard/deviceCard.vue";
import type { itemData } from "@/api";
import type { WebSocketMessage } from "@/common/websocket";
import DeviceControl from "@/components/deviceDashBoard/deviceControl.vue";


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
    const { action } = data
    if (action !== "update") return
    const { deviceid, params: { switches } } = data
    Object.values(roomDeviceList.value).forEach((deviceArray) => {
        deviceArray.forEach((device) => {
            if (device.deviceid === deviceid) {
                device.params.switches = switches
            }
        })
    })

}

const onDeviceCardClick = (device: itemData) => {
    if (device.extra.uiid !== 4)
        return;
    nowChooseDevice.value = device
    dialogVisible.value = true
}



watch(currentChooseInfo, async (newVal) => {
    if (newVal.familyId) {
        const res = await getFamilyDeviceList(newVal.familyId)
        roomDeviceList.value = {}
        res.thingList.forEach((thing) => {
            const itemData = thing.itemData
            const roomId = itemData.family.roomid
            if (!roomDeviceList.value[roomId]) {
                roomDeviceList.value[roomId] = []
            }
            roomDeviceList.value[roomId].push(itemData)
        })

        roomList.value = userStore.familyInfo.familyList.find(family => family.id === newVal.familyId)?.roomList || []

    }
}, {})

watch(wsClient, (newVal) => {
    if (newVal) {
        newVal.onMessage(changeUi)
        console.log("WebSocket client set up with onMessage handler.", newVal);
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
    margin-left: 16px 0px 16px 16px;
}

.room-name {
    font-size: 20px;
    font-weight: bold;
    margin: 16px;

}
</style>
