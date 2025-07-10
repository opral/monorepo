import DefaultTheme from 'vitepress/theme'
import LixSandpack from '../components/LixSandpack.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LixSandpack', LixSandpack)
  }
}