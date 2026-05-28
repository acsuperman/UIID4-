<script setup lang="ts">
import type { itemData } from "@/api";
import { computed, toRef } from "vue";
const props = defineProps<{ device: itemData }>()
const device = toRef(props, 'device')
const onCount = computed(() => device.value.params.switches?.filter((item) => item.switch === "on").length || 0)
const isCanControl = computed(() => device.value.extra.uiid === 4) //型号判定
const isOnline = computed(() => device.value.params.online)


</script>

<template>
    <div id="device-card" style="width:176px;height:176px"
        :class="{ controllable: isCanControl && isOnline, 'disabled-device-card': !isCanControl || !isOnline }">
        <div style="display:flex;justify-content:flex-end">
            <img v-if="device.showBrand" :src=device.brandLogo alt="brand logo"
                style="width:60px;max-height: 66px; margin: 8px;">
        </div>


        <div
            style="display: flex;width: 100%; height: 52px; font-size: 20px; color: #666;font-weight: bold;margin-top: 40px; margin-left: 16px">
            {{ device.name + (!isOnline && isCanControl ? "(离线)" : "") }}
        </div>
        <div v-if="isCanControl && isOnline" style="width: 100%;height:80px; margin-left:16px">
            <div v-if="onCount === 4" style="color: #66cb34;">全开</div>
            <div v-else-if="onCount === 0">全关</div>
            <div v-else style="display: flex;  align-items: center;">
                <span style="color: #66cb34;margin-right: 8px;">{{ onCount }} 开 </span>
                <span> {{ 4 - onCount }}关</span>
            </div>
        </div>
        <div v-else-if="!isCanControl" text-align:center style="color: #999; font-size: 14px;">
            设备正在接入中，敬请期待~
        </div>

    </div>
</template>

<style scoped>
#device-card {
    border-radius: 16px;
    background-color: rgb(255 255 255);
    box-shadow: 1px 1px 0.4px grey;
    position: relative;
    transition: transform 0.3s ease;
}

#device-card.controllable:hover {
    transform: rotate(5deg);
}

#device-card.disabled-device-card {
    background-color: rgb(197 198 200);
}
</style>