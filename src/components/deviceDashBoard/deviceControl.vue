<script setup lang="ts">
import type { itemData } from "@/api";
import { useUserStore } from "@/store/user";
const props = defineProps<{ device: itemData | null }>()

const userStore = useUserStore()
const changeChannelStatus = (device: itemData, outlet: number) => {
    //roomDeviceList.value[device.family.roomid].find(device => device.deviceid === device.deviceid)?.params.switches.find(item => item.outlet === outlet)?.switch
    let targetSwitch = device.params.switches.find(item => item.outlet === outlet);
    targetSwitch!.switch = targetSwitch!.switch === "off" ? "on" : "off"
    let updateData = {
        action: "update",
        apikey: userStore.userInfo.apikey,
        deviceid: device.deviceid,
        params: { switches: device.params.switches },
        userAgent: "app",
        sequence: Date.now().toString()
    }
    userStore.wsClient?.send(updateData)

}
</script>

<template>
    <div id="total-wrapper">
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
    width: 80%;
    height: 45%;
    border-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;


}

.on-status {
    margin-top: 6px;
    background-color: rgb(24 144 255);
}

.off-status {
    margin-top: calc(100%-6px);
    background-color: rgb(197 198 200);
    position: absolute;
    bottom: 6px;
}
</style>