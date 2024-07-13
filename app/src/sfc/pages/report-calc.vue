<template>
<div>
  <HeaderRow>日報集計</HeaderRow>
  <div class="mt-3 d-flex gap-20 align-items-center">
    <MonthPicker v-model="controls.month" size="md"></MonthPicker>
    <b-select v-model="controls.selectedStaffId" :options="controls.staffList" value-field="staffId" text-field="staffName" :style="controls.selectedStaffId == null ? 'color: var(--pale-gray);': ''" style="max-width: 200px;">
      <template v-if=" ! controls.isStaffFetched">
        <b-select-option disabled :value="null">(データの取得中...)</b-select-option>
      </template>
    </b-select>
    <b-button class="text-nowrap" :disabled="controls.selectedStaffId == null" @click="buildSummary">Excelへ出力</b-button>
  </div>
  <b-overlay :show=" ! controls.isConfidentialAssigned" no-center>
    <template #overlay>
      <div class="w-100 text-center mt-4 font-weight-bold" style="color: var(--warning);">氏名を選択してください...</div>
    </template>
      <b-card class="mt-4" body-class="d-flex flex-column gap-10">
        <template v-if=" ! controls.isConfidentialAssigned">
          <StaffConfidentialEditor key="dummy-confidential-editor" :confidential="form.confidential" :staff="form.staff"></StaffConfidentialEditor>
        </template>
        <template v-else>
          <StaffConfidentialEditor key="confidential-editor" :confidential="form.confidential" :staff="form.staff" @change="updateStaffOrStaffConfidential"></StaffConfidentialEditor>
        </template>
      </b-card>
  </b-overlay>
</div>
</template>

<style scoped>
.sub-label {
  color: #bdbdbd;
  font-weight: bold;
}
</style>

<script lang="ts">
import MonthPicker from '@/sfc/components/month-picker.vue'
import StaffConfidentialEditor from '@/sfc/components/staff-confidential-editor.vue'
import { Staff } from '@/schema/Staff'
import { StaffConfidential } from '@/schema/StaffConfidential'
import { SummaryTotal } from '@/schema/Summary'

export default {
  async created() {
    this.controls.staffList = await this.$firebase.db.searchStaff("in-source") ?? []
    if(this.$tstore.pages.dbUser.affiliation === "system-developer") {
      const additionalStaffList = await this.$firebase.db.searchStaff("system-developer") ?? []
      this.controls.staffList.push(...additionalStaffList)
    }
    this.controls.isStaffFetched = true
  },
  components: {
    MonthPicker,
    StaffConfidentialEditor,
  },
  data() {
    return {
      controls: {
        month: this.$dayjs().format("YYYY-MM"),
        isStaffFetched: false,
        isConfidentialAssigned: false,
        staffList: [] as Staff[],
        selectedStaffId: null,
      },
      form: {
        confidential: new StaffConfidential(),
        staff: new Staff()
      }
    }
  },
  watch: {
    "controls.selectedStaffId": async function(staffId : number) {
      this.controls.isConfidentialAssigned = false
      const findStaffResult = this.controls.staffList.find(staff => staff.staffId == staffId)
      if( ! findStaffResult) {
        this.$bvModal.msgBoxOk(`エラー：選択した方の「基本データ」を取得できませんでした。`)
        return
      }
      const findStaffConfidentialResult = await this.$firebase.db.fetchStaffConfidential(staffId)
      if( ! findStaffConfidentialResult) {
        this.$bvModal.msgBoxOk(`エラー：選択した方の「機密データ」を取得できませんでした。`)
        return
      }
      this.form.staff = findStaffResult
      this.form.confidential = findStaffConfidentialResult
      this.controls.isConfidentialAssigned = true
    },
  },
  methods: {
    async buildSummary() {
      if(this.form.confidential == null) {
        return
      }

      const selectedStaff = this.controls.staffList.find(staff => staff.staffId == this.controls.selectedStaffId)?.toJSON()
      if( ! selectedStaff ) {
        throw Error(`Error: Couldn't find staffId '${this.controls.selectedStaffId}' in controls.staffList.`)
      }
      const {firstDate, lastDate} = this.getFirstAndLastDateOfMonth(this.controls.month)

      if( ! this.controls.selectedStaffId) {
        throw Error("Error: selectedStaffId shouldn't be nullish")
      }
      const staffId =  this.controls.selectedStaffId
      const confidential =  this.form.confidential
      const affiliation =  selectedStaff.affiliation

      const reports = await this.$firebase.db.fetchReport(firstDate, lastDate, staffId, affiliation)
      const dbUser = await this.$firebase.db.fetchStaffById(staffId)
      const projectList = await this.$firebase.db.fetchProjectsWithStatusFilter()
      console.log(`this.controls.month: ${this.controls.month}`);
      const st = new SummaryTotal(dbUser, confidential, reports, projectList, this.controls.month)
      await st.summarize()
    },
    updateStaffOrStaffConfidential(staffOrStaffConfidential : Staff|StaffConfidential) {
      if(staffOrStaffConfidential instanceof Staff) {
        this.form.staff = staffOrStaffConfidential
      } else {
        this.form.confidential = staffOrStaffConfidential
      }
    },
  }
}
</script>