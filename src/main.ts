import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

function useTable (app: any) {
  app.use(VXETable)
}


createApp(App)
.use(store)
.use(router)
.use(useTable)
.mount('#app')
