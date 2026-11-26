<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBillStore } from '../stores/bills'

const router = useRouter()
const billStore = useBillStore()
const {
  currentMonthBills,
  currentMonthIncome,
  currentMonthExpense,
  currentMonthBalance,
} = storeToRefs(billStore)

const currentYearMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

async function removeBill(id) {
  try {
    await ElMessageBox.confirm('确定删除这条账单吗？', '删除账单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    billStore.removeBill(id)
    ElMessage.success('账单删除成功')
  } catch {
    // 用户取消删除时无需处理
  }
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>首页</h1>
        <p>快速了解你的本月收支情况</p>
      </div>
      <el-button type="primary" @click="router.push('/add')">记一笔</el-button>
    </div>

    <div class="summary-grid">
      <el-card shadow="never" class="summary-card">
        <span><i class="summary-icon income-icon">↑</i>本月收入</span>
        <strong class="income-text">¥ {{ currentMonthIncome.toFixed(2) }}</strong>
      </el-card>
      <el-card shadow="never" class="summary-card">
        <span><i class="summary-icon expense-icon">↓</i>本月支出</span>
        <strong class="expense-text">¥ {{ currentMonthExpense.toFixed(2) }}</strong>
      </el-card>
      <el-card shadow="never" class="summary-card balance-card">
        <span>本月结余</span>
        <strong>¥ {{ currentMonthBalance.toFixed(2) }}</strong>
      </el-card>
    </div>

    <el-card shadow="never" class="content-card">
      <template #header>
        <div class="card-header">
          <strong>{{ currentYearMonth }}账单明细</strong>
          <span>共 {{ currentMonthBills.length }} 条记录</span>
        </div>
      </template>
      <el-table :data="currentMonthBills">
        <template #empty>
          <el-empty
            class="empty-state"
            :image-size="80"
            description="本月暂无账单，点击「记一笔」开始记录吧"
          />
        </template>
        <el-table-column prop="date" label="日期" min-width="110" />
        <el-table-column prop="category" label="分类" min-width="100" />
        <el-table-column prop="note" label="备注" min-width="140">
          <template #default="{ row }">{{ row.note || '—' }}</template>
        </el-table-column>
        <el-table-column label="金额" min-width="120" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-text' : 'expense-text'">
              {{ row.type === 'income' ? '+' : '-' }} ¥ {{ Number(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeBill(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<style scoped>
.summary-icon {
  display: inline-grid;
  place-items: center;
  width: 25px;
  height: 25px;
  margin-right: 8px;
  border-radius: 8px;
  font-size: 17px;
  font-style: normal;
  font-weight: 700;
  vertical-align: middle;
}

.income-icon {
  color: #12a182;
  background: #e9f8f3;
}

.expense-icon {
  color: #ef6461;
  background: #fff0ef;
}

</style>
