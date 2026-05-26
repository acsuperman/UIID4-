<script setup lang="ts">
import { useUserStore } from "@/store/user";
import { storeToRefs } from 'pinia'
import { getFamilyDeviceList } from "@/api";
import { watch, ref } from "vue";
import DeviceCard from "@/components/deviceDashBoard/deviceCard.vue";
interface deviceItem {
    name: string,
    family: { roomid: string },
    extra: { uiid: number },
    deviceid: string
}
interface roomDeviceList {
    [roomId: string]: deviceItem[]
}
const userStore = useUserStore()
const { currentChooseInfo } = storeToRefs(userStore)
const roomList = ref<Array<{
    id: string;
    name: string;
    index: number
}>>([])
const roomDeviceList = ref<roomDeviceList>({})
watch(currentChooseInfo, async (newVal) => {
    if (newVal.familyId) {
        const res = await getFamilyDeviceList(newVal.familyId)
        res.thingList.forEach((thing) => {
            const itemData = thing.itemData
            const roomId = itemData.family.roomid
            roomDeviceList.value[roomId] = []
            roomDeviceList.value[roomId].push({ name: itemData.name, family: itemData.family, extra: itemData.extra, deviceid: itemData.deviceid })
        })

        roomList.value = userStore.familyInfo.familyList.find(family => family.id === newVal.familyId)?.roomList || []
        console.log("roomDeviceList", roomDeviceList.value)
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
            <div v-for="(device) in roomDeviceList[room.id]" :key="device.deviceid">
                <DeviceCard :device="device" />
            </div>
        </div>
    </div>

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
