<template>
  <b-card>
    <b-container class="m-0">
      <b-row>
        <b-col cols="auto">
          <b-button size="sm" variant="outline-secondary" v-b-toggle.unreportedStaffCollapse>{{isUnreportedStaffVisible ? "▲" : "▼"}}</b-button>
        </b-col>
        <b-col class="pl-0 align-self-center">
          <div>日報の未入力状況</div>
        </b-col>
      </b-row>
    </b-container>
    <b-container>
      <b-collapse id="unreportedStaffCollapse" v-model="isUnreportedStaffVisible">
        <hr>
        <b-row class="mt-3">
          <b-col>
            <h4>
              <b-input-group>
                <label>対象日：</label>
                <DatePicker :value="unreportedStaff.targetDate" @input="fetchUnreportedStaffList"></DatePicker>
              </b-input-group>
            </h4>
          </b-col>
        </b-row>
        <b-row class="mt-3">
          <b-col class="text-center">
            <b-overlay :show=" ! isUnreportedStaffListFetched">
              <b-table responsive small show-empty :empty-text="unreportedStaff.message" :items="unreportedStaff.list" :fields="unreportedStaff.fields"></b-table>
            </b-overlay>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="text-right">
            <b-button size="sm" variant="warning" @click="fetchUnreportedStaffList()">更新</b-button>
          </b-col>
        </b-row>
      </b-collapse>
    </b-container>
  </b-card>
</template>

<script>
export default {
  created() {
    this.fetchUnreportedStaffList()
  },
  data() {
    return {
      isUnreportedStaffListFetched: false,
      isUnreportedStaffVisible: false,
      unreportedStaff: {
        message: "",
        targetDate: this.$dayjs().subtract(1, 'day').format("YYYY-MM-DD"),
        list: [],
        fields: [
          {key:'name', label:'氏名'},
          {key:'action', label:'ステータス'}
        ],
      },
    }
  },
  methods: {
    fetchUnreportedStaffList(newValue) {
      this.isUnreportedStaffListFetched = false
      if(newValue != null) {
        this.unreportedStaff.targetDate = newValue
      }
      this.$firebase.db.fetchUnreportedStaffList(this.unreportedStaff.targetDate)
      .then(data => {
        if(data?.reportNotSubmitted.length === 0 && data?.unlistedOnFactorySchedule.length === 0) {
          this.unreportedStaff.message = "未入力の方や、スケジュールに登録のない方はいません。"
          this.unreportedStaff.list = []
        } else {
          this.unreportedStaff.message = "対応が必要な方のリストです。"
          this.unreportedStaff.list = []
          data?.reportNotSubmitted?.forEach(name => {
            this.unreportedStaff.list.push({
              action: "日報未入力",
              name: name
            })
          })
          data?.unlistedOnFactorySchedule?.forEach(name => {
            this.unreportedStaff.list.push({
              action: "スケジュール未登録",
              name: name
            })
          })
        }

        this.isUnreportedStaffListFetched = true
      })
    },
  }
}
</script>