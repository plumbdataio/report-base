<template>
  <b-container class="p-0">
    <HeaderRow>現場工事</HeaderRow>
    <b-row align-v="center" class="m-0 mb-1 month-button-row">
      <b-radio-group v-model="displaySwitch">
        <b-radio value="monthly" @change="showSelectedMonth">月別</b-radio>
        <b-radio value="daily" @change="showSelectedDate">日別</b-radio>
      </b-radio-group>
      <b-button-group v-if="displaySwitch === 'monthly'" class="m-1" size="sm">
        <b-button size="sm" @click="addMonth(-1)">前月</b-button>
        <b-button size="sm" @click="addMonth(1)">翌月</b-button>
      </b-button-group>
      <div>
        <MonthPicker v-if="shown && displaySwitch === 'monthly'" v-model="monthSelected"></MonthPicker>
        <DatePicker v-if="displaySwitch === 'daily'" class="datepicker" v-model="dateSelected"></DatePicker>
      </div>
    </b-row>
    <b-row class="m-0">
      <b-table-simple sticky-header="90%" stacked="md" striped hover class="bordered-table">
        <!-- <b-thead :head-variant="displaySwitch === 'monthly' ? 'dark' : 'light'"> -->
        <b-thead class="theme-thead-color1">
          <b-tr>
            <b-th>発注元</b-th>
            <b-th>工事名</b-th>
            <b-th>工期</b-th>
            <b-th class="text-nowrap">メンバー<br>(該当期間内)</b-th>
            <b-th class="text-nowrap">車両情報</b-th>
            <b-th class="table-button-td"></b-th>
          </b-tr>
        </b-thead>
        <b-tbody>
          <b-tr v-if=" ! fetched">
            <b-th colspan="6" class="text-center">
              <b-spinner variant="info"></b-spinner>
            </b-th>
          </b-tr>
          <b-tr v-if="fetched && (projectList == null || isEmpty(projectList))">
            <b-td colspan="9" align="center">データがありません。</b-td>
          </b-tr>
          <template v-if="fetched">
            <template v-for="(project, projectId) in projectList">
              <b-tr :key="projectId" class="border-bottom border-left">
                <b-td stacked-heading="発注元">{{ project.primeContractorName }}</b-td>
                <b-td stacked-heading="工事名">{{ project.projectName }}</b-td>
                <b-td stacked-heading="工期">
                  {{ project.dateStart.split('-').join('/') }}〜<br>
                  {{ dateEndOrUndetermined(project.dateEnd) }}
                  </b-td>
                <b-td stacked-heading="作業員名">
                  <div v-if="project.assignedStaff == null" class="text-info">(未アサイン)</div>
                  <template v-for="(staff, staffId, index) in project.assignedStaff">
                    <p class="mt-0 mb-0" :key="`staff-name-${staffId}`">
                      {{ index + 1 }}. {{ staff.staffName }}
                      <span v-if="$mq !== 'sm'" style="font-size: 0.7em"> ({{staff.companyName.replace(/[ 　]?(株式|有限)会社[ 　]?/g, "")}}) </span>
                      <span v-if="staffId === project.uidDirector">(責)</span>
                      <span v-if="staff.isReporter === true">(日)</span>
                      <span v-if="staffId === project.uidExpense">(経)</span>
                    </p>
                  </template>
                </b-td>
                <b-td stacked-heading="車両情報">
                  <template v-for="(car, carIndex) in project.assignedCar">
                    <p class="mt-0 mb-0" :key="`car-name-${carIndex}`">{{ carIndex + 1 }}. {{ car.name }}</p>
                  </template>
                </b-td>
                <b-td class="table-button-td">
                  <b-button size="sm" class="text-nowrap mt-1 mb-1" variant="primary" @click="push(projectId, project)" :disabled="project.assignedStaff == null">日報</b-button>
                  <b-button size="sm" class="text-nowrap mt-1 mb-1" variant="secondary" @click="showDetail(projectId, project)">詳細</b-button>
                  <b-button v-if="$store.getters.role === 'admin'" size="sm" class="text-nowrap mt-1 mb-1" variant="outline-warning" @click="duplicateProject(projectId, project)">複製</b-button>
                  <b-button v-if="$store.getters.role === 'admin'" size="sm" class="text-nowrap mt-1 mb-1" variant="outline-danger" @click="inactivateProject(projectId)">削除</b-button>
                </b-td>
              </b-tr>
            </template>
          </template>
        </b-tbody>
      </b-table-simple>
      <b-modal id="detail" size="lg" scrollable hide-header footer-class="justify-content-end">
        <project-register mode="read"></project-register>
        <template #modal-footer>
          <b-button-toolbar>
            <b-button v-if="$store.getters.role === 'admin'" size="sm" variant="danger" class="mr-2" @click="$router.push('/project-register/update')">編集</b-button>
            <b-button size="sm" variant="primary" class="mr-2" @click="print">印刷</b-button>
            <b-button size="sm" variant="outline-info" @click="$bvModal.hide('detail')">OK</b-button>
          </b-button-toolbar>
        </template>
      </b-modal>
    </b-row>
  </b-container>
</template>

<style scoped>
.datepicker {
  max-width: 200px;
}
.bordered-table > tbody > tr > td {
  border-right: 1px solid lightgrey;
}
.month-button-row {
  -ms-flex-pack: start !important;
  -webkit-box-pack: start !important;
  justify-content: flex-start !important;
}
.table-button-td {
  max-width:70px !important;
}
@media screen and (max-width: 768px) {
  .month-button-row {
    -ms-flex-pack: center !important;
    -webkit-box-pack: center !important;
    justify-content: center !important;
  }
  .table-button-td {
    max-width:100% !important;
    text-align: center;
  }
  .bordered-table {
    max-width: 100%;
    min-width: 100%;
  }
}
</style>

<script>
import ProjectRegister from '@/pages/project-register.vue'
import isEmpty from 'lodash/isEmpty'


export default {
  components:{
    ProjectRegister,
  },
  beforeRouteEnter(to, from, next) {
    if( ! from.path.startsWith("/onsite-report")) {
      next(vm => {
        console.log(`'monthSelected' in store has been reset to this month.`);
        vm.$store.commit('monthSelected', vm.$dayjs().format('YYYY-MM'))
      })
    }
    next()
  },
  mounted() {
    // This is necessary to migrate from old object-styled "monthSelected" to plane-text.
    if(typeof this.$store.getters.monthSelected === 'object') {
      this.$store.commit('monthSelected', this.$dayjs().format('YYYY-MM'))
    }
    // Caused by old code, monthSelected could be "" and thus we need to fill anything other than "" or null.
    if(this.$store.getters.monthSelected == null || this.$store.getters.monthSelected === "") {
      this.$store.commit('monthSelected', this.$dayjs().format('YYYY-MM'))
    }
    this.monthSelected = this.$store.getters.monthSelected ?? this.$dayjs().format('YYYY-MM')
    this.showSelectedMonth()
  },
  data() {
    return {
      fetched: false,
      shown: true,
      displaySwitch: 'monthly',
      dateSelected: `${this.$dayjs().format('YYYY-MM-DD')}`,
      projectList: {},
      projectCredential: {},
      monthSelected: null
    }
  },
  watch: {
    monthSelected: function() {
      this.showSelectedMonth(this.monthSelected)
    },
    dateSelected: function() {
      this.showSelectedDate(this.dateSelected)
    }
  },
  methods: {
    isEmpty,
    push(projectId, project) {
      this.$store.commit('project', project)
      if(this.$store.getters.project == null) {
        alert("this.$store.projectが空です。")
        return
      }
      this.$router.push(`/onsite-report/${projectId}/${this.monthSelected}`)
    },
    getDayjsWithSelectedMonth(){
      const array = this.monthSelected.split('-')
      return this.$dayjs().year(array[0]).month(array[1] - 1)
    },
    showSelectedDate(){
      this.monthSelected = this.dateSelected.split('-').slice(0,2).join('-')
      this.$store.commit('monthSelected', this.monthSelected)
      this.fetchProjectList(this.dateSelected, this.dateSelected)
    },
    showSelectedMonth(){
      this.$store.commit('monthSelected', this.monthSelected)
      const startOfMonth = this.getDayjsWithSelectedMonth().startOf('month').format("YYYY-MM-DD")
      const endOfMonth = this.getDayjsWithSelectedMonth().endOf('month').format("YYYY-MM-DD")
      this.fetchProjectList(startOfMonth, endOfMonth)
    },
    fetchProjectList(dateStart, dateEnd){
      this.fetched = false
      this.$firebase.db.fetchProjectList(dateStart, dateEnd)
              .then(list => {
                  this.projectList = {}
                  if(list != null ) {
                    Object.keys(list).forEach(projectId => {
                      if(list[projectId].status != null && list[projectId].status === "in-active")
                        return

                      const staffs = list[projectId].assignedStaff
                      if(this.$store.getters.role === 'subcontractor'
                          && (staffs == null || staffs[this.$store.getters.loginUser.uid] == null))
                          return

                      if(staffs != null ) {
                        Object.keys(staffs).forEach(staffId => {
                          const staff = staffs[staffId]
                          if((staff.dateIn !== "" && staff.dateIn > dateEnd) || ( staff.dateOut !== "" && staff.dateOut < dateStart))
                            delete list[projectId].assignedStaff[staffId]
                        })
                      }
                      this.$set(this.projectList, projectId, list[projectId])
                    })
                  }
                  this.fetched = true
              })
    },
    addMonth(num) {
      this.shown = false
      this.monthSelected = this.getDayjsWithSelectedMonth().add(num,'month').format('YYYY-MM')
      this.showSelectedMonth()
      this.$nextTick(() => {this.shown = true})
    },
    dateEndOrUndetermined(dateEnd) {
      dateEnd = dateEnd.split('-').join('/')
      if(dateEnd.startsWith("9"))
        return "(未定)"
      return dateEnd
    },
    showDetail(projectId, project) {
      const data = {}
      data[projectId] = project
      this.$store.commit('project', data)
      this.$bvModal.show("detail")
    },
    print() {
      this.$router.push('/project-register/print')
    },
    inactivateProject(projectId) {
      if( ! confirm('該当の工事を削除してもよろしいですか？\n\n※実際は「非アクティブ」のステータスになるのみで、データは削除されません。'))
        return
      this.$firebase.db.inactivateProject(projectId)
              .then(result => {
                alert('削除が完了しました。')
                this.addMonth(0)
              })
              .catch(error => {
                alert(`削除に失敗しました。\nエラー内容：${JSON.stringify(error)}`)
              })
    },
    duplicateProject(projectId, project) {
      const data = {}
      data[projectId] = project
      this.$store.commit('project', data)
      this.$router.push('/project-register/duplicate')
    }
  }
};
</script>