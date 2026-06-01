<script setup lang="ts">
import type { itemData } from "@/api";
import { useUserStore } from "@/store/user";
import { ElMention, ElMessage } from "element-plus";
import { cloneDeep } from "lodash"
import { ref } from "vue"
const props = defineProps<{ device: itemData | null }>()

const userStore = useUserStore()
const loading = ref(false)
const changeChannelStatus = (device: itemData, outlet: number) => {
    //roomDeviceList.value[device.family.roomid].find(device => device.deviceid === device.deviceid)?.params.switches.find(item => item.outlet === outlet)?.switch
    const cloneSwitches = cloneDeep(device.params.switches)
    let targetSwitch = cloneSwitches.find((item: { outlet: number, switch: "on" | "off" }) => item.outlet === outlet);
    targetSwitch!.switch = targetSwitch!.switch === "off" ? "on" : "off"
    const sequence = Date.now().toString()
    let updateData = {
        action: "update",
        apikey: userStore.userInfo.apikey,
        deviceid: device.deviceid,
        params: { switches: cloneSwitches },
        userAgent: "app",
        sequence
    }
    loading.value = true
    userStore.wsClient?.sendRequest(updateData).catch((e) => {
        ElMessage.error(`设备状态更新失败，错误码：${e}`)
    }).finally(() => {
        loading.value = false
    })


}
</script>

<template>
    <div id="total-wrapper" v-loading="loading">
        <div v-for="channel in props.device?.params.switches" :key="channel.outlet" class="channel-wrapper"
            @click="() => changeChannelStatus(device!, channel.outlet)">
            <div class="single-channel-background">
                <div class="slider" :class="channel.switch === 'on' ? 'on-status' : 'off-status'">
                    <div v-if="channel.switch === 'on'">开</div>
                    <div v-else>关</div>
                </div>
            </div>
            <div style="text-align: center;">通道 {{ channel.outlet + 1 }}</div>

        </div>
    </div>

</template>

<style scoped>
#total-wrapper {
    display: flex;
    justify-content: space-around;
    width: 100%;
    height: 60vh;
}

.channel-wrapper {
    width: 20%;
    height: 65%;
    margin-top: 50px;

}

.single-channel-background {
    width: 100%;
    height: 100%;
    border-radius: 15px;
    background-color: rgb(245 246 250);
    overflow: hidden;
    display: flex;
    justify-content: center;
    position: relative;
}

.slider {
    position: absolute;
    width: 80%;
    height: 45%;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    transition: top 0.3s ease, background-color 0.3s ease;
}

.on-status {
    top: 6px;
    background-color: rgb(24 144 255);
}

.off-status {
    top: calc(55% - 6px);
    background-color: rgb(197 198 200);
}
</style>