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
    component: () => import(/* webpackChunkName: "about" */ '../views/DraggableTable.vue')
  },
  {
    path: '/CraftTable',
    name: 'CraftTable',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/CraftTable.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
