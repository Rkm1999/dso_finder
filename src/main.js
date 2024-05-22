import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import { inject } from '@vercel/analytics';

createApp(App)
  .use(inject)
  .mount('#app');
