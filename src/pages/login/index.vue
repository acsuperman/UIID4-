<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormProps } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from "@/store/user";
import router from '@/router';
import { countries } from "@/common"
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
  }).catch(() => {
    ElMessage.error("登录失败，请检查账号、密码和国家是否正确")
  })
}
</script>

<template>
  <div id="wraper">
    <div id="login-card">
      <div id="login-form">
        <el-form :model="form" label-width="auto" style="max-width: 600px" :label-position="labelPosition">
          <el-form-item label="地区">
            <el-select v-model="form.country" placeholder="请选择地区">
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
              <el-button type="primary" @click="onSubmit">登录</el-button>
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
}

#login-form {
  padding: 40px;
}
</style>