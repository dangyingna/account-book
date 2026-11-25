import { defineStore } from 'pinia'
import { loadStorage, removeStorage, saveStorage } from '../utils/storage'

const BILLS_KEY = 'surfna-account-book-bills'
const BUDGET_KEY = 'surfna-account-book-budget'

export const useBillStore = defineStore('bills', {
  state: () => ({
    bills: loadStorage(BILLS_KEY, []),
    budget: loadStorage(BUDGET_KEY, 3000),
  }),
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
      saveStorage(BUDGET_KEY, this.budget)
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
    setBudget(amount) {
      this.budget = Number(amount)
      this.persist()
    },
    clearData() {
      this.bills = []
      this.budget = 3000
      removeStorage(BILLS_KEY)
      removeStorage(BUDGET_KEY)
    },
  },
})
