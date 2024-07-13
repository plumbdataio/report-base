import Vue from 'vue';
import VueRouter from 'vue-router'
import {tstore} from '@/store/index'

import ReportInput from '@/sfc/pages/report-input.vue'
import ReportList from '@/sfc/pages/report-list.vue'
import ReportCalc from '@/sfc/pages/report-calc.vue'
import ProjectAdmin from '@/sfc/pages/project-admin.vue'
import StaffAdmin from '@/sfc/pages/staff-admin.vue'
import Contact from '@/sfc/pages/contact.vue'
import MyAccount from '@/sfc/pages/my-account.vue'

import ThemeChecker from '@/sfc/pages/internal/theme-checker.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: ReportInput },
    { path: '/report-input/:mode', component: ReportInput },
    { path: '/report-list', component: ReportList },
    { path: '/report-calc', component: ReportCalc },
    { path: '/project-admin', component: ProjectAdmin },
    { path: '/staff-admin', component: StaffAdmin },
    { path: '/contact', component: Contact },
    { path: '/my-account', component: MyAccount },
    { path: '/__internal/theme-checker', component: ThemeChecker },
    { path: '*', redirect: '/' },
  ]
})

router.beforeEach((to,from,next) => {
  tstore.pages.setShowSidebar(true)
  next()
})

export default router