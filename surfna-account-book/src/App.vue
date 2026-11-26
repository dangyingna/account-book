<script setup>
import SideMenu from './components/SideMenu.vue'
</script>

<template>
  <div class="app-layout">
    <SideMenu />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
