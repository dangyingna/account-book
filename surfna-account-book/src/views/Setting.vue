<script setup>
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { bills } = storeToRefs(billStore)

function exportBills() {
  if (bills.value.length === 0) {
    ElMessage.warning('暂无账单可以导出')
    return
  }

  const rows = bills.value.map((bill) => ({
    日期: bill.date,
    类型: bill.type === 'income' ? '收入' : '支出',
    分类: bill.category,
    金额: Number(bill.amount),
    备注: bill.note || '',
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单')
  XLSX.writeFile(workbook, '冲浪娜记账-账单.xlsx')
  ElMessage.success('账单已导出')
}

async function clearData() {
  try {
    await ElMessageBox.confirm(
      '将删除全部账单并恢复默认预算，此操作无法撤销。确定继续吗？',
      '清空全部数据',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    billStore.clearData()
    ElMessage.success('全部数据已清空')
  } catch {
    // 用户取消清空时无需处理
  }
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>设置</h1>
        <p>管理账单数据与存储方式</p>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <template #header><strong>数据管理</strong></template>
      <div class="setting-row">
        <div>
          <h3>导出账单</h3>
          <p>将全部账单导出为 Excel 文件，方便备份和整理。</p>
        </div>
        <el-button type="primary" plain @click="exportBills">导出 Excel</el-button>
      </div>
      <el-divider />
      <div class="setting-row">
        <div>
          <h3>本地存储</h3>
          <p>当前共有 {{ bills.length }} 条账单，数据仅保存在当前浏览器的 localStorage 中。</p>
        </div>
      </div>
      <el-divider />
      <div class="setting-row">
        <div>
          <h3 class="expense-text">清空全部数据</h3>
          <p>删除所有账单并恢复默认预算，清空后无法恢复。</p>
        </div>
        <el-button type="danger" plain @click="clearData">清空数据</el-button>
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.setting-row h3 {
  margin: 0 0 8px;
  color: #344054;
  font-size: 16px;
}

.setting-row p {
  margin: 0;
  color: #98a2b3;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .setting-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
