<script setup>
defineProps({
  activePage: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['change'])

const menus = [
  { key: 'home', label: '首页' },
  { key: 'add', label: '记一笔' },
  { key: 'statistics', label: '统计' },
  { key: 'budget', label: '预算' },
  { key: 'setting', label: '设置' },
]
</script>

<template>
  <aside class="side-menu">
    <div class="brand">
      <span class="brand-mark">S</span>
      <div>
        <strong>冲浪娜记账</strong>
        <span>轻松记录每一笔</span>
      </div>
    </div>

    <el-menu
      :default-active="activePage"
      class="menu-list"
      @select="emit('change', $event)"
    >
      <el-menu-item v-for="menu in menus" :key="menu.key" :index="menu.key">
        {{ menu.label }}
      </el-menu-item>
    </el-menu>

    <p class="storage-tip">数据仅保存在当前浏览器</p>
  </aside>
</template>

<style scoped>
.side-menu {
  width: 232px;
  height: 100vh;
  min-height: 100vh;
  padding: 28px 18px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-self: flex-start;
  background: #ffffff;
  border-right: 1px solid #e8edf3;
  position: sticky;
  top: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px 30px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 23px;
  font-weight: 700;
  background: linear-gradient(135deg, #377dff, #63b3ff);
}

.brand strong,
.brand span {
  display: block;
}

.brand strong {
  color: #182230;
  font-size: 18px;
}

.brand div span {
  color: #98a2b3;
  font-size: 12px;
  margin-top: 4px;
}

.menu-list {
  border-right: 0;
}

.menu-list :deep(.el-menu-item) {
  height: 48px;
  margin: 5px 0;
  border-radius: 10px;
  color: #667085;
}

.menu-list :deep(.el-menu-item.is-active) {
  color: #377dff;
  background: #edf5ff;
  font-weight: 600;
}

.storage-tip {
  margin: auto 10px 0;
  color: #a4adba;
  font-size: 12px;
}

@media (max-width: 760px) {
  .side-menu {
    width: 100%;
    height: auto;
    min-height: auto;
    padding: 16px;
    position: static;
    border-right: 0;
    border-bottom: 1px solid #e8edf3;
  }

  .brand {
    padding: 0 0 14px;
  }

  .menu-list {
    display: flex;
    overflow-x: auto;
  }

  .menu-list :deep(.el-menu-item) {
    flex: 1;
    min-width: 68px;
    padding: 0 12px;
    justify-content: center;
  }

  .storage-tip {
    display: none;
  }
}
</style>
