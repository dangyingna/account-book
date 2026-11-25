<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import * as echarts from 'echarts'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { bills } = storeToRefs(billStore)
const chartRef = ref()
let chart

const expenseByCategory = computed(() => {
  const totals = {}
  bills.value
    .filter((bill) => bill.type === 'expense')
    .forEach((bill) => {
      totals[bill.category] = (totals[bill.category] || 0) + Number(bill.amount)
    })
  return Object.entries(totals).map(([name, value]) => ({ name, value }))
})

function renderChart() {
  if (!chartRef.value || expenseByCategory.value.length === 0) return
  chart ||= echarts.init(chartRef.value)
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
      name: '支出分类',
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '43%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { formatter: '{b}\n¥{c}' },
      data: expenseByCategory.value,
    }],
  }, true)
}

function resizeChart() {
  chart?.resize()
}

watch(expenseByCategory, () => nextTick(renderChart), { deep: true })

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
        <p>按分类查看全部支出构成</p>
      </div>
    </div>

    <el-card shadow="never" class="content-card">
      <template #header><strong>支出分类占比</strong></template>
      <div v-show="expenseByCategory.length" ref="chartRef" class="statistics-chart" />
      <el-empty v-if="!expenseByCategory.length" description="暂无支出数据，记一笔后即可查看统计" />
    </el-card>
  </section>
</template>

<style scoped>
.statistics-chart {
  width: 100%;
  height: 480px;
}

@media (max-width: 760px) {
  .statistics-chart {
    height: 400px;
  }
}
</style>
