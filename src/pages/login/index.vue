<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormProps } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from "@/store/user";
import router from '@/router';
import { countries } from "@/common"
import logo from "@/assets/logo.png"
import {regionMap} from "@/common"
const userStore = useUserStore()

const form = reactive({
  account: '',
  country: '',
  password: ''
})

const labelPosition = ref<FormProps['labelPosition']>('top')


const onSubmit = () => {
  if (!form.account || !form.password || !form.country) {
    ElMessage.warning("请填写账号、密码和国家")
    return
  }
  userStore.login(form.country + form.account, form.password, form.country).then(() => {
    router.push("/home")
  })
}

const onCountryChange=(countryCode:string)=>{
userStore.region= regionMap.find((r) => r.countryCode === countryCode)?.region || "cn"
}


</script>

<template>
  <div id="wraper">
    <div id="login-card">
      <div style="display: flex;margin: 20px 0px 0px 30px;">
        <img :src="logo" alt="" height="40px">
        <div style="height: 40px;display: flex;align-items: center;margin-left: 5px;font-weight: bold;font-size: 30px;">
          UIID4控制</div>
        <div
          style="height: 40px;font-weight: bold;display: flex;align-items: end;margin-left: auto; margin-right: 40px;">
          账号登录
        </div>
      </div>

      <div id="login-form">
        <el-form :model="form" label-width="auto" style="max-width: 600px" :label-position="labelPosition">
          <el-form-item label="地区">
            <el-select v-model="form.country" placeholder="请选择地区" @change="onCountryChange">
              <template #prefix>
                <el-icon>
                  <Location />
                </el-icon>
              </template>
              <el-option v-for="c in countries" :key="c.code" :label="`${c.name} ${c.code}`" :value="c.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="form.account" placeholder="请输入账号">
              <template #prefix>
                <el-icon>
                  <Iphone />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" placeholder="请输入密码">
              <template #prefix>
                <el-icon>
                  <Lock />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <div style="display: flex; justify-content: center;width: 100%;">
              <button @click.prevent="onSubmit">
                登录
              </button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div></div>
    </div>
  </div>

</template>

<style scoped>
#wraper {
  width: 100%;
  height: 100%;
}

#login-card {
  width: 500px;
  height: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
}

#login-form {
  padding: 30px;
}

button {
  width: 50%;
  background-color: #1677ff;
  height: 40px;
  color: white;
  border-radius: 10px;
  margin-top: 20px;
  border: 0px;
  transition: width 0.3s ease;
}

button:hover {
  width: 80%;
}
</style>