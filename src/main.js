import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import { Analytics } from '@vercel/analytics/vue';

createApp(App)
  .use(Analytics)
  .mount('#app');
