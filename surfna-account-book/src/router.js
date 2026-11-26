import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import AddBill from './views/AddBill.vue'
import Statistics from './views/Statistics.vue'
import Budget from './views/Budget.vue'
import Setting from './views/Setting.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/add', name: 'add', component: AddBill },
    { path: '/statistics', name: 'statistics', component: Statistics },
    { path: '/budget', name: 'budget', component: Budget },
    { path: '/setting', name: 'setting', component: Setting },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
