import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            component: () => import('@/pages/login/index.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/home',
            component: () => import('@/pages/home/index.vue'),
            meta: { requiresAuth: true }
        },
    ],
})

router.beforeEach((to) => {
    const userStore = useUserStore()
    if (to.meta.requiresAuth && !userStore.accessToken) {
        return '/login'
    }
})

export default router
