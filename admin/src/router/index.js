import Vue from 'vue';
import VueRouter from 'vue-router'
import store from '@/store/index.js'

import ProjectList from '@/pages/project-list.vue'
import OnsiteReport from '@/pages/onsite-report.vue'
import FactorySchedule from '@/pages/factory-schedule.vue'
import InhouseReportAdmin from '@/pages/inhouse-report-admin.vue'
import WorkAndUnitAdmin from '@/pages/work-and-unit-admin.vue'
import ProfitAnalysis from '@/pages/profit-analysis.vue'
import SalesAndExpenses from '@/pages/sales-and-expenses.vue'
import TimesheetConverter from '@/pages/timesheet-converter.vue'
import ProjectRegister from '@/pages/project-register.vue'
import Billing from '@/pages/billing.vue'
import StaffAdmin from '@/pages/staff-admin.vue'
import ContractorAdmin from '@/pages/contractor-admin.vue'
import MyAccount from '@/pages/my-account.vue'

import ThemeChecker from '@/pages/internal/theme-checker.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: ProjectList },
    { path: '/project-list', component: ProjectList },
    { path: '/onsite-report/:projectId/:yearMonth', component: OnsiteReport },
    { path: '/factory-schedule', component: FactorySchedule},
    { path: '/inhouse-report-admin', component: InhouseReportAdmin},
    { path: '/work-and-unit-admin', component: WorkAndUnitAdmin},
    { path: '/analysis/profit-analysis', component: ProfitAnalysis },
    { path: '/analysis/sales-and-expenses', component: SalesAndExpenses },
    { path: '/accounting/timesheet-converter', component: TimesheetConverter},
    { path: '/billing', component: Billing },
    { path: '/project-register/:mode', component: ProjectRegister, props: true },
    { path: '/staff-admin', component: StaffAdmin },
    { path: '/contractor-admin', component: ContractorAdmin },
    { path: '/my-account', component: MyAccount },
    { path: '/__internal/theme-checker', component: ThemeChecker },
    { path: '*', redirect: '/' },
  ]
})

router.beforeEach((to,from,next) => {
  store.commit('showSidebar', true)
  next()
})

export default router