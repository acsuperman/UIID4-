<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useUserStore } from "@/store/user";
import { getFamilyAndRoomInfo } from "@/api";
type TreeNodeData = Record<string, any>
interface Tree {
    id: string
    label: string
    children?: Tree[]
}

const userStore = useUserStore()
const treeProps = {
    value: 'id',
    label: 'label',
    children: 'children',
}


const nodeClick = (data: TreeNodeData) => {
    let info = {
        familyId: "",
        familyName: "",
    } as {
        familyId: string,
        familyName: string,
        roomId?: string,
        roomName?: string
    }
    if (data.familyId) {
        info = {
            familyId: data.familyId,
            familyName: data.familyName,
            roomId: data.id,
            roomName: data.label
        }
    } else {
        info = {
            familyId: data.id,
            familyName: data.label,
        }
    }
    userStore.currentChooseInfo = info
}


const treeData = ref<Tree[]>([])

onMounted(() => {
    getFamilyAndRoomInfo().then((res) => {
        treeData.value = res.familyList?.map(family => ({
            id: family.id,
            label: family.name,
            children: family.roomList?.map(room => ({
                id: room.id,
                label: room.name,
                familyId: family.id,
                familyName: family.name
            })) ?? []
        }))
        userStore.familyInfo = res
        userStore.currentChooseInfo = {
            familyId: treeData.value[0]?.id,
            familyName: treeData.value[0]?.label,
        }
    }).catch((err) => {
        console.error(err);
    })
})

</script>

<template>
    <div id="tree-wrapper">
        <el-tree-v2 style="max-width: 600px" :data="treeData" :props="treeProps" :height="520" @nodeClick="nodeClick" />
    </div>
</template>

<style scoped>
#tree-wrapper {
    padding: 16px;
    width: 80%;
    height: 100%;
    margin: 5px 15px;
}
</style>