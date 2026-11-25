# 冲浪娜记账

一个基于 Vue 3 + Vite 的本地记账应用，无需后端或数据库，账单与预算数据保存在浏览器 localStorage 中。

## 功能页面

- 首页：展示收入、支出、结余和最近账单
- 记一笔：记录收入或支出
- 统计：使用 ECharts 展示支出分类占比
- 预算：设置每月预算并查看本月使用情况
- 设置：导出 Excel 账单或清空本地数据

## 技术栈

- Vue 3
- Vite
- Element Plus
- Pinia
- ECharts
- XLSX

## 本地运行

```bash
npm install
npm run dev
```

启动后，打开终端中显示的本地地址即可预览。

## 构建项目

```bash
npm run build
```

构建结果位于 `dist` 目录。

## 目录结构

```text
src/
  components/  公共组件（包含 SideMenu 侧边栏）
  views/       五个功能页面
  stores/      Pinia 状态与账单数据操作
  utils/       localStorage 等工具函数
  assets/      静态资源
```

## 数据说明

数据只保存在当前使用的浏览器中。清除浏览器网站数据或在设置页清空数据后，账单无法恢复，建议定期在设置页导出 Excel 备份。
