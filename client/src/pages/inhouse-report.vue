<template>
  <b-nav class="main pt-2 py-md-4" :style="{height: innerHeight + 'px'}">
    <div v-if=" ! isRemoteDataReady" class="h-100 w-100 mt-5 text-center">
      <div style="color: gray;">データの取得中...</div>
      <b-spinner variant="primary" class="mt-3"></b-spinner>
    </div>
    <template v-else>
      <b-container class="form-container">
        <b-row class="justify-content-center">
          <b-col cols="12">
            <b-card bg-variant="light" class="mb-2">
              <b-card-title>
                <b-row align-h="between">
                  <b-col>
                    <div class="text-nowrap">作業日報{{mode === 'edit' ? '(修正モード)' : ''}}</div>
                  </b-col>
                  <b-col class="text-right">
                    <b-button v-if="mode !== 'edit'" size="sm" variant="outline-danger" @click="moveTo('/')">トップへ戻る</b-button>
                  </b-col>
                </b-row>
              </b-card-title>
              <div class="text-right" style="color: gray;">version: {{version}}</div>
              <div style="background: crimson; min-height: 5px;"></div>
            </b-card>
            <b-card class="mb-2">
              <b-card-group>
                <b-card bg-variant="light" title="作業日">
                  <b-card-body>
                    <b-form-datepicker hide-header reset-button label-reset-button="クリア" label-help="" locale="ja-JP" :placeholder="datepickerPlaceholder" :date-format-options="datepickerFormat" v-model="date"></b-form-datepicker>
                  </b-card-body>
                </b-card>
                <b-card bg-variant="light">
                  <b-card-title>氏名</b-card-title>
                  <b-card-body class="p-1">
                    <div style="color:red;">(※姓・名を両方入力)</div>
                    <b-input v-model="name"></b-input>
                  </b-card-body>
                </b-card>
              </b-card-group>
              <b-card bg-variant="light">
                <b-container fluid="md">
                  <b-row>
                    <b-col cols="auto" class="align-self-center p-0">
                      <label class="mb-0">出勤場所：</label>
                    </b-col>
                    <b-col md class="pl-0">
                      <b-select v-model="checkedInAt" :options="workplaces"></b-select>
                    </b-col>
                    <b-col cols="auto" class="align-self-center p-0">
                      <label class="mb-0">退勤場所：</label>
                    </b-col>
                    <b-col md class="pl-0">
                      <b-select v-model="checkedOutAt" :options="workplaces"></b-select>
                    </b-col>
                  </b-row>
                </b-container>
              </b-card>
              <b-card bg-variant="light" title="勤務時間">
                <b-container fluid="md">
                  <b-row class="align-items-center">
                    <b-col md="auto" class="p-0">
                      <b-form-radio-group size="sm" stacked @change="switchShiftPattern" :checked="shiftPattern" :options="Object.values(shiftPatterns)"></b-form-radio-group>
                    </b-col>
                    <b-col md>
                      <b-form-timepicker :hour12="false" minutes-step="15" no-close-button placeholder="選択して下さい" label-no-time-selected="" v-model="workStarted"></b-form-timepicker>
                    </b-col>
                    <b-col md="1" class="p-0">
                      <div class="text-center">～</div>
                    </b-col>
                    <b-col md>
                      <b-form-timepicker :hour12="false" minutes-step="15" no-close-button placeholder="選択して下さい" label-no-time-selected="" v-model="workEnded"></b-form-timepicker>
                    </b-col>
                  </b-row>
                  <b-row>
                    <b-col md>
                      <div>残業時間: {{overTime}}</div>
                    </b-col>
                  </b-row>
                </b-container>
              </b-card>
            </b-card>
            <template v-for="(work, workIndex) in works">
              <b-card class="mb-2" :key="`work-${workIndex}`">
                <b-card-title>
                  <div class="work-title">
                    <div>工事番号{{workIndex+1}}</div>
                    <b-button :disabled="workIndex === 0" size="sm" class="text-nowrap" @click="deleteWork(workIndex)">削除</b-button>
                  </div>
                </b-card-title>
                <b-card-group>
                  <b-card bg-variant="light" title="工事番号">
                    <b-card-body>
                      <b-select v-model="work.workId" @change.native="onSelectedWorkIdChanged(work, $event)">
                        <template v-for="group in workIdOptions">
                          <b-select-option-group :key="`work-group_${group.label}`" :label="group.label">
                            <template v-for="work in group.options">
                              <b-select-option :key="`work_${work.value}`" :value="work.value" :disabled="isDisabledWorkId(work.value)">{{ work.text }}</b-select-option>
                            </template>
                          </b-select-option-group>
                        </template>
                      </b-select>
                    </b-card-body>
                  </b-card>
                </b-card-group>
                <b-card-group>
                  <b-card bg-variant="light" class="mb-2" title="作業内容">
                    <b-card-body>
                      <b-container class="p-0" fluid>
                        <template v-for="(process, processIndex) in work.process">
                          <b-row :key="`process-${processIndex}`" class="p-0 m-0 border-info">
                            <b-col md>
                              <label v-if="$mq === 'md' || processIndex === 0" class="text-nowrap mt-2 mb-0">ユニット番号</label>
                              <b-select v-model="process.unitId">
                                <template v-if="work.workId !== undefined && work.workId !== null">
                                  <b-select-option key="unit-blank" value="">(なし)</b-select-option>
                                  <b-select-option v-for="unitId in unitIds(work.workId)" :key="`unit-${unitId}`" :value="unitId">{{unitId}}</b-select-option>
                                </template>
                              </b-select>
                            </b-col>
                            <b-col md>
                              <label v-if="$mq === 'md' || processIndex === 0" class="mt-2 mb-0">内容</label>
                              <b-select :options="processTypeOptions" v-model="process.processType"></b-select>
                              <b-input v-if="process.processType != null && process.processType.startsWith('misc')" v-model="process.miscDetail" placeholder="↳ 概要 ※必須" class="input-misc mt-1"></b-input>
                            </b-col>
                            <b-col md class="pr-1">
                              <label v-if="$mq === 'md' || processIndex === 0" class="mt-2 mb-0">材質</label>
                              <div class="material-container">
                                <b-select v-model="process.materialType">
                                  <b-select-option-group v-for="group in materialTypeOptions" :key="`material-group-${group.label}`" :label="group.label">
                                    <b-select-option v-for="option in group.options" :key="`material-${group.label}-${option.value}`" :value="option.value" :disabled="isDisabledMaterial(process.processType, option.value)">{{option.text}}</b-select-option>
                                  </b-select-option-group>
                                </b-select>
                                <b-icon-trash class="ml-1" @click="process.materialType = null"></b-icon-trash>
                              </div>
                            </b-col>
                            <b-col md>
                              <label v-if="$mq === 'md' || processIndex === 0" class="mt-2 mb-0">作業時間</label>
                              <b-form-timepicker :hour12="false" minutes-step="15" no-close-button placeholder="選択して下さい" label-no-time-selected="" v-model="process.duration" class="timepicker"></b-form-timepicker>
                            </b-col>
                            <b-col align-self="end" cols="auto" class="mt-3">
                              <b-form-checkbox switch size="sm" v-model="process.isOosCausedByUs" @change="changeOosState(process, 'isOosCausedByUs', $event)">自社責任の追加作業(ミスによる再製作等)</b-form-checkbox>
                              <b-form-checkbox switch size="sm" v-model="process.isOosCausedByClient" @change="changeOosState(process, 'isOosCausedByClient', $event)">客先責任の追加作業(図面の不整合等)</b-form-checkbox>
                            </b-col>
                            <b-col align-self="end" cols="auto">
                              <b-button size="sm" class="text-nowrap mt-2 mt-md-0 mb-1" @click="deleteProcess(workIndex, processIndex)">削除</b-button>
                            </b-col>
                          </b-row>
                          <hr :key="`hr-${processIndex}`">
                        </template>
                        <b-row>
                          <b-col>
                            <b-button-toolbar class="align-items-center mt-2">
                              <b-button size="sm" variant="outline-secondary" @click="addProcess(workIndex)">＋</b-button>
                              <label class="mb-0 mx-1">作業内容を追加</label>
                            </b-button-toolbar>
                          </b-col>
                        </b-row>
                      </b-container>
                    </b-card-body>
                  </b-card>
                </b-card-group>
              </b-card>
            </template>
            <b-button-toolbar class="align-items-center">
              <b-button variant="secondary" size="sm" @click="addWork">＋</b-button>
              <label class="mb-0 mx-1">別の工事番号を追加</label>
            </b-button-toolbar>
            <b-row class="my-3" align-v="center">
              <b-col align-self="center">
                <b-button-toolbar class="justify-content-start">
                  <b-button v-if="mode !== 'edit'" size="sm" variant="outline-danger" class="text-nowrap" style="font-size: 0.7em" @click="retrieveLastReport">最後に登録した日報を復元</b-button>
                </b-button-toolbar>
              </b-col>
              <b-col>
                <b-button-toolbar class="justify-content-end">
                  <b-spinner v-if="isRegistering" variant="danger" class="mr-4"></b-spinner>
                  <b-button variant="outline-secondary" size="sm" @click="register" :disabled="isRegistering">登録</b-button>
                </b-button-toolbar>
              </b-col>
            </b-row>
            <b-card v-if="cannotRegisterReport" bg-variant="danger" class="mt-2">
              <b-card-body>※保存ができない場合は、本社管理部までご連絡下さい。</b-card-body>
            </b-card>
          </b-col>
        </b-row>
      </b-container>
      <b-container class="footer">
        <b-row class="m-0 p-0">
          <b-col cols="2" class="p-0 text-center">
            <div class="checker">{{workingHours === durationSum ? '〇' : '△'}}</div>
          </b-col>
          <b-col cols="10" class="p-0 pr-4 text-right text-nowrap">
            <div>勤務時間(休憩除く) 計：{{workingHours}}<br>作業時間 計：{{durationSum}}</div>
          </b-col>
        </b-row>
      </b-container>
    </template>
  </b-nav>
</template>

<style scoped>
.main {
  min-width: 100%;
  min-height: 100%;
}
.form-container {
  max-width: 1200px;
}
.work-title {
  display: flex;
  justify-content: space-between;
}
option:disabled {
  color:#e0e0e0;
}
.timepicker > label {
  white-space: nowrap!important;
}
.input-misc::placeholder {
  font-size: 0.9rem;
}
.material-container {
  display: flex;
  align-items: center;
}
.footer {
  /* display: table-cell !important; */
  position: sticky;
  bottom: 0;
  margin: 0;
  max-width: 100%;
  flex-grow: 1;
  width: 100% !important;
  height: 40px !important;
  background:#99CCFF;
  color: darkslategray;
  font-size: 0.8em;
}
.checker {
  color: white;
  font-size: 2em;
}
@media screen and (max-width: 768px) {
  .main {
    display: flex;
  }
  .form-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  .card-body {
    padding: 10px !important;
  }
  .card-body > .card-body {
    padding: 0px !important;
  }
}
@media screen and (max-width: 576px) {
  .col-md {
    padding: 0;
  }
}
</style>

<script>
import {BIconTrash} from 'bootstrap-vue'
import isEqual from 'lodash/isEqual'
import Firebase from '@/firebase.js'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

export default {
  components: {
    BIconTrash,
  },
  async created() {
    await Firebase.fetchTypeOptions()
    .then(data => {
      // Get shiftPattern
      this.shiftPatterns = data.shiftPattern

      // Get filtered workplace
      this.workplaces = [...Object.values(data.workplace)].filter(wp => /factory|misc/g.test(wp.category))

      // Convert Object into Array, as firebase returns Object instead of Array
      let processGroupArray = []
      Object.values(data.process).forEach(group => {
        let processOptionsArray = []
        Object.values(group.options).forEach(option => {
          processOptionsArray.push(option)
        })
        group.options = processOptionsArray
        processGroupArray.push(group)
      })
      this.processTypeOptions = processGroupArray

      // Convert Object into Array, as firebase returns Object instead of Array
      let materialGroupArray = []
      Object.values(data.material).forEach(group => {
        let materialOptionsArray = []
        Object.values(group.options).forEach(option => {
          materialOptionsArray.push(option)
        })
        group.options = materialOptionsArray
        materialGroupArray.push(group)
      })
      this.materialTypeOptions = materialGroupArray

      this.orderStatusOptions = Object.values(data.orderStatus)
    }).catch(error => {
      console.log(error);
      this.$bvModal.msgBoxOk("その他選択肢の取得に失敗しました。\n画面を更新して、同じエラーが出る場合は、\n本社の管理部までご連絡下さい。", {centered: true})
      this.cannotRegisterReport = true
    })

    await Firebase.fetchWorkId(this.orderStatusOptions.filter(status => status.isActive).map(status => status.value))
    .then(data => {
      this.workIdList = data

      Object.keys(this.workIdList).forEach(workId => {
        const index = this.orderStatusOptions.find(orderStatus => orderStatus.value === this.workIdList[workId].status).targetReporter === "worker" ? 0 : 1
        const option = {
          value: workId,
          text: `${workId} / ${this.workIdList[workId].description}`,
          ...this.workIdList[workId]
        }
        this.workIdOptions[index]?.options.push(option)
      })
    }).catch(error => {
      console.log(error);
      this.$bvModal.msgBoxOk("工事番号/ユニット番号の取得に失敗しました。画面を更新して、同じエラーが出る場合は、本社の管理部までご連絡下さい。", {centered: true})
      this.cannotRegisterReport = true
    })

    this.isRemoteDataReady = true
    
    // Set version
    this.version = process.env.VERSION
    // Add resize watcher
    window.addEventListener('resize', this.resize)
    
    const queryParams = window.location.search
    if(queryParams === null || queryParams === undefined || queryParams === "") {
      // Fetch name from cache if available
      this.name = this.$store.getters.reporterName
      this.shiftPattern = this.$store.getters.shiftPattern ?? this.shiftPatterns.regular.value

      // Initialize data
      this.initializeWorkTime()

      // Add a blank work
      this.addWork()
    } else {
      this.mode = 'edit'
      const encodedObject = [...new URLSearchParams(queryParams).entries()].reduce((obj, e) => ({...obj, [e[0]]: e[1]}), {})
      const decodedObject = decodeURIComponent(atob(encodedObject.object))
      let givenData = null;
      [this.targetReportId, givenData] = Object.entries(JSON.parse(decodedObject))[0]
      console.log(`this.targetReportId: ${this.targetReportId}`);
      this.name = givenData.name
      this.date = dayjs(givenData.date, 'YYYY/MM/DD', true).toDate()
      this.workStarted = givenData.workStarted
      this.workEnded = givenData.workEnded
      this.shiftPattern = givenData?.shiftPattern ?? this.shiftPatterns.regular.value
      this.breakTimeDuration = this.shiftPatterns.regular.breakTimeDuration
      this.checkedInAt = givenData?.checkedInAt ?? null
      this.checkedOutAt = givenData?.checkedOutAt ?? null
      Object.keys(givenData.works).forEach(workId => {
        this.works.push({
          workId: workId,
          process: givenData.works[workId]
        })
      })
    }
  },
  data() {
    return {
      version: "0.0.0",
      mode: "new",
      shiftPatterns: {},
      defaultDurationValue: "00:00:00",
      innerHeight: window.innerHeight - 40,
      isRemoteDataReady: false,
      isRegistering: false,
      isFirstTimeToChangeOosState: true,
      cannotRegisterReport: false,
      datepickerPlaceholder: "",
      datepickerFormat: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      },
      date: new Date(),
      workplaces: [],
      workStarted: null,
      workEnded: null,
      breakTimeDuration: null,
      shiftPattern: 'regular',
      checkedInAt: null,
      checkedOutAt: null,
      newReport: {},
      targetReportId: null,
      name: "",
      approvedBy: "", // this value won't be updated in this window but necessary
      works: [],
      workIdList: {},
      workIdOptions: [
        {
          targetReporter: "worker",
          label: "工場製作中",
          options: [],
        },
        {
          targetReporter: "admin",
          label: "工場製作前/後",
          options: [],
        },
      ],
      processTypeOptions: [],
      materialTypeOptions: [],
      orderStatusOptions: [],
    }
  },
  computed: {
    overTime() {
      const dateNow = new Date().toDateString()
      const workStartedDate = new Date(`${dateNow} ${this.workStarted}`)
      const workEndedDate = new Date(`${dateNow} ${this.workEnded}`)
      const shiftPattern = this.findShiftPattern()
      const defaultStart = new Date(`${dateNow} ${shiftPattern?.start}`)
      const defaultEnd = new Date(`${dateNow} ${shiftPattern?.end}`)

      const durationResult = workEndedDate - workStartedDate
      const durationDefault = defaultEnd - defaultStart

      // Get the difference between durations in UTC+0, otherwise you get UTC+9:00 hours
      const difference = new Date(durationResult - durationDefault)
      if(difference.valueOf() <= 0)
        return "00:00"
      let overTimeArray = difference.toUTCString().split(" ")[4].split(":")
      overTimeArray.pop()
      return overTimeArray.join(":")
    },
    workingHours() {
      const workStartArray = this.workStarted.split(':')
      const workEndArray = this.workEnded.split(':')
      const breakTimeDurationArray = this.breakTimeDuration.split(':')
      // Adding end time and then subtracting start time makes duration
      const workingHours = dayjs.duration(0)
                                .add(workEndArray[0], "h")
                                .add(workEndArray[1], "m")
                                .subtract(workStartArray[0], "h")
                                .subtract(workStartArray[1], "m")
                                .subtract(breakTimeDurationArray[0], "h")  // Subtracting Break time
                                .subtract(breakTimeDurationArray[1], "m") // Subtracting Break time
      return workingHours.format("HH:mm")
    },
    durationOption() {
      const option = []
      for(var i = 0; i < 24; ++i) {
        option.push(`${i}:00`)
        option.push(`${i}:15`)
        option.push(`${i}:30`)
        option.push(`${i}:45`)
      }
      return option
    },
    durationSum() {
      let durationSum = dayjs.duration(0)
      this.works.forEach(work => {
        work.process.forEach(process => {
          const durationArray = process.duration.split(':')
          durationSum = durationSum.add(durationArray[0], 'h')
                                   .add(durationArray[1], 'm')
                                   .add(durationArray[2], 's')
        })
      })

      return durationSum.format('HH:mm')
    },
    isDisabledWorkId() {
      return function(workId) {
        let shouldBeDisabled = false
        this.works.some(work => {
          if(work.workId === workId) {
            shouldBeDisabled = true
            return true
          }
        })
        return shouldBeDisabled
      }
    },
    isDisabledMaterial() {
      return function(processTypeSelected, materialType) {
        var regExp = null
        Object.values(this.processTypeOptions).some(value => {
          Object.values(value.options).some(option => {
            if(option.value === processTypeSelected) {
              regExp = option.regExp
              // Exit the inner "some" loop.
              return true
            }
          })
          // Exit the outer "some" loop.
          if( ! regExp)
            return true
        })
        // if regExp is not given, that means all the materialType should be disabled
        if( ! regExp)
          return true
        // regExp value is used to determine which materialType should be enabled
        return ! new RegExp(regExp).test(materialType)
      }
    },
    unitIds() {
      return function(selectedWorkId){
        let unitIds = []
        Object.entries(this.workIdList).some(([workId, work]) => {
          if(workId === selectedWorkId) {
            unitIds = work.unitIds
            return true
          }
        })
        return unitIds
      }
    }
  },
  methods: {
    resize() {
      this.innerHeight = window.innerHeight - 40
      console.log(`innerHeight: ${this.innerHeight}`)
    },
    createWork() {
      // The structure of "work" should be transformed before registration
      const process = this.createProcess()
      return {
        workId: null,
        process:[
          process
        ]
      }
    },
    addWork() {
      const newWork = this.createWork()
      this.$set(this.works, Object.keys(this.works).length, newWork)
    },
    deleteWork(index) {
      const work = this.works[index]
      var hasProcessInputted = false
      work.process.some(process => {
        const blankProcess = this.createProcess()
        if( ! isEqual(blankProcess, process)) {
          hasProcessInputted = true
          return true
        }
      })
      // Ask if we can go ahead with deletion
      if(hasProcessInputted && ! confirm("入力済みの\"作業内容\"がありますが、削除してもよろしいですか？"))
        return

      this.$delete(this.works, index)
    },
    createProcess() {
      return {
        unitId: "", // instead of null, assign "" to keep "unitId" key in rtdb
        processType: null,
        materialType: null,
        duration: this.defaultDurationValue,
        isOosCausedByUs: false,
        isOosCausedByClient: false,
        miscDetail: null // Should not be stored if processType !== 'misc'
      }
    },
    addProcess(workIndex) {
      const process = this.createProcess()
      this.$set(this.works[workIndex].process, this.works[workIndex].process.length, process)
    },
    deleteProcess(workIndex, processIndex) {
      this.$delete(this.works[workIndex].process, processIndex)
    },
    moveTo(destination) {
      var isInputting = false
      this.works.some(work => {
        const blankWork = this.createWork()
        if( ! isEqual(work, blankWork)) {
          isInputting = true
          return true
        }
      })
      if( ! isInputting || confirm("入力中のデータがあります。\nトップへ戻りますか？"))
        this.$router.push(destination)
    },
    async register(){
      this.isRegistering = true
      
      this.newReport = {
        name: this.name,
        date: dayjs(this.date).format('YYYY/MM/DD'),
        workStarted: this.workStarted,
        workEnded: this.workEnded,
        shiftPattern: this.shiftPattern,
        checkedInAt: this.checkedInAt,
        checkedOutAt: this.checkedOutAt,
        approvedBy: this.approvedBy,
        works: {} // To be filled later
      }

      if(this.isInputValid()) {
        await this.registerAsync()
      }

      this.isRegistering = false
    },
    isInputValid() {
      // Validate this.newReport
      if(this.newReport.name === ""
          || this.newReport.date === null
          || this.newReport.workStarted === ""
          || this.newReport.workEnded === null) {
        this.$bvModal.msgBoxOk("エラー：作業日/氏名/勤務時間のいずれかが未入力です。", {centered: true})
        return false
      } else if(this.newReport.name.length <= 2) {
        this.$bvModal.msgBoxOk("エラー：「氏名」には姓・名をどちらも入力して下さい。(※姓+名で2文字の方は、間にスペースを入れてください)", {centered: true})
        return false
      } else if(this.newReport.checkedInAt == null || this.newReport.checkedOutAt == null) {
        this.$bvModal.msgBoxOk("エラー：「出退勤場所」が選択されていません。", {centered: true})
        return false
      }

      // Validate works and transform data structure of process
      let isValid = true
      this.works.some(work => {
        if(work.workId === null || work.workId === "") {
          this.$bvModal.msgBoxOk('エラー：未入力の"工事番号/ユニット番号"があります。', {centered: true})
          isValid = false
          return true
        }

        work.process.some(process => {
          if(process.processType === null || process.duration === this.defaultDurationValue) {
            this.$bvModal.msgBoxOk('エラー："作業内容"の中に未入力の項目があります。', {centered: true})
            isValid = false
            return true
          }

          if(process.processType !== 'misc') {
            this.$delete(process, 'miscDetail')
          } else if(process.miscDetail == null || process.miscDetail === "") {
            this.$bvModal.msgBoxOk("エラー：'その他'を選択した場合は'概要'を必ず入力して下さい。", {centered: true})
            isValid = false
            return true
          }

          // process.materialType's validation is dependent on processType selected
          this.processTypeOptions.some(group => {
            group.options.some(option => {
              // ignore unmatched processType
              if(option.value !== process.processType)
                return false

              // if option doesn't have "regExp" property, then ignore
              if(option.regExp === undefined || option.regExp === null)
                return false

              // if regExp property exists and materialType is empty,
              // that should be invalid
              if (process.materialType === null || process.materialType === "") {
                this.$bvModal.msgBoxOk('エラー："作業内容"の中に未入力の項目があります。', {centered: true})
                isValid = false
                return true
              }
            })
            if( ! isValid )
              return true
          })
        })
      })

      if( ! isValid) {
        return false
      }

      // Below we compare two durations both in String,
      // but this should work as long as it has same format of "HH:mm"
      if(this.durationSum !== this.workingHours) {
        if( ! confirm("\"作業時間\"の合計が、勤務時間(休憩時間を除く)と一致していません。\nこのままデータを登録しますか？"))
          return false
      }

      return true
    },
    async registerAsync() {
      this.works.some(work => {
        // transform the structure of "works" object
        const transformedWork = {}
        transformedWork[work.workId] = work.process
        Object.assign(this.newReport.works, transformedWork)
      })

      let oldReportId = null
      let shouldReturn = false
      await Firebase.fetchAllReportOn(this.newReport.date)
              .then(data => {
                if(data == null || data === {})
                  return
                const reportToBeCompared = data
                Object.keys(reportToBeCompared).some(reportId => {
                  const report = reportToBeCompared[reportId]
                  if(report.name.split(/ |　/).join('') !== this.newReport.name.split(/ |　/).join(''))
                    return false

                  if(confirm("既に同じ日の作業日報を入力済みです。\n新しいデータで上書き保存しますか？"))
                    oldReportId = reportId
                  else {
                    this.$bvModal.msgBoxOk("入力を中止しました。", {centered: true})
                    shouldReturn = true
                  }
                  return true
                })
              })

      if(shouldReturn) {return}

      this.$store.commit('lastReport', this.newReport)
      if(this.targetReportId) {
        await Firebase.deleteInhouseReport(this.targetReportId)
        .then(async responseOnDeletion => {
          await Firebase.registerInhouseReport(this.newReport)
          .then(responseOnRegistration => {
            this.$bvModal.msgBoxOk(`古い日報の削除と、新しいデータの登録が完了しました。`, {centered: true});
          })
          .catch(reason => {
            console.log(`Error: ${JSON.stringify(reason)}`)
            const type = this.targetReportId === null ? "登録" : "上書き"
            this.$bvModal.msgBoxOk(`エラー：作業日報の${type}に失敗しました。${JSON.stringify(reason)}`, {centered: true})
          })
        })
        .catch(reason => {
          console.log(`Error: ${JSON.stringify(reason)}`);
          this.$bvModal.msgBoxOk(`エラー：作業日報の削除に失敗しました。。${JSON.stringify(reason)}`, {centered: true})
        })
      } else {
        await Firebase.registerInhouseReport(this.newReport)
        .then(response => {
          if(oldReportId === null) {
            this.$bvModal.msgBoxOk(`作業日報の登録が完了しました。`, {centered: true})
          }
        }, reason => {
          console.log(`Error: ${JSON.stringify(reason)}`)
          const type = oldReportId === null ? "登録" : "上書き"
          this.$bvModal.msgBoxOk(`エラー：作業日報の${type}に失敗しました。${JSON.stringify(reason)}`, {centered: true})
        })

        if(oldReportId !== null) {
          await Firebase.deleteInhouseReport(oldReportId)
          .then(response => {
            this.$bvModal.msgBoxOk(`古い日報の削除と、新しいデータの登録が完了しました。`, {centered: true});
          }, reason => {
            console.log(`Error: ${JSON.stringify(reason)}`);
            this.$bvModal.msgBoxOk(`エラー：作業日報の削除に失敗しました。。${JSON.stringify(reason)}`, {centered: true})
          })
        }
      }
    },
    /** Getting old value from "work" object and new value from "event" */
    onSelectedWorkIdChanged(work, event) {
      // Find any of unitId which is not empty, and if found, blank it.
      let hasNonEmptyUnitId = false
      work.process.some(process => {
        if(process.unitId !== "") {
          process.unitId = ""
          hasNonEmptyUnitId = true
          return true
        }
      })

      if(hasNonEmptyUnitId)
        this.$bvModal.msgBoxOk("警告：工事番号を変更したため、入力済みのユニット番号が全て「(なし)」に変更されました。必要であれば、再入力してください。", {centered: true})
    },
    retrieveLastReport() {
      const lastReport = this.$store.getters.lastReport
      if(lastReport == null || lastReport === {})
        return this.$bvModal.msgBoxOk(`この端末に保存されたデータが見つかりませんでした。最初から入力し直すか、入力した端末で再度お試しください。`, {centered: true})
      if( ! confirm(`今あるデータは全て削除されます。\nよろしいですか？`))
        return
      this.name = lastReport.name
      this.date = dayjs(lastReport.date).toDate()
      this.workStarted = lastReport.workStarted
      this.workEnded = lastReport.workEnded
      this.shiftPattern = lastReport?.shiftPattern ?? this.shiftPatterns.regular.value
      this.checkedInAt = lastReport?.checkedInAt ?? null
      this.checkedOutAt = lastReport?.checkedOutAt ?? null
      this.$set(this, "works", [])
      Object.keys(lastReport.works).forEach(workId => {
        this.$set(this.works, this.works.length, {
          workId,
          process: lastReport.works[workId]
        })
      })
      this.$bvModal.msgBoxOk(`最後に保存した内容を取得しました。`, {centered: true})
    },
    switchShiftPattern(shiftPattern) {
      this.shiftPattern = shiftPattern
      this.initializeWorkTime()
      this.$bvModal.msgBoxOk("サマータイムの切替により、勤務開始/終了時間を自動的に変更しました。必要であれば時間を再度指定して下さい。", {
        title: "情報",
        centered: true,
      })
    },
    initializeWorkTime() {
      // Summertime adjustment
      const option = this.findShiftPattern()
      this.workStarted = option.start
      this.workEnded = option.end
      this.breakTimeDuration = option.breakTimeDuration
    },
    findShiftPattern() {
      return Object.values(this.shiftPatterns).find(val => val.value === this.shiftPattern)
    },
    changeOosState(process, type, newValue) {
      if(this.isFirstTimeToChangeOosState) {
        this.$bvModal.msgBoxOk("「追加作業」の申告は慎重に行って下さい。※追加作業にあたるかどうか不明な場合は、各工場の管理者へお尋ね下さい。")
        this.isFirstTimeToChangeOosState = false
      }

      process[type] = newValue
      const otherType = ['isOosCausedByUs', 'isOosCausedByClient'].find(t => t !== type)
      if(process[otherType] === true && newValue === true) {
        process[otherType] = false
      }
    }
  }
}
</script>