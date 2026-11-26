<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import * as echarts from 'echarts'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { bills } = storeToRefs(billStore)
const chartRef = ref()
let chart

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const selectedMonth = ref(currentMonth())
const chartType = ref('expense')
const drillPrimary = ref('')

const monthLabel = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  return `${year}年${Number(month)}月`
})
const chartTypeLabel = computed(() => chartType.value === 'income' ? '收入' : '支出')

const monthlyBills = computed(() => {
  return bills.value.filter((bill) => bill.date.startsWith(selectedMonth.value))
})

const totalIncome = computed(() => monthlyBills.value
  .filter((bill) => bill.type === 'income')
  .reduce((total, bill) => total + Number(bill.amount), 0))
const totalExpense = computed(() => monthlyBills.value
  .filter((bill) => bill.type === 'expense')
  .reduce((total, bill) => total + Number(bill.amount), 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

function primaryCategoryOf(bill) {
  return bill.primaryCategory || bill.category?.split(' / ')[0] || '其他'
}

function secondaryCategoryOf(bill) {
  return bill.secondaryCategory || bill.category?.split(' / ')[1] || '其他'
}

function formatCategory(bill) {
  return bill.primaryCategory
    ? `${primaryCategoryOf(bill)} / ${secondaryCategoryOf(bill)}`
    : bill.category
}

const chartData = computed(() => {
  const totals = {}
  monthlyBills.value
    .filter((bill) => bill.type === chartType.value)
    .filter((bill) => !drillPrimary.value || primaryCategoryOf(bill) === drillPrimary.value)
    .forEach((bill) => {
      const category = drillPrimary.value ? secondaryCategoryOf(bill) : primaryCategoryOf(bill)
      totals[category] = (totals[category] || 0) + Number(bill.amount)
    })

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

function handleChartClick(params) {
  if (!drillPrimary.value && params.name) {
    drillPrimary.value = params.name
  }
}

function renderChart() {
  if (!chartRef.value || chartData.value.length === 0) return
  chart ||= echarts.init(chartRef.value)
  chart.off('click')
  chart.on('click', handleChartClick)
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>¥ {c}（{d}%）',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
    },
    color: ['#377dff', '#65b5ff', '#73d2c2', '#f7ba4b', '#f48b8b', '#a88ce8', '#8da2b5', '#c8a97e'],
    series: [{
      name: `${chartTypeLabel.value}${drillPrimary.value ? '二级' : '一级'}分类`,
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '43%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { formatter: '{b}\n¥{c}' },
      data: chartData.value,
    }],
  }, true)
}

function resizeChart() {
  chart?.resize()
}

watch([selectedMonth, chartType], () => {
  drillPrimary.value = ''
})
watch(chartData, async () => {
  await nextTick()
  if (!chartData.value.length) {
    chart?.clear()
    return
  }
  renderChart()
  chart?.resize()
}, { deep: true })

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>统计</h1>
        <p>按月分析收支构成，点击一级分类可查看二级分类</p>
      </div>
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        value-format="YYYY-MM"
        placeholder="选择月份"
        :clearable="false"
        class="month-picker"
      />
    </div>

    <div class="summary-grid">
      <el-card shadow="never" class="summary-card">
        <span>当月总收入</span>
        <strong class="income-text">¥ {{ totalIncome.toFixed(2) }}</strong>
      </el-card>
      <el-card shadow="never" class="summary-card">
        <span>当月总支出</span>
        <strong class="expense-text">¥ {{ totalExpense.toFixed(2) }}</strong>
      </el-card>
      <el-card shadow="never" class="summary-card balance-card">
        <span>当月结余</span>
        <strong>¥ {{ balance.toFixed(2) }}</strong>
      </el-card>
    </div>

    <el-card shadow="never" class="content-card chart-card">
      <template #header>
        <div class="chart-header">
          <strong>
            {{ drillPrimary ? `${drillPrimary} · 二级分类占比` : `${chartTypeLabel}一级分类占比` }}
          </strong>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="chart-toolbar">
        <span v-if="!drillPrimary">点击饼图分类，可下钻查看二级分类占比</span>
        <el-button v-else link type="primary" @click="drillPrimary = ''">← 返回一级分类</el-button>
      </div>
      <div v-show="chartData.length" ref="chartRef" class="statistics-chart" />
      <el-empty
        v-if="!chartData.length"
        class="empty-state"
        :image-size="80"
        :description="`${monthLabel}暂无${chartTypeLabel}记录，记一笔后即可查看统计`"
      />
    </el-card>

    <el-card shadow="never" class="content-card">
      <template #header>
        <div class="card-header">
          <strong>{{ monthLabel }}账单明细</strong>
          <span>共 {{ monthlyBills.length }} 条记录</span>
        </div>
      </template>
      <el-table :data="monthlyBills">
        <template #empty>
          <el-empty
            class="empty-state"
            :image-size="80"
            :description="`${monthLabel}暂无账单记录`"
          />
        </template>
        <el-table-column prop="date" label="日期" min-width="110" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" effect="light">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="180">
          <template #default="{ row }">{{ formatCategory(row) }}</template>
        </el-table-column>
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
      </el-table>
    </el-card>
  </section>
</template>

<style scoped>
.month-picker {
  width: 160px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.chart-toolbar {
  min-height: 24px;
  color: #98a2b3;
  font-size: 13px;
  text-align: center;
}

.statistics-chart {
  width: 100%;
  height: 430px;
}

@media (max-width: 760px) {
  .month-picker {
    width: 145px;
  }

  .chart-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .statistics-chart {
    height: 380px;
  }
}

@media (max-width: 520px) {
  .page-heading {
    flex-direction: column;
  }
}
</style>
