import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Vue Router configuration
import store from './store';   // Vuex store for state management

// Global CSS (if any)
import './assets/styles.css';

// Create the Vue application
const app = createApp(App);

// Integrate plugins
app.use(router); // Use Vue Router
app.use(store);  // Use Vuex store

// Mount the application
app.mount('#app');
