<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useBillStore } from '../stores/bills'

const emit = defineEmits(['saved'])
const billStore = useBillStore()
const formRef = ref()

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const form = reactive({
  type: 'expense',
  amount: null,
  category: '餐饮',
  date: today(),
  note: '',
})

const categories = {
  expense: ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '其他'],
  income: ['工资', '奖金', '兼职', '理财', '红包', '其他'],
}

const categoryOptions = computed(() => categories[form.type])
const rules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

watch(() => form.type, () => {
  form.category = categoryOptions.value[0]
})

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (form.amount <= 0) {
    ElMessage.warning('金额必须大于 0')
    return
  }

  billStore.addBill({ ...form })
  ElMessage.success('记账成功')
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
          <el-radio-group v-model="form.type">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="金额（元）" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :controls="false"
            placeholder="0.00"
            class="full-width"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="分类" prop="category">
            <el-select v-model="form.category" class="full-width">
              <el-option
                v-for="category in categoryOptions"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="日期" prop="date">
            <el-date-picker
              v-model="form.date"
              type="date"
              value-format="YYYY-MM-DD"
              :clearable="false"
              class="full-width"
            />
          </el-form-item>
        </div>

        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            placeholder="补充这条账单的说明（选填）"
          />
        </el-form-item>

        <el-button type="primary" size="large" class="full-width" @click="submit">
          保存账单
        </el-button>
      </el-form>
    </el-card>
  </section>
</template>
