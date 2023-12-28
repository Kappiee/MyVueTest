import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/DraggableTable',
    name: 'DraggableTable',
    component: () => import(/* DraggableTable: "about" */ '../views/DraggableTable.vue')
  },
  {
    path: '/CraftTable',
    name: 'CraftTable',
    component: () => import(/* CraftTable: "about" */ '../views/CraftTable.vue')
  },
  {
    path: '/ExportPartBom',
    name: 'ExportPartBom',
    component: () => import(/* CraftTable: "about" */ '../views/ExportPartBom.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
