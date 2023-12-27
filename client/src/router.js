import Vue from 'vue';
import VueRouter from 'vue-router'

import TopMenu from '@/pages/top-menu.vue'
import InhouseReport from '@/pages/inhouse-report.vue'
import WeldingReport from '@/pages/welding-report.vue'
import PipeRelocation from '@/pages/pipe-relocation.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: TopMenu },
    { path: '/inhouse-report', component: InhouseReport },
    { path: '/welding-report', component: WeldingReport },
    { path: '/pipe-relocation', component: PipeRelocation },
  ]
})

export default router
