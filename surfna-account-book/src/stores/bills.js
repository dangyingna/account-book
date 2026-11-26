import { defineStore } from 'pinia'
import { loadStorage, removeStorage, saveStorage } from '../utils/storage'

const BILLS_KEY = 'surfna-account-book-bills'
const BUDGETS_KEY = 'surfna-account-book-budget'
const CATEGORIES_KEY = 'surfna-account-book-categories'

function createDefaultCategories() {
  return {
    expense: {
      日常消费: ['餐饮', '交通', '购物', '住房', '娱乐', '医疗', '教育', '通讯', '其他'],
      投资: ['股票', '基金', '理财产品', '黄金', '其他'],
      人情往来: ['礼金', '红包', '请客', '礼物', '其他'],
      其他: ['其他支出'],
    },
    income: {
      工资: ['基本工资', '绩效奖金', '年终奖', '补贴', '其他'],
      兼职: ['副业收入', '劳务报酬', '稿费', '其他'],
      红包: ['节日红包', '生日红包', '转账红包', '其他'],
      其他: ['理财收益', '退款', '其他收入'],
    },
  }
}

export const useBillStore = defineStore('bills', {
  state: () => {
    const savedBudgets = loadStorage(BUDGETS_KEY, {})
    return {
      bills: loadStorage(BILLS_KEY, []),
      budgets: savedBudgets && typeof savedBudgets === 'object' && !Array.isArray(savedBudgets)
        ? savedBudgets
        : {},
      categories: loadStorage(CATEGORIES_KEY, createDefaultCategories()),
    }
  },
  getters: {
    totalIncome: (state) => state.bills
      .filter((bill) => bill.type === 'income')
      .reduce((total, bill) => total + Number(bill.amount), 0),
    totalExpense: (state) => state.bills
      .filter((bill) => bill.type === 'expense')
      .reduce((total, bill) => total + Number(bill.amount), 0),
    balance() {
      return this.totalIncome - this.totalExpense
    },
    currentMonthBills: (state) => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return state.bills.filter((bill) => bill.date.startsWith(month))
    },
    currentMonthIncome() {
      return this.currentMonthBills
        .filter((bill) => bill.type === 'income')
        .reduce((total, bill) => total + Number(bill.amount), 0)
    },
    currentMonthExpense() {
      return this.currentMonthBills
        .filter((bill) => bill.type === 'expense')
        .reduce((total, bill) => total + Number(bill.amount), 0)
    },
    currentMonthBalance() {
      return this.currentMonthIncome - this.currentMonthExpense
    },
    recentBills: (state) => state.bills.slice(0, 8),
  },
  actions: {
    persist() {
      saveStorage(BILLS_KEY, this.bills)
      saveStorage(BUDGETS_KEY, this.budgets)
    },
    persistCategories() {
      saveStorage(CATEGORIES_KEY, this.categories)
    },
    addBill(bill) {
      this.bills.unshift({
        ...bill,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        amount: Number(bill.amount),
      })
      this.persist()
    },
    removeBill(id) {
      this.bills = this.bills.filter((bill) => bill.id !== id)
      this.persist()
    },
    importBills(incomingBills) {
      const existingIds = new Set(this.bills.map((bill) => bill.id))
      const newBills = incomingBills.filter((bill) => !existingIds.has(bill.id))
      this.bills = [...newBills, ...this.bills]
      saveStorage(BILLS_KEY, this.bills)
      return newBills.length
    },
    clearBills() {
      this.bills = []
      removeStorage(BILLS_KEY)
    },
    setCategoryBudget(category, amount) {
      this.budgets[category] = Number(amount)
      this.persist()
    },
    addPrimaryCategory(type, name) {
      this.categories[type][name] = []
      this.persistCategories()
    },
    renamePrimaryCategory(type, oldName, newName) {
      if (oldName !== newName) {
        const children = this.categories[type][oldName]
        delete this.categories[type][oldName]
        this.categories[type][newName] = children
        this.persistCategories()
      }
    },
    deletePrimaryCategory(type, name) {
      delete this.categories[type][name]
      this.persistCategories()
    },
    addSecondaryCategory(type, primaryName, name) {
      this.categories[type][primaryName].push(name)
      this.persistCategories()
    },
    renameSecondaryCategory(type, primaryName, oldName, newName) {
      if (oldName !== newName) {
        const children = this.categories[type][primaryName]
        const index = children.indexOf(oldName)
        children[index] = newName
        this.persistCategories()
      }
    },
    deleteSecondaryCategory(type, primaryName, name) {
      this.categories[type][primaryName] = this.categories[type][primaryName]
        .filter((category) => category !== name)
      this.persistCategories()
    },
  },
})
