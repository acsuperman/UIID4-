<script setup lang="ts">
const props = defineProps<{
    device: {
        name: string,
        family: { roomid: string },
        extra: { uiid: number },
        deviceid: string
    }
}>()
</script>

<template>
    <div id="device-card" style="display: flex; justify-content: center; align-items: center;width:176px;height:176px">
        <div>{{ device.name }}</div>

    </div>
</template>

<style scoped>
#device-card {
    border-radius: 16px;
    background-color: rgb(255 255 255);

}
</style>