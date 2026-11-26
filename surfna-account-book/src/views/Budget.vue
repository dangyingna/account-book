<script setup>
import { computed, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { budgets, currentMonthBills, categories } = storeToRefs(billStore)
const draftBudgets = reactive({})
const expenseCategories = computed(() => Object.keys(categories.value.expense))

const currentMonthLabel = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

watch([budgets, expenseCategories], ([budgetValues, categoryNames]) => {
  categoryNames.forEach((category) => {
    draftBudgets[category] = Number(budgetValues[category] || 0)
  })
}, { deep: true, immediate: true })

function primaryCategoryOf(bill) {
  return bill.primaryCategory || bill.category?.split(' / ')[0] || '其他'
}

const categoryRows = computed(() => expenseCategories.value.map((category) => {
  const spent = currentMonthBills.value
    .filter((bill) => bill.type === 'expense' && primaryCategoryOf(bill) === category)
    .reduce((total, bill) => total + Number(bill.amount), 0)
  const budget = Number(budgets.value[category] || 0)
  const remaining = budget - spent
  const isOverBudget = budget > 0 && spent > budget
  const percentage = budget > 0
    ? Math.min(Math.round((spent / budget) * 100), 100)
    : 0

  return {
    category,
    spent,
    budget,
    remaining,
    isOverBudget,
    percentage,
    progressStatus: isOverBudget ? 'exception' : percentage >= 80 ? 'warning' : 'success',
  }
}))

function saveBudget(category) {
  const amount = Number(draftBudgets[category])
  if (!Number.isFinite(amount) || amount <= 0) {
    ElMessage.warning('请输入大于 0 的预算金额')
    return
  }
  billStore.setCategoryBudget(category, amount)
  ElMessage.success(`「${category}」预算保存成功`)
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>预算</h1>
        <p>按一级分类设置月度预算，自动对比 {{ currentMonthLabel }} 的实际支出</p>
      </div>
    </div>

    <div v-if="categoryRows.length" class="budget-grid">
      <el-card
        v-for="row in categoryRows"
        :key="row.category"
        shadow="never"
        class="content-card budget-card"
        :class="{ 'is-over-budget': row.isOverBudget }"
      >
        <template #header>
          <div class="budget-header">
            <strong>{{ row.category }}</strong>
            <el-tag v-if="row.isOverBudget" type="danger" effect="dark">已超支</el-tag>
            <span v-else-if="row.budget <= 0" class="unset-text">未设置预算</span>
          </div>
        </template>

        <div class="budget-editor">
          <el-input-number
            v-model="draftBudgets[row.category]"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="月度预算"
            class="budget-input"
          >
            <template #prefix>¥</template>
            <template #suffix>元</template>
          </el-input-number>
          <el-button type="primary" @click="saveBudget(row.category)">保存</el-button>
        </div>

        <div class="budget-stats">
          <div>
            <span>本月已花费</span>
            <strong class="expense-text">¥ {{ row.spent.toFixed(2) }}</strong>
          </div>
          <div>
            <span>剩余额度</span>
            <strong v-if="row.budget > 0" :class="row.remaining < 0 ? 'expense-text' : 'income-text'">
              ¥ {{ row.remaining.toFixed(2) }}
            </strong>
            <strong v-else class="unset-amount">—</strong>
          </div>
        </div>

        <template v-if="row.budget > 0">
          <el-progress
            :percentage="row.percentage"
            :status="row.progressStatus"
            :stroke-width="12"
          />
          <p v-if="row.isOverBudget" class="over-budget-tip">
            已超支 ¥ {{ Math.abs(row.remaining).toFixed(2) }}，请注意控制本类支出
          </p>
          <p v-else class="budget-tip">本月预算 ¥ {{ row.budget.toFixed(2) }}</p>
        </template>
        <p v-else class="budget-tip">设置预算后，即可查看使用进度和剩余额度</p>
      </el-card>
    </div>
    <el-card v-else shadow="never" class="content-card">
      <el-empty
        class="empty-state"
        :image-size="80"
        description="暂无支出分类，请先在设置页新增一级分类"
      />
    </el-card>
  </section>
</template>

<style scoped>
.budget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.budget-card {
  transition: border-color 0.2s, box-shadow 0.2s;
}

.budget-card.is-over-budget {
  border-color: #ef6461;
  box-shadow: 0 0 0 2px rgba(239, 100, 97, 0.08);
}

.budget-card.is-over-budget :deep(.el-card__header) {
  background: #fff5f4;
}

.budget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.budget-header strong {
  color: #182230;
  font-size: 17px;
}

.unset-text {
  color: #98a2b3;
  font-size: 13px;
}

.budget-editor {
  display: flex;
  gap: 12px;
}

.budget-input {
  flex: 1;
  min-width: 0;
}

.budget-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 26px 0 22px;
}

.budget-stats > div:last-child {
  text-align: right;
}

.budget-stats span,
.budget-stats strong {
  display: block;
}

.budget-stats span {
  color: #98a2b3;
  font-size: 13px;
  margin-bottom: 8px;
}

.budget-stats strong {
  color: #182230;
  font-size: 22px;
}

.budget-stats .unset-amount {
  color: #c0c6cf;
}

.budget-tip,
.over-budget-tip {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
}

.budget-tip {
  color: #98a2b3;
}

.over-budget-tip {
  color: #ef6461;
  font-weight: 600;
}

@media (max-width: 1000px) {
  .budget-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .budget-editor {
    align-items: stretch;
    flex-direction: column;
  }

  .budget-stats strong {
    font-size: 19px;
  }
}
</style>
