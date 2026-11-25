<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { budget, currentMonthExpense } = storeToRefs(billStore)
const budgetAmount = ref(budget.value)

watch(budget, (value) => {
  budgetAmount.value = value
})

const remaining = computed(() => budget.value - currentMonthExpense.value)
const percentage = computed(() => {
  if (budget.value <= 0) return currentMonthExpense.value > 0 ? 100 : 0
  return Math.min(Math.round((currentMonthExpense.value / budget.value) * 100), 100)
})
const progressStatus = computed(() => {
  if (currentMonthExpense.value > budget.value) return 'exception'
  if (percentage.value >= 80) return 'warning'
  return 'success'
})

function saveBudget() {
  if (!budgetAmount.value || budgetAmount.value <= 0) {
    ElMessage.warning('请输入大于 0 的预算金额')
    return
  }
  billStore.setBudget(budgetAmount.value)
  ElMessage.success('本月预算已保存')
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>预算</h1>
        <p>设置月度支出预算，控制消费节奏</p>
      </div>
    </div>

    <el-card shadow="never" class="content-card form-card">
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="每月支出预算（元）">
          <el-input-number
            v-model="budgetAmount"
            :min="0"
            :precision="2"
            :controls="false"
            class="full-width"
          />
        </el-form-item>
        <el-button type="primary" @click="saveBudget">保存预算</el-button>
      </el-form>
    </el-card>

    <el-card shadow="never" class="content-card budget-card">
      <template #header><strong>本月预算使用情况</strong></template>
      <el-progress
        :percentage="percentage"
        :status="progressStatus"
        :stroke-width="16"
      />
      <div class="budget-details">
        <div>
          <span>本月已支出</span>
          <strong class="expense-text">¥ {{ currentMonthExpense.toFixed(2) }}</strong>
        </div>
        <div>
          <span>剩余预算</span>
          <strong :class="remaining < 0 ? 'expense-text' : 'income-text'">
            ¥ {{ remaining.toFixed(2) }}
          </strong>
        </div>
        <div>
          <span>月度预算</span>
          <strong>¥ {{ Number(budget).toFixed(2) }}</strong>
        </div>
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.budget-card {
  margin-top: 20px;
}

.budget-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 32px;
}

.budget-details span,
.budget-details strong {
  display: block;
}

.budget-details span {
  color: #98a2b3;
  font-size: 13px;
  margin-bottom: 8px;
}

.budget-details strong {
  color: #182230;
  font-size: 20px;
}

@media (max-width: 600px) {
  .budget-details {
    grid-template-columns: 1fr;
  }
}
</style>
