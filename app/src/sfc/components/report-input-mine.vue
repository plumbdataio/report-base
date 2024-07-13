<template>
<div class="card-wrapper d-flex flex-column">
  <div class="w-100 d-flex justify-content-end">
    <b-select size="sm" class="w-50" v-model="controls.selectedHistory" :disabled="$route.params.mode === 'edit'">
      <b-select-option :value="null">{{ $route.params.mode === "edit" ? "※ 編集時には過去の履歴は利用できません" : "-- 過去の履歴を複製する --" }}</b-select-option>
      <template v-if="controls.history.length === 0">
        <b-select-option disabled :value="null">(履歴がありません)</b-select-option>
      </template>
      <template v-for="reportLike in controls.history">
        <b-select-option :value="reportLike">{{ $dayjs(reportLike.date, {format: "YYYY/MM/DD"}).format("YYYY年MM月DD日(ddd)") }}</b-select-option>
      </template>
      <template v-if="controls.history.length > 0 && $tstore.pages.dbUser.affiliation === 'system-developer'">
        <b-select-option value="delete-history">(全ての履歴を削除)</b-select-option>
      </template>
    </b-select>
  </div>
  <b-overlay :show=" ! controls.isMyStaffDataFetched" no-center>
    <template #overlay>
      <div class="w-100 text-center mt-4">
        <b-spinner variant="secondary"></b-spinner>
      </div>
    </template>
    <div class="card-wrapper d-flex flex-column">
      <b-card title="勤怠">
        <b-container>
          <b-row align-v="center">
            <b-col cols="12" md="3" class="text-md-right">
              <label class="text-nowrap">氏名</label>
            </b-col>
            <b-col cols="12" md="7">
              <b-input id="input-name" v-model="$v.form.report?.name.$model" @blur="$v.form.report?.name.$touch()" :disabled="form.report.name !== ''"></b-input>
              <div v-if="form.report.name == ''" class="error-message">※必須項目です</div>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="12" md="3" class="text-md-right">
              <label>勤務日</label>
            </b-col>
            <b-col cols="12" md="7">
              <DatePicker :reset-button="false" size="md" value-as-date v-model="form.report.date" :disabled="$route.query?.report != null && $route.params.mode === 'edit'"></DatePicker>
              <div v-if="form.report.date == null" class="error-message">※必須項目です</div>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="12" md="3" class="text-md-right">
              <label>出勤状況</label>
            </b-col>
            <b-col cols="12" md="7">
              <b-select :options="$tstore.bundles.options.attendance" v-model="form.report.attendance"></b-select>
              <div v-if="form.report.attendance == null" class="error-message">※必須項目です</div>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="12" md="3" class="text-md-right">
              <label>勤務時間</label>
            </b-col>
            <b-col cols="12" md="3">
              <b-timepicker minutes-step="15" v-model="form.report.startTime" :disabled=" ! form.report.isAttended()"></b-timepicker>
              <div v-if="form.report.startTime == null" class="error-message">※必須項目です</div>
            </b-col>
            <b-col cols="12" md="1" class="text-center">
              <div :style="$mq.match(/xs|sm/) ? 'rotate: 90deg;' : ''">〜</div>
            </b-col>
            <b-col cols="12" md="3">
              <b-timepicker minutes-step="15" v-model="form.report.endTime" :disabled=" ! form.report.isAttended()"></b-timepicker>
              <div v-if="form.report.endTime == null" class="error-message">※必須項目です</div>
            </b-col>
          </b-row>
          <b-row class="mt-1" v-if="form.report.endTime < form.report.startTime">
            <b-col cols="12" md="3"></b-col>
            <b-col>
              <div class="warning-message">※退勤時間が出勤時間より前の場合、退勤時間は「翌日」を意味します</div>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="12" md="3" class="text-md-right">
              <label>休憩実績</label>
            </b-col>
            <b-col cols="12" md="7">
              <b-timepicker minutes-step="15" v-model="form.report.breakTime" :disabled=" ! form.report.isAttended()"></b-timepicker>
              <div v-if="form.report.attendance == null" class="error-message">※必須項目です</div>
            </b-col>
          </b-row>
          <b-row class="m-0 mt-1">
            <b-col cols="12" md="3"></b-col>
            <b-col cols="12" md="9">
                <div v-if=" ! form.report.isAttended()" class="warning-message">※出勤状況が「{{$optionValueTo("attendance", form.report.attendance, "text")}}」の場合は入力不要です。</div>
            </b-col>
          </b-row>
          <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
            <b-col cols="12" md="3" class="text-md-right">
              <label>備考</label>
            </b-col>
            <b-col cols="12" md="7">
              <b-textarea v-model="form.report.remarks"></b-textarea>
            </b-col>
          </b-row>
        </b-container>
      </b-card>
      <template v-for="allowance in [misc.safeConfidential?.allowance]">
        <template v-if="allowance == null || (allowance?.transportation?.calcOption != null && allowance?.transportation?.calcOption !== 'none')">
          <b-card title="手当(工場・本社勤務時)">
            <b-container>
              <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
                <b-col cols="6" md="3" class="text-md-right">
                  <label>通勤費(日別)</label>
                </b-col>
                <b-col cols="6" md="9">
                  <b-checkbox switch v-model="form.report.allowance.transportation" :disabled=" ! form.report.isAttended() || form.report.allowance.travel === true"></b-checkbox>
                  <div v-if=" ! form.report.isAttended()" class="warning-message">※出勤していない場合、交通費は申請できません</div>
                  <div v-if="form.report.allowance.travel === true" class="warning-message">※出張手当がONの場合、通勤費は申請できません</div>
                </b-col>
              </b-row>
            </b-container>
          </b-card>
        </template>
      </template>
      <b-card title="手当(出張時)">
        <b-container>
          <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
            <b-col cols="6" md="3" class="text-md-right">
              <label>食事手当</label>
            </b-col>
            <b-col cols="6" md="8">
              <div class="d-flex gap-20" :class="/sm|md/.test($mq) ? 'flex-column' : 'flex-row'">
                <template v-for="meal in $tstore.bundles.options.meals">
                  <b-checkbox :key="`meal-${meal.value}`" switch v-model="form.report.allowance[meal.value]">{{ meal.text }}</b-checkbox>
                </template>
              </div>
            </b-col>
          </b-row>
          <hr class="d-md-none">
          <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
            <b-col cols="6" md="3" class="text-md-right">
              <label>出張手当</label>
            </b-col>
            <b-col cols="6" md="9">
              <b-checkbox switch v-model="form.report.allowance.travel" :disabled="form.report.allowance.transportation === true"></b-checkbox>
              <div v-if="form.report.allowance.transportation === true" class="warning-message">※通勤費がONの場合、出張手当は申請できません</div>
            </b-col>
          </b-row>
          <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
            <b-col cols="6" md="3" class="text-md-right">
              <label>手当の工番</label>
            </b-col>
            <b-col cols="6" md="7">
              <b-select v-model="form.report.allowance.projectId">
                <b-select-option disabled :value="null">-- 選択してください --</b-select-option>
                <template v-for="project in projectOption">
                  <b-select-option :value="project.value">{{project.value }}: {{ project.text }}</b-select-option>
                </template>
              </b-select>
              <div v-if=" ! $v.form.report?.allowance.projectId.not0" class="error-message">※手当を申請する場合に必須の項目です</div>
            </b-col>
          </b-row>
        </b-container>
      </b-card>
      <b-card title="工番別稼働時間">
        <b-container v-if="form.report.isAttended()">
          <template v-if=" ! $v.form.report?.works.required">
            <div class="error-message">※最低でも1つの工番の入力が必要です</div>
          </template>
          <template v-for="(work, index) in $v.form.report?.works.$each.$iter">
            <template v-if="work != null && typeof index === 'string'">
              <b-row :key="`work-${index}`" align-v="center" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
                <b-col order="0" order-md="0" cols="6" md="3" class="text-md-right">
                  <label>工番{{parseInt(index)+1}}</label>
                </b-col>
                <b-col order="3" order-md="1" cols="12" md="4" class="pr-0">
                  <b-select v-model="work.projectId.$model" @blur.native="work.projectId.$touch()">
                    <b-select-option :value="null">-- 選択してください --</b-select-option>
                    <template v-for="project in projectOption">
                      <b-select-option :value="project.value">{{project.value }}: {{ project.text }}</b-select-option>
                    </template>
                  </b-select>
                  <div v-if=" ! work.projectId.$model" class="error-message">※必須項目です</div>
                </b-col>
                <b-col order="4" order-md="2" cols="12" md="3">
                  <b-timepicker minutes-step="15" dropup v-model="work.duration.$model" @blur.native.capture="work.duration.$touch()"></b-timepicker>
                  <div v-if="! work.duration.notSameAs0h" class="error-message">※必須項目です</div>
                </b-col>
                <b-col order="1" order-md="3" cols="2" md="1" offset="4" offset-md="0" class="text-md-right">
                  <div style="width: fit-content;" @click="deleteEntry(index)">
                    <b-icon-trash :scale="1.5"></b-icon-trash>
                  </div>
                </b-col>
              </b-row>
              <template v-if="$tstore.bundles.options.projectRequireWorkDetail.some(option => option.value == work.projectId.$model)">
                <b-row align-v="center" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
                  <b-col order="0" order-md="0" cols="6" md="3" class="text-md-right">
                    <template v-if="work.projectId.$model === 100">
                      <label>作業名</label>
                    </template>
                    <template v-if="work.projectId.$model === 500">
                      <label>案件名</label>
                    </template>
                  </b-col>
                  <b-col order="3" order-md="1" cols="12" md="8" class="pr-0">
          <!-- ATTENTION: Do not use work.detail.$model here, as it will stop being reactive. Seems to be a bug in vuelidate@0.7.7 -->
                    <b-input v-model="form.report.works[parseInt(index)].detail" @blur.native="work.detail.$touch()"></b-input>
                    <div v-if=" ! work.detail.required" class="error-message">※工番{{work.projectId.$model}}を選択した場合は入力必須の項目です</div>
                  </b-col>
                </b-row>
              </template>
              <hr :key="`hr-${index}`">
            </template>
          </template>
          <b-row>
            <b-col cols="auto" md="3" class="text-md-right pr-0 pr-md-3">
              <div>工番を追加</div>
            </b-col>
            <b-col cols="auto" md="9" class="pl-1 pl-md-3">
              <div style="width: fit-content;" @click="addNewEntry">
                <b-icon-plus-square :font-scale="1.5"></b-icon-plus-square>
              </div>
            </b-col>
          </b-row>
        </b-container>
        <div v-if=" ! form.report.isAttended()" class="warning-message">※出勤状況が「{{$optionValueTo("attendance", form.report.attendance, "text")}}」の場合は入力不要です。</div>
      </b-card>
    </div>
  </b-overlay>
  <div class="footer footer-sticky d-flex justify-content-end text-nowrap">
    <b-container class="text-center m-0" style="max-width: 400px;">
      <b-row v-if=" ! $v.form.report?.works.isDurationSumSameWithWorkHours" class="mb-1">
        <b-col>
          <div class="error-message font-weight-bold">※勤務時間と工番合計が一致していません</div>
        </b-col>
      </b-row>
      <b-row align-v="center" class="mt-0">
        <b-col cols="1" sm="1"></b-col>
        <b-col cols="2" sm="2">
          <b-row align-v="center">
            <b-col class="p-0">
              <div>勤務時間:</div>
            </b-col>
            <b-col class="p-0">
              <div class="font-weight-bold">{{ workHours }}</div>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="1" sm="1" class="p-0">
          <div>|</div>
        </b-col>
        <b-col cols="2" sm="2">
          <b-row class="text-center">
            <b-col class="p-0">
              <div>食事休憩:</div>
            </b-col>
            <b-col class="p-0">
              <div class="font-weight-bold" :style="form.report.attendance === 'half-paidoff' ? 'text-decoration: line-through;' : ''">{{ formattedBreakTime }}</div>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="1" sm="1" class="p-0">
          <div>|</div>
        </b-col>
        <b-col cols="2" sm="2">
          <b-row class="text-center" :style=" ! form.report.isAttended() ? 'color: #bbbbbb; text-decoration: line-through;' : ''">
            <b-col class="p-0">
              <div>工番合計:</div>
            </b-col>
            <b-col class="p-0">
              <div class="font-weight-bold" >{{ durationSum }}</div>
            </b-col>
          </b-row>
        </b-col>
        <b-col cols="2" sm="2" class="d-flex">
          <div class="align-self-center mr-2">
            <b-spinner v-if="controls.isRegistering" small variant="secondary"></b-spinner>
          </div>
          <b-button id="button-register" variant="primary" :size="$mq.match(/xs|sm/) ? 'sm' : 'md'" :disabled="$v.$invalid || controls.isRegistering" @click="register">{{ $route.params.mode === 'edit' ? '修正' : '登録' }} </b-button>
        </b-col>
      </b-row>
    </b-container>
  </div>
</div>
</template>

<style scoped>
.card-wrapper > *:not(:first-child) {
  margin-top: 20px;
}
.container > *:not(:first-child) {
  margin-top: 20px;
}
.footer {
  padding: 10px;
  width: 100%;
  font-size: 0.8em;
  color: darkslategray;
  background-color: var(--info);
  border-radius: 6px;
  border: 1px solid var(--secondary);
  /* box-shadow: 0px 0px 4px #aaaaaa; */
}
.footer-sticky {
  position: sticky;
  z-index: 1;
  bottom: 16px;
  right:0;
}
</style>

<script lang="ts">
import { BIconTrash, BIconPlusSquare } from "bootstrap-vue/esm/icons"
import { Duration } from "dayjs/plugin/duration";
import { to } from 'await-to-js'

import { Project } from "@/schema/Project";
import { Staff } from "@/schema/Staff";
import { Report, Work, reportValidator } from "@/schema/Report"
import { TransportationAllowanceValueLiterals } from "@/store/modules/bundle"
import cloneDeep from "lodash/cloneDeep";
import { extractInvalidProps } from "@/ts/utils"; // leave this for debugging
import { AxiosError } from "axios";

const consoleLogOnTest = (message: string) => {
  if(process.env.isTesting) {
    console.log("TEST DEBUG: " + message)
  }
}

export default {
  async created() {
    console.log("### report-input.vue created.")
    console.log(`### location.origin: ${location.origin}`);
    this.controls.history = this.$tstore.pages.reportHistory

    if(this.$route.query?.report != null && typeof this.$route.query.report === "string") {
      const decodedReport = decodeURI(this.$route.query.report)
      try {
        const report = new Report(JSON.parse(decodedReport))
        console.log(report.works);
        this.form.report = report
        console.log(`report.date: ${report.date}`);
      } catch(e) {
        this.$bvModal.msgBoxOk(this.newLiner(`エラー：元の日報データから、情報を復元できませんでした。`))
        if(e instanceof Error) {
          console.log(`e.message: ${e.message}`);
        }
      }
      const targetStaffId = this.form.report.staffId
      this.misc.staff = await this.$firebase.db.fetchStaffById(targetStaffId)
    } else {
      if( ! this.$tstore.auth.uid) {
        this.$bvModal.msgBoxOk(this.newLiner("エラー：原因不明のエラーが発生しました。"))
        throw Error("Error: 'this.$tstore.auth.uid' shouldn't be nullish here.")
      }
      const myStaffId = parseInt(this.$tstore.auth.uid)

      const [error1, staff] = await to<Staff, Error>(this.$firebase.db.fetchStaffById(myStaffId))
      if(error1) {
        this.$bvModal.msgBoxOk(this.newLiner("エラー：ユーザーが取得できませんでした。\n\n※何度か再読み込みしても復旧しない場合、お手数ですが時間を空けてから再度お試しください。"), {
          okTitle: "再読み込み",
        }).then(() => {
          window.location.reload()
        })
        throw Error(`Error: failed to fetch Staff from 'fetchStaffById' method. -> ${JSON.stringify(error1)}`)
      }

      this.misc.staff = staff
      this.form.report.name = staff.staffName
      this.form.report.staffId = staff.staffId
      this.form.report.startTime = staff.workStart
      this.form.report.endTime = staff.workEnd
      this.form.report.breakTime = typeof staff.breakTime === "number"
        ? this.$dayjs.duration(0).add(staff.breakTime, "hours").format("HH:mm:ss")
        : this.misc.staff.breakTime

      /** This query should come after fetchStaffById(),
       *  otherwise Auth header (idTokenResult) will not be ready to use
      **/
      this.$firebase.db.fetchSafeConfidential(myStaffId).then(safeConfidential => {
        this.misc.safeConfidential = safeConfidential
        console.log(`### safeConfidential fetched successfully.`);
        const allowance = safeConfidential.allowance
        const transportationCalcOption : TransportationAllowanceValueLiterals = allowance.transportation.calcOption
        if(transportationCalcOption === "per-day") {
          this.form.report.allowance.transportation = true
        }
      }).catch((error2: AxiosError) => {
        console.error(`Error: failed to fetch safeConfidential from 'fetchsafeConfidential' method. -> ${JSON.stringify(error2)}`)
      })
    }

    this.controls.isMyStaffDataFetched = true

    if(this.$tstore.pages.dbUser == null && this.$tstore.auth.uid != null) {
      this.$firebase.db.fetchStaffById(parseInt(this.$tstore.auth.uid)).then(staff => {
        this.$tstore.pages.setDbUser(staff)
      }).catch(e => {
        console.error(`Error: tried to re-fetch dbUser but failed on 'fetchStaffById' method. -> ${e}`);
      })
    }
  },
  components: {
    BIconTrash, BIconPlusSquare,
  },
  props: {
    projects: {
      default: [],
      type: Array<Project>,
      required: true,
    },
  },
  data() {
    return {
      controls: {
        isRegistering: false,
        isMyStaffDataFetched: false,
        selectedHistory: null,
        history: [] as Partial<Report>[],
      },
      form: {
        report: new Report()
      },
      misc: {
        staff: new Staff(),
        safeConfidential: {},
      }
    }
  },
  validations() {
    const validator = reportValidator(this.form.report)
    //@ts-expect-error
    validator.works.isDurationSumSameWithWorkHours = () => {
      return this.form.report.isAttended()
        ? this.durationSum  == this.workHours : true
    }
    return {
      form: {
        report: validator,
      },
    }
  },
  watch: {
    "controls.selectedHistory": {
      deep: true,
      immediate: true,
      async handler(val: Partial<Report>|"delete-history"|null) {
        if(val == null) {
          return
        }
        if(val === "delete-history") {
          this.controls.history = []
          this.controls.selectedHistory = null
          return
        }

        const isConfirmed = await this.debuggableMsgBoxConfirm("過去の日報を複製しますか？\n\n※現在の入力内容は破棄されます。", "fortestonly-msgbox-footer-before-copy")
        if( ! isConfirmed) {
          this.controls.selectedHistory = null
          return
        }

        const valClone = cloneDeep(val)
        this.form.report = new Report(valClone, valClone?.docId)

        this.debuggableMsgBoxOk("日報を複製しました。\n\n注意：内容の再確認を忘れずに！", "fortestonly-msgbox-footer-copy-completed")
      },
    },
    /** this is for debugging */
    // "$v.form.report": {
    //   deep: true,
    //   handler(val) {
    //     console.log(`$invalid: ${this.$v.$invalid}, isDurationSumSameWithWorkHours: ${this.$v.form.report.works.isDurationSumSameWithWorkHours}`);
    //     // console.log(JSON.stringify(extractInvalidProps(val), null, 2));
    //   }
    // }
  },
  computed: {
    projectOption() {
      return this.projects.map(project => ({
        value: project.projectId,
        text: project.projectTitle,
      }))
    },
    durationSum() {
      const resultDuration = this.form.report.works.reduce((prev, work) => {
        const array : string[] = work?.duration?.split(':') ?? ['0', '0', '0']
        return prev
        .add(parseInt(array[0]), 'hour')
        .add(parseInt(array[1]), 'minute')
        .add(parseInt(array[2]), 'second')
      }, this.$dayjs.duration(0))

      const hours = Math.floor(resultDuration.asHours())
      const minutes = (resultDuration.asHours() - hours) * 60
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    },
    workHours() {
      const report = this.form.report
      const startTime = this.getDayjsDuration(report.startTime)
      let endTime = this.getDayjsDuration(report.endTime)

      if(report.endTime < report.startTime) {
        endTime = endTime.add(24, "hours")
      }

      const breakTime = this.getDayjsDuration(this.form.report.breakTime)
      return endTime.subtract(startTime).subtract(breakTime).format("HH:mm")
    },
    formattedBreakTime() {
      return this.getDayjsDuration(this.form.report.breakTime).format("HH:mm")
    }
  },
  methods: {
    deleteEntry(index : string) {
      this.form.report.works = this.form.report.works.filter((work, i) => i !== parseInt(index))
    },
    addNewEntry() {
      this.form.report.works.push(new Work())
      this.$set(this.form, "works", this.form.report.works)
    },
    async register() {
      this.controls.isRegistering = true
      this.pushNewHistory(this.form.report)
      const refArray = await this.registerImpl().catch(e => {
        this.controls.isRegistering = false
        this.$bvModal.msgBoxOk(this.newLiner("エラー：日報の登録に失敗しました。\n\n※再度試しても失敗する場合は、管理者にお問い合わせください。"))
        throw e
      }).finally(() => {
        this.controls.isRegistering = false
      })
      return refArray
    },
    async registerImpl() {
      const newReport = this.form.report.toJSON()
      if( ! newReport?.date) {
        throw Error("Error: newReport.date is nullish.")
      } else if(newReport.date instanceof Date) {
        newReport.date = this.$dayjs(newReport.date).format("YYYY/MM/DD")
      }
      const duplicatedReport : Report[]
        = await this.$firebase.db.fetchReport(newReport.date, newReport.date, this.misc.staff.staffId, this.misc.staff.affiliation)
        ?? []

      if(duplicatedReport.length > 0) {
        if(this.$route.params.mode !== 'edit') {
          const isPassed = await this.debuggableMsgBoxConfirm("既に同じ日付の日報が登録されています。\n\n登録済みの日報を破棄して、現在の日報を登録しますか？", "fortestonly-msgbox-footer-duplicated")
          if( ! isPassed) {
            return
          }
        }

        duplicatedReport.forEach(async (report) => {
          const [error1] = await to<void, Error>(this.$firebase.db.deleteReport(report.docId, this.$tstore.pages.dbUser?.affiliation))
          if(error1) {
            this.$bvModal.msgBoxOk(this.newLiner("エラー：登録済み日報の削除に失敗しました。\n\n※現在の日報はまだ登録されていませんが、処理を中断します。"))
            console.log(`Error: on deleting report with Id: ${report.docId}`);
            throw error1
          }
          console.log(`Info: deleted report with Id: ${report.docId}`)
        })
      }

      let reporter = this.$tstore.auth.loginUser
      if( ! reporter) {
        throw Error("Error: 'this.$tstore.auth.loginUser' shouldn't be nullish.")
      }

      newReport.affiliation = this.$tstore.pages.dbUser?.affiliation ?? "in-source"
      newReport.reportedOn = new Date().toLocaleString()
      newReport.reportedBy = {
        id: reporter.uid,
        name: reporter.displayName ?? "(unknown)"
      }

      if( ! this.form.report.isAttended()){
        newReport.allowance!.transportation = false
      }

      const [error2, refArray] = await to(this.$firebase.db.registerNewReportList([newReport], newReport.affiliation))
      if(error2) {
        const message = duplicatedReport.length > 0
          ? "日報の上書きに失敗しました。"
          : "登録に失敗しました。"

        this.debuggableMsgBoxOk(`エラー：${message}\n\n※何度も失敗する場合は、管理者にお問い合わせください。`, "fortestonly-msgbox-footer-registration-failed")
        console.log(`Error: on registerNewReportList() -> ${JSON.stringify(error2)}`);
        throw error2
      }

      const message = duplicatedReport.length > 0
        ? "日報を上書き保存しました。"
        : "登録が完了しました。"

      this.debuggableMsgBoxOk(message, "fortestonly-msgbox-footer-registration-completed")
      return refArray
    },
    async pushNewHistory(newReport : Report) {
      const newReportLike = newReport.toJSON()
      const index = this.controls.history.findIndex(report => report.date === newReportLike.date)
      if(index >= 0) {
        this.controls.history.splice(index, 1)
      }
      this.controls.history.push(newReportLike)
      this.controls.history.sort((a, b) => {
        const format = {
          format: "YYYY/MM/DD"
        }
        return this.$dayjs(b.date, format).diff(this.$dayjs(a.date, format))
      })
      this.controls.history = this.controls.history.slice(0, 10)
      this.$tstore.pages.setReportHistory(this.controls.history)
    },
    debuggableMsgBoxConfirm(confirmationMessage: string, footerClass: string) {
      consoleLogOnTest(`msgBoxConfirm() shown: ${footerClass}`)
      return this.$bvModal.msgBoxConfirm(this.newLiner(confirmationMessage), {
        footerClass: process.env.isTesting ? footerClass : ""
      }).then((result: boolean) => {
        consoleLogOnTest(`msgBoxConfirm() closed: ${footerClass}: result -> "${result}"`)
        return result
      })
    },
    debuggableMsgBoxOk(message: string, footerClass: string) {
      consoleLogOnTest(`msgBoxOk() shown: ${footerClass}`)
      return this.$bvModal.msgBoxOk(this.newLiner(message), {
        footerClass: process.env.isTesting ? footerClass : ""
      }).then(() => consoleLogOnTest(`msgBoxOk() closed: ${footerClass}`))
    },
  }
}
</script>