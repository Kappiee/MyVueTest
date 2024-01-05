import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'


createApp(App)
.use(store)
.use(router)
.use(VXETable)
.mount('#app')
