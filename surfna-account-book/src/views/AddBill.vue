<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useBillStore } from '../stores/bills'

const emit = defineEmits(['saved'])
const billStore = useBillStore()
const { categories } = storeToRefs(billStore)
const formRef = ref()

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const form = reactive({
  type: 'expense',
  primaryCategory: '',
  secondaryCategory: '',
  amount: null,
  date: today(),
  note: '',
})

const primaryCategoryOptions = computed(() => Object.keys(categories.value[form.type]))
const secondaryCategoryOptions = computed(() => {
  return form.primaryCategory ? categories.value[form.type][form.primaryCategory] : []
})

function validateAmount(rule, value, callback) {
  if (value === null || value === undefined || value === '') {
    callback(new Error('请输入金额'))
    return
  }
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    callback(new Error('金额必须为大于 0 的数字'))
    return
  }
  callback()
}

const rules = {
  primaryCategory: [{ required: true, message: '请选择一级分类', trigger: 'change' }],
  secondaryCategory: [{ required: true, message: '请选择二级分类', trigger: 'change' }],
  amount: [{ required: true, validator: validateAmount, trigger: ['blur', 'change'] }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

watch(() => form.type, () => {
  form.primaryCategory = ''
  form.secondaryCategory = ''
  formRef.value?.clearValidate(['primaryCategory', 'secondaryCategory'])
})

function handlePrimaryCategoryChange() {
  form.secondaryCategory = ''
  formRef.value?.clearValidate('secondaryCategory')
}

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  billStore.addBill({
    type: form.type,
    primaryCategory: form.primaryCategory,
    secondaryCategory: form.secondaryCategory,
    category: `${form.primaryCategory} / ${form.secondaryCategory}`,
    amount: form.amount,
    date: form.date,
    note: form.note,
  })
  ElMessage.success('保存成功')
  emit('saved')
}
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <h1>记一笔</h1>
        <p>记录收入或支出，养成记账好习惯</p>
      </div>
    </div>

    <el-card shadow="never" class="content-card form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="收支类型">
          <el-radio-group v-model="form.type" class="type-switch">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="form-row">
          <el-form-item label="一级分类" prop="primaryCategory">
            <el-select
              v-model="form.primaryCategory"
              placeholder="请选择一级分类"
              class="full-width"
              @change="handlePrimaryCategoryChange"
            >
              <el-option
                v-for="category in primaryCategoryOptions"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="二级分类" prop="secondaryCategory">
            <el-select
              v-model="form.secondaryCategory"
              :disabled="!form.primaryCategory"
              :placeholder="form.primaryCategory ? '请选择二级分类' : '请先选择一级分类'"
              class="full-width"
            >
              <el-option
                v-for="category in secondaryCategoryOptions"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            :step="0.01"
            :controls="false"
            placeholder="请输入金额"
            class="full-width amount-input"
          >
            <template #prefix>¥</template>
            <template #suffix>元</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            :clearable="false"
            class="full-width"
          />
        </el-form-item>

        <el-form-item label="备注（选填）">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="补充这条账单的说明，最多 200 字"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="full-width save-button" @click="submit">
          保存记录
        </el-button>
      </el-form>
    </el-card>
  </section>
</template>

<style scoped>
.type-switch {
  display: flex;
  width: 100%;
}

.type-switch :deep(.el-radio-button) {
  flex: 1;
}

.type-switch :deep(.el-radio-button__inner) {
  width: 100%;
  padding-top: 12px;
  padding-bottom: 12px;
}

.amount-input :deep(.el-input__prefix),
.amount-input :deep(.el-input__suffix) {
  color: #667085;
  font-size: 15px;
}

.save-button {
  margin-top: 8px;
  font-size: 16px;
}
</style>
