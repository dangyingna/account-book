<script setup>
import { computed, ref } from 'vue'
import SideMenu from './components/SideMenu.vue'
import Home from './views/Home.vue'
import AddBill from './views/AddBill.vue'
import Statistics from './views/Statistics.vue'
import Budget from './views/Budget.vue'
import Setting from './views/Setting.vue'

const activePage = ref('home')
const pages = {
  home: Home,
  add: AddBill,
  statistics: Statistics,
  budget: Budget,
  setting: Setting,
}

const currentComponent = computed(() => pages[activePage.value] || Home)
</script>

<template>
  <div class="app-layout">
    <SideMenu :active-page="activePage" @change="activePage = $event" />
    <main class="main-content">
      <component
        :is="currentComponent"
        @add="activePage = 'add'"
        @saved="activePage = 'home'"
      />
    </main>
  </div>
</template>
