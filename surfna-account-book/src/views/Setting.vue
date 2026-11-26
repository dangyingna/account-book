<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { useBillStore } from '../stores/bills'

const billStore = useBillStore()
const { bills, categories } = storeToRefs(billStore)
const selectedType = ref('expense')
const fileInput = ref()
const categoryDialog = reactive({
  visible: false,
  level: 'primary',
  mode: 'add',
  primary: '',
  originalName: '',
  name: '',
})

const currentCategories = computed(() => categories.value[selectedType.value])
const dialogTitle = computed(() => {
  const action = categoryDialog.mode === 'add' ? '新增' : '修改'
  const level = categoryDialog.level === 'primary' ? '一级分类' : '二级分类'
  return `${action}${level}`
})

function openPrimaryDialog(mode, primary = '') {
  Object.assign(categoryDialog, {
    visible: true,
    level: 'primary',
    mode,
    primary: '',
    originalName: primary,
    name: primary,
  })
}

function openSecondaryDialog(mode, primary, name = '') {
  Object.assign(categoryDialog, {
    visible: true,
    level: 'secondary',
    mode,
    primary,
    originalName: name,
    name,
  })
}

function saveCategory() {
  const name = categoryDialog.name.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  const isPrimary = categoryDialog.level === 'primary'
  const siblings = isPrimary
    ? Object.keys(currentCategories.value)
    : currentCategories.value[categoryDialog.primary]
  const isDuplicate = siblings.some((category) => (
    category === name && category !== categoryDialog.originalName
  ))
  if (isDuplicate) {
    ElMessage.warning('分类名称已存在')
    return
  }

  if (isPrimary && categoryDialog.mode === 'add') {
    billStore.addPrimaryCategory(selectedType.value, name)
  } else if (isPrimary) {
    billStore.renamePrimaryCategory(selectedType.value, categoryDialog.originalName, name)
  } else if (categoryDialog.mode === 'add') {
    billStore.addSecondaryCategory(selectedType.value, categoryDialog.primary, name)
  } else {
    billStore.renameSecondaryCategory(
      selectedType.value,
      categoryDialog.primary,
      categoryDialog.originalName,
      name,
    )
  }

  categoryDialog.visible = false
  ElMessage.success('分类保存成功')
}

async function deletePrimaryCategory(primary) {
  try {
    await ElMessageBox.confirm(
      `删除「${primary}」后，其下的二级分类也会一并删除，已有账单不受影响。`,
      '删除一级分类',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
    billStore.deletePrimaryCategory(selectedType.value, primary)
    ElMessage.success('一级分类删除成功')
  } catch {
    // 用户取消删除时无需处理
  }
}

async function deleteSecondaryCategory(primary, name) {
  try {
    await ElMessageBox.confirm(
      `确定删除二级分类「${name}」吗？已有账单不受影响。`,
      '删除二级分类',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
    billStore.deleteSecondaryCategory(selectedType.value, primary, name)
    ElMessage.success('二级分类删除成功')
  } catch {
    // 用户取消删除时无需处理
  }
}

function hasBills() {
  if (bills.value.length > 0) return true
  ElMessage.warning('暂无可导出的账单')
  return false
}

function exportJson() {
  if (!hasBills()) return
  const content = JSON.stringify({
    app: 'surfna-account-book',
    version: 1,
    exportedAt: new Date().toISOString(),
    bills: bills.value,
  }, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `冲浪娜记账-账单-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('JSON 账单导出成功')
}

function exportExcel() {
  if (!hasBills()) return
  const rows = bills.value.map((bill) => ({
    日期: bill.date,
    类型: bill.type === 'income' ? '收入' : '支出',
    一级分类: bill.primaryCategory || bill.category?.split(' / ')[0] || '其他',
    二级分类: bill.secondaryCategory || bill.category?.split(' / ')[1] || '其他',
    金额: Number(bill.amount),
    备注: bill.note || '',
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单')
  XLSX.writeFile(workbook, '冲浪娜记账-账单.xlsx')
  ElMessage.success('Excel 账单导出成功')
}

async function importJson(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const data = JSON.parse(await file.text())
    const importedBills = Array.isArray(data) ? data : data?.bills
    if (!Array.isArray(importedBills)) {
      throw new Error('文件中没有找到账单数组')
    }

    const normalizedBills = importedBills.map((bill, index) => {
      if (!bill || !['income', 'expense'].includes(bill.type)) {
        throw new Error(`第 ${index + 1} 条账单的收支类型不正确`)
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(bill.date || ''))) {
        throw new Error(`第 ${index + 1} 条账单的日期格式不正确`)
      }
      if (!Number.isFinite(Number(bill.amount)) || Number(bill.amount) <= 0) {
        throw new Error(`第 ${index + 1} 条账单的金额必须大于 0`)
      }

      const primaryCategory = String(
        bill.primaryCategory || bill.category?.split(' / ')[0] || '其他',
      )
      const secondaryCategory = String(
        bill.secondaryCategory || bill.category?.split(' / ')[1] || '其他',
      )
      return {
        id: bill.id || `import-${Date.now()}-${index}`,
        type: bill.type,
        primaryCategory,
        secondaryCategory,
        category: `${primaryCategory} / ${secondaryCategory}`,
        amount: Number(bill.amount),
        date: String(bill.date),
        note: String(bill.note || ''),
      }
    })

    const count = billStore.importBills(normalizedBills)
    if (count > 0) {
      ElMessage.success(`成功导入 ${count} 条账单`)
    } else {
      ElMessage.info('没有新的账单需要导入')
    }
  } catch (error) {
    ElMessage.error(error instanceof SyntaxError ? 'JSON 文件格式不正确' : error.message)
  } finally {
    event.target.value = ''
  }
}

async function clearBills() {
  try {
    await ElMessageBox.confirm(
      '将永久删除全部账单，分类和预算设置会保留。此操作无法撤销，确定继续吗？',
      '清空全部账单',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    billStore.clearBills()
    ElMessage.success('全部账单清空成功')
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
        <p>管理收支分类，备份、导入或清空账单</p>
      </div>
    </div>

    <el-card shadow="never" class="content-card category-card">
      <template #header>
        <div class="card-header">
          <strong>分类管理</strong>
          <el-radio-group v-model="selectedType" size="small">
            <el-radio-button value="expense">支出分类</el-radio-button>
            <el-radio-button value="income">收入分类</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="category-toolbar">
        <span>可以新增、修改或删除一级、二级分类</span>
        <el-button type="primary" plain @click="openPrimaryDialog('add')">新增一级分类</el-button>
      </div>

      <div
        v-for="(children, primary) in currentCategories"
        :key="primary"
        class="category-group"
      >
        <div class="category-group-header">
          <strong>{{ primary }}</strong>
          <div>
            <el-button link type="primary" @click="openPrimaryDialog('edit', primary)">修改</el-button>
            <el-button link type="danger" @click="deletePrimaryCategory(primary)">删除</el-button>
          </div>
        </div>

        <div class="secondary-list">
          <div v-for="child in children" :key="child" class="secondary-item">
            <span>{{ child }}</span>
            <div>
              <el-button link type="primary" @click="openSecondaryDialog('edit', primary, child)">修改</el-button>
              <el-button link type="danger" @click="deleteSecondaryCategory(primary, child)">删除</el-button>
            </div>
          </div>
          <el-button class="add-secondary" plain @click="openSecondaryDialog('add', primary)">
            + 新增二级分类
          </el-button>
        </div>
      </div>
      <el-empty
        v-if="!Object.keys(currentCategories).length"
        class="empty-state"
        :image-size="80"
        description="暂无分类，请先新增一级分类"
      />
    </el-card>

    <el-card shadow="never" class="content-card">
      <template #header><strong>账单数据管理</strong></template>
      <div class="setting-row">
        <div>
          <h3>导出账单</h3>
          <p>将当前全部账单备份为 JSON 或 Excel 文件。</p>
        </div>
        <div class="action-buttons">
          <el-button plain @click="exportJson">导出 JSON</el-button>
          <el-button type="primary" plain @click="exportExcel">导出 Excel</el-button>
        </div>
      </div>
      <el-divider />
      <div class="setting-row">
        <div>
          <h3>导入 JSON 账单</h3>
          <p>选择本应用导出的 JSON 文件，新账单会合并到现有记录中。</p>
        </div>
        <el-button type="primary" plain @click="fileInput.click()">选择 JSON 文件</el-button>
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="file-input"
          @change="importJson"
        >
      </div>
      <el-divider />
      <div class="setting-row">
        <div>
          <h3>本地存储</h3>
          <p>当前共有 {{ bills.length }} 条账单，分类、预算和账单均保存在当前浏览器中。</p>
        </div>
      </div>
      <el-divider />
      <div class="setting-row">
        <div>
          <h3 class="expense-text">清空全部账单</h3>
          <p>永久删除全部账单，保留分类和预算设置，清空后无法恢复。</p>
        </div>
        <el-button type="danger" plain :disabled="!bills.length" @click="clearBills">清空账单</el-button>
      </div>
    </el-card>

    <el-dialog v-model="categoryDialog.visible" :title="dialogTitle" width="440px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="categoryDialog.level === 'primary' ? '一级分类名称' : '二级分类名称'">
          <el-input
            v-model="categoryDialog.name"
            maxlength="20"
            show-word-limit
            placeholder="请输入分类名称"
            @keyup.enter="saveCategory"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.category-card {
  margin-bottom: 20px;
}

.category-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.category-toolbar > span {
  color: #98a2b3;
  font-size: 13px;
}

.category-group {
  padding: 18px;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  margin-bottom: 14px;
}

.category-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.category-group-header strong {
  color: #182230;
  font-size: 16px;
}

.secondary-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.secondary-item {
  min-width: 0;
  min-height: 40px;
  padding: 6px 8px 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border-radius: 8px;
  background: #f6f8fb;
  color: #667085;
  font-size: 13px;
}

.secondary-item .el-button {
  margin-left: 2px;
  font-size: 12px;
}

.add-secondary {
  min-height: 40px;
  border-style: dashed;
}

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

.action-buttons {
  display: flex;
  flex-shrink: 0;
}

.file-input {
  display: none;
}

@media (max-width: 900px) {
  .secondary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .category-toolbar,
  .setting-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .secondary-list {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons .el-button {
    flex: 1;
  }
}
</style>
