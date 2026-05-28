<script setup lang="ts">
import DeviceDashBoard from "@/components/deviceDashBoard/index.vue";
import TreeCard from "@/components/treeCard/index.vue";
import logo from "@/assets/logo.png";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
</script>

<template>
    <header>
        <div style="display: flex; align-items: center; gap: 10px">
            <img :src="logo" id="logo">
            <div>UIID4控制</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px">
            <el-link type="primary" @click="userStore.logout">退出登录</el-link>
        </div>
    </header>
    <div id="wraper">
        <aside>
            <TreeCard />
        </aside>
        <main>
            <DeviceDashBoard />
        </main>
    </div>

</template>

<style scoped>
header {
    height: 8vh;
    box-shadow: 1px 1px rgb(43 139 228);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    background-color: rgb(255 255 255);

}

#wraper {
    display: flex;
    height: 88vh;
}

#logo {
    height: 6vh;
}

aside {
    width: 20vw;
    height: 90%;
    border-radius: 30px;
    margin: 16px;
    background-color: rgb(255 255 255);
}

main {
    width: 80vw;
    margin: 16px;
    overflow: auto;
}
</style>>