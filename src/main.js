import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './design-system/themes/love-letter.css'
import './design-system/themes/minimal.css'
import './design-system/themes/dark.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
