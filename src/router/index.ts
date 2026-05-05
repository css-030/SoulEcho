import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: () => import('@/views/ChatView.vue')
    },
    {
      path: '/healing',
      name: 'healing',
      component: () => import('@/views/HealingSpaceView.vue')
    },
    {
      path: '/garden',
      name: 'garden',
      component: () => import('@/views/EmotionGardenView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
