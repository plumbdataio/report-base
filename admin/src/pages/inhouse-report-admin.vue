<template>
  <b-container class="p-0">
    <HeaderRow>作業日報(工場) - 検索</HeaderRow>
    <InhouseReportSummary class="m-3"></InhouseReportSummary>
    <b-card body-class="m-2 p-0" class="m-3">
      <b-row align-v="start">
        <b-col md class="pr-md-2 my-1" :class="{'mt-2': $mq !== 'md'}">
          <b-checkbox v-model="displayUnapprovedOnly">未承認のみ表示</b-checkbox>
        </b-col>
        <b-col md class="px-md-2 my-1">
          <DatePicker
            class="pseudo-datepicker"
            v-model="searchDateStart"
            value-as-date
            placeholder="From"
            :disabled="displayUnapprovedOnly || (searchName !== null && searchName !== '')"
            @context="onSearchDateChanged('start', $event)"
          ></DatePicker>
        </b-col>
        <b-col md class="px-md-2 my-1">
          <DatePicker
            class="pseudo-datepicker"
            v-model="searchDateEnd"
            value-as-date
            placeholder="To"
            :disabled="displayUnapprovedOnly || (searchName !== null && searchName !== '')"
            @context="onSearchDateChanged('end', $event)"
            ></DatePicker>
            <div class="tips">※最大1カ月まで</div>
        </b-col>
        <b-col md class="px-md-2 my-1">
          <b-form-group class="mb-0">
            <b-input size="sm" placeholder="氏名" :disabled="displayUnapprovedOnly || searchDateStart !== null" v-model="searchName"></b-input>
          </b-form-group>
        </b-col>
        <b-col md='auto' class="pl-md-2 my-1" :class="{'mt-2': $mq !== 'md'}">
          <b-button size="sm" @click="search">検索</b-button>
        </b-col>
      </b-row>
    </b-card>
    <b-row>
      <b-col>
        <b-table-simple sticky-header stacked="md" hover bordered>
          <b-thead v-once head-variant="dark" class="text-center">
            <b-tr>
              <b-th class="py-1"></b-th>
              <b-th class="py-1">作業日</b-th>
              <b-th class="py-1">氏名</b-th>
              <b-th class="py-1">始業</b-th>
              <b-th class="py-1">終業</b-th>
              <b-th class="py-1">残業</b-th>
              <b-th class="py-1">作業時間<br>合計</b-th>
              <b-th class="py-1">シフト</b-th>
              <b-th class="py-1">出勤</b-th>
              <b-th class="py-1">退勤</b-th>
              <b-th class="py-1">承認</b-th>
              <b-th class="py-1">編集</b-th>
            </b-tr>
          </b-thead>
          <b-tbody v-if=" ! isReportFetched || ! isSupplementalDataFetched">
            <b-tr>
              <b-td colspan="12" class="text-center">
                <b-spinner variant="info"></b-spinner>
              </b-td>
            </b-tr>
          </b-tbody>
          <b-tbody v-if="isResultEmpty">
            <b-tr>
              <b-td colspan="12" class="text-center">
                <div>対象のレポートが存在しません。<br>検索条件を変えて、検索し直して下さい。</div>
              </b-td>
            </b-tr>
          </b-tbody>
          <b-tbody v-if="isReportFetched && isSupplementalDataFetched" class="text-center">
            <template v-for="(report, reportId) in reports">
              <b-tr :key="`row1-${reportId}`">
                <b-td>
                  <b-button variant="outline-secondary" :class="{'button-collapsed': report.isCollapsed, 'button-uncollapsed': ! report.isCollapsed}" size="sm" @click="report.isCollapsed = ! report.isCollapsed"></b-button>
                </b-td>
                <b-td stacked-heading="作業日">{{report.date}}</b-td>
                <b-td stacked-heading="氏名" :id="reportId">{{report.name}}</b-td>
                <b-tooltip :target="reportId" :title="reportId" :delay="1000" variant="primary"></b-tooltip>
                <b-td stacked-heading="始業" :class="{highlight:  report.workStarted > getShiftPatternValue(report.shiftPattern).start}">{{hmsToHm(report.workStarted)}}</b-td>
                <b-td stacked-heading="終業" :class="{highlight: report.workEnded < getShiftPatternValue(report.shiftPattern).end}">{{hmsToHm(report.workEnded)}}</b-td>
                <b-td stacked-heading="残業" :class="{highlight: report.overTime !== '-'}">{{report.overTime}}</b-td>
                <b-td stacked-heading="作業時間合計" :class="{highlight: report.processTimeSum !== report.workTime}">{{report.processTimeSum}}</b-td>
                <b-td stacked-heading="シフト" class="pr-1 text-left shift-pattern">
                  <b-form-radio-group :checked="report.shiftPattern != null ? report.shiftPattern : 'regular'" style="pointer-events: none;" :options="Object.values(shiftPatterns)"></b-form-radio-group>
                </b-td>
                <b-td stacked-heading="出勤">{{checkedInOutPlaceTranslator(report.checkedInAt)}}</b-td>
                <b-td stacked-heading="退勤">{{checkedInOutPlaceTranslator(report.checkedOutAt)}}</b-td>
                <b-td>
                  <div v-if="report.approvedBy && report.approvedBy !== ''">{{report.approvedBy}}</div>
                  <b-button v-else variant="danger" size="sm" @click="approve(reportId, report)">要承認</b-button>
                </b-td>
                <b-td>
                  <b-button-group>
                    <b-button size="sm" variant="primary" class="text-nowrap" @click="openEditor(reportId, report)">編集</b-button>
                    <b-button size="sm" variant="outline-secondary" class="text-nowrap" @click="deleteReport(reportId)">削除</b-button>
                  </b-button-group>
                </b-td>
              </b-tr>
              <b-collapse tag="b-tr" :key="`row2-${reportId}`" class="inner-table-container" :visible="report.isCollapsed">
                <b-td colspan="12" class="inner-td" v-if="report.isCollapsed">
                  <b-tr>
                    <b-th>工事番号</b-th>
                    <b-th>ユニット番号</b-th>
                    <b-th>作業内容</b-th>
                    <b-th>材質</b-th>
                    <b-th>作業時間</b-th>
                    <b-th>追加作業？</b-th>
                  </b-tr>
                  <template v-for="(work, workId) in report.works">
                    <b-tr v-for="(process, processIndex) in work" :key="`work-${workId}-${processIndex}`" class="bg-white">
                      <b-td style="white-space: pre-line;">{{workIds[workId].description ? `${workId}\n(${workIds[workId].description})` : workId}}</b-td>
                      <b-td>{{process.unitId === "" ? "-" : process.unitId}}</b-td>
                      <b-td>{{xxxTypeToJapanese(process.processType, "process") + (process.miscDetail !== undefined ? `: ${process.miscDetail}`: '')}}</b-td>
                      <b-td>{{xxxTypeToJapanese(process.materialType, "material")}}</b-td>
                      <b-td>{{hmsToHm(process.duration)}}</b-td>
                      <b-td :class="{ highlight: (process.isOosCausedByUs != null && process.isOosCausedByUs) || (process.isOosCausedByClient != null && process.isOosCausedByClient) }" v-html="process.isOosCausedByUs != null && process.isOosCausedByUs ? 'Yes<br>(自社責任)' : process.isOosCausedByClient != null && process.isOosCausedByClient ? 'Yes<br>(客先責任)' : 'No'"></b-td>
                    </b-tr>
                  </template>
                </b-td>
              </b-collapse>
            </template>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
.tips {
  font-size: 0.8em;
}
.highlight {
  background:greenyellow;
}
.button-collapsed:after {
  content: '>';
  display: inline-block;
  transform: rotate(-90deg);
}
.button-uncollapsed:after {
  content: '>';
  display: inline-block;
  transform: rotate(90deg);
}
.pseudo-datepicker label {
  white-space: nowrap;
}
.inner-table-container {
  background: #F5F5F5;
}
.shift-pattern {
  max-width: 200px;
  font-size: 0.6em;
}
.shift-pattern >>> span {
  vertical-align: sub;
}
@media screen and (max-width: 768px) {
  .shift-pattern {
    max-width: 100%;
  }
}
/* This is to disable ugly animations of b-collapse in b-table... */
.collapsing {
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -o-transition: none !important;
  transition: none !important;
}
</style>

<script>
import DatePicker from '@/components/date-picker.vue'
import InhouseReportSummary from '@/components/inhouse-report-summary.vue'

export default {
  async beforeMount() {   
    await this.$firebase.db.fetchTypeOptions()
    .then(value => {
      // Assign shiftPatterns
      this.shiftPatterns = value.shiftPattern

      // Add customized workplace
      this.workplaces = value.workplace
      this.workplaces.push({value: undefined, text: "-"})
      this.workplaces.push({value: null, text: "-"})

      // Extract processType
      value.process.forEach(item => {
        item.options.forEach(option => {
          this.processTypeOptions.push(option)
        })
      })
      // Extract materialType
      value.material.forEach(item => {
        item.options.forEach(option => {
          option.text = `${item.label}/${option.text}`
          this.materialTypeOptions.push(option)
        })
      })
    })

    await this.$firebase.db.fetchWorkId()
    .then(result => {
      this.workIds = result
    })

    this.search()

    this.isSupplementalDataFetched = true
  },
  components: {
    DatePicker, InhouseReportSummary, 
  },
  data() {
    return {
      isReportFetched: false,
      isSupplementalDataFetched: false,
      isResultEmpty: false,
      displayUnapprovedOnly: true,
      searchDateStart: null,
      searchDateEnd: null,
      searchName: null,
      workIds: {},
      reports: {},
      shiftPatterns: {},
      workplaces: [],
      processTypeOptions: [],
      materialTypeOptions: [],
    }
  },
  methods: {
    checkedInOutPlaceTranslator(origStr) {
      return this.workplaces.find(wp => wp.value === origStr)?.text ?? origStr
    },
    workTime(startedTime, endedTime, breakTimeDuration) {
      const startedTimeArray = startedTime.split(":")
      const endedTimeArray = endedTime.split(":")
      const breakTimeDurationArray = breakTimeDuration.split(":")
      return this.$dayjs.duration(0)
           .add(endedTimeArray[0], 'h')
           .add(endedTimeArray[1], 'm')
           .subtract(startedTimeArray[0], 'h')
           .subtract(startedTimeArray[1], 'm')
           .subtract(breakTimeDurationArray[0], 'h')
           .subtract(breakTimeDurationArray[1], 'm')
           .format('HH:mm')
    },
    overTime(workTime) {
      const workTimeArray = workTime.split(":")
      const overTime = this.$dayjs.duration(0)
           .add(workTimeArray[0], 'h')
           .add(workTimeArray[1], 'm')
           .subtract(7, 'h')
           .format('HH:mm')
      if(overTime === "00:00" || overTime.startsWith('-'))
        return '-'
      else
        return overTime
    },
    processTimeSum(works) {
      let durationSum = this.$dayjs.duration(0)
      Object.values(works).forEach(processes => {
        processes.forEach(process => {
          let durationArray = process.duration.split(":")
          durationSum = durationSum.add(durationArray[0], 'h')
                                   .add(durationArray[1], 'm')
        })
      })
      return durationSum.format('HH:mm')
    },
    hmsToHm(hmt) {
      return hmt.split(':').slice(0,2).join(':')
    },
    xxxTypeToJapanese(xxxType, xxx) {
      if(xxxType === "")
        return "-"

      let japanese = xxxType
      const options = xxx === "material"
                ? this.materialTypeOptions
                : (xxx === "process" ? this.processTypeOptions : [])
      options.some(option => {
        if(option.value === xxxType) {
          japanese = option.text
          return true
        }
      })
      return japanese 
    },
    async approve(reportId, report) {
      // Check if the target report is still there
      const newlyFetchedReport = await this.$firebase.db.fetchInhouseReportWithReportId(reportId)
      if(newlyFetchedReport == null) {
        await this.$bvModal.msgBoxOk('承認対象の日報は、他の誰かによって削除されたようです。最新の日報を再取得します。', {title: "エラー"})
        this.search()
        return
      }

      const isEqualDeep = function(a, b) {
        console.log(`a: ${JSON.stringify(a)}`);
        console.log(`b: ${JSON.stringify(b)}`);
        if(Array.isArray(a) && Array.isArray(b)) {
          return a.some((val, index) => {
            return isEqualDeep(a[index], b[index])
          })
        } else if(a instanceof Object && b instanceof Object) {
          return Object.keys(a).some(key => {
            return isEqualDeep(a[key], b[key])
          })
        } else {
          return a === b
        }
      }
      const isReportModified = Object.keys(newlyFetchedReport)
      .filter(key => ! /^checked/.test(key))
      .some(key => {
        console.log(! isEqualDeep(newlyFetchedReport[key], report[key]));
        return ! isEqualDeep(newlyFetchedReport[key], report[key])
      })
      if(isReportModified) {
        await this.$bvModal.msgBoxOk('承認対象の日報が、他の誰かによって更新されました。改めて内容を確認して下さい。', {title: "エラー"})
        this.search()
        return
      }

      report.isCollapsed = true // collapse report to make sure approver see details
      if( ! confirm(`${report.name}さんの作業日報を承認します。\nよろしいですか？`))
        return
      let approverName
      await this.$firebase.db.fetchMyData(this.$store.getters.loginUser.uid)
      .then(data => {
        approverName = data.staffName
        console.log(`approverName: ${approverName}`);
      })
      await this.$firebase.db.approveInhouseReport(reportId, approverName)
                    .then(result => {
                      report.approvedBy = approverName
                      alert(`承認されました。`)
                    })
    },
    onSearchDateChanged(startOrEnd, event) {
      if(this.searchDateStart == null && this.searchDateEnd == null) {
        return // Do nothing
      } else if(startOrEnd === 'start' && this.searchDateStart == null) {
        return 
      } else if(startOrEnd === 'end' && this.searchDateEnd == null) {
        return 
      } else if(this.searchDateStart == null && this.searchDateEnd != null) {
        this.searchDateStart = this.$dayjs(this.searchDateEnd)
                                    .subtract(1, 'month')
                                    .add(1, 'day')
                                    .toDate()
      } else if(this.searchDateEnd == null && this.searchDateStart != null) {
        this.searchDateEnd = this.$dayjs(this.searchDateStart)
                                    .add(1, 'month')
                                    .subtract(1, 'day')
                                    .toDate()
      } else if(startOrEnd === 'start') {
        const refDate = this.$dayjs(this.searchDateStart)
                                    .add(1, 'month')
                                    .subtract(1, 'day')
                                    .toDate()
        if(refDate < this.searchDateEnd)
          this.searchDateEnd = refDate
      } else if(startOrEnd === 'end') {
        const refDate = this.$dayjs(this.searchDateEnd)
                                    .subtract(1, 'month')
                                    .add(1, 'day')
                                    .toDate()
        if(refDate > this.searchDateStart)
          this.searchDateStart = refDate
      }
    },
    search() {
      // Validation
      if( ! this.displayUnapprovedOnly) {
        if(this.searchDateStart === null
          && this.searchDateEnd === null
          && (this.searchName == null || this.searchName == "")) {
          alert('日付/名前の両方の指定なしでは検索できません。\n※全ての日報を取得することになるため')
          return
        }
      }

      let searchDateStartFormatted = this.searchDateStart === null
                                  ? null
                                  : this.$dayjs(this.searchDateStart).format('YYYY/MM/DD')
      let searchDateEndFormatted = this.searchDateEnd === null
                                  ? null
                                  : this.$dayjs(this.searchDateEnd).format('YYYY/MM/DD')
      this.isReportFetched = false
      this.reports = {}
      this.$firebase.db.fetchInhouseReport(this.displayUnapprovedOnly,
                                  searchDateStartFormatted,
                                  searchDateEndFormatted,
                                  this.searchName)
      .then(value => {
        if(value === null) {
          this.isResultEmpty = true
          this.isReportFetched = true
          return
        } else
          this.isResultEmpty = false

        // Sort the reports in order of date
        const kayValuePairs = Object.entries(value)
        kayValuePairs.sort((pair1, pair2) => {
          return pair1[1].date < pair2[1].date
                ? -1
                : pair1[1].date > pair2[1].date
                ? 1
                : 0 // pair1[1].date = pair2[1].date
        })
        
        const sortedResult = Object.fromEntries(kayValuePairs)

        // Add 'isCollapsed' property
        Object.keys(sortedResult).forEach(key => sortedResult[key].isCollapsed = false)

        // Add calculated property
        this.reports = sortedResult
        Object.entries(this.reports).forEach(([reportId, report]) => {
          const breakTimeDuration = this.getShiftPatternValue(report?.shiftPattern)?.breakTimeDuration
          report.workTime = this.workTime(report.workStarted, report.workEnded, breakTimeDuration)
          report.overTime = this.overTime(report.workTime)
          if(report.works) {
            report.processTimeSum = this.processTimeSum(report.works)
          } else {
            console.log(`!!!Caution!!!: report.works is missing / ${reportId}: {${JSON.stringify(report)}}`)
          }
        })
        this.isReportFetched = true
      })
    },
    openEditor(reportId, report) {
      const encodedObject = btoa(encodeURIComponent(JSON.stringify({[reportId]:report})))
      const urlWithParams = `https://${process.env.CLIENT_URL}}/?object=${encodedObject}#/inhouse-report`
      window.open(urlWithParams,'_blank')
    },
    async deleteReport(reportId) {
      const result = await this.$bvModal.msgBoxConfirm("該当の日報を削除します。よろしいですか？",
        {
          title: "確認",
          size: "sm",
          centered: true,
        }
      )

      if( ! result) return
      
      this.$firebase.db.deleteInhouseReport(reportId)
      .then(() => {
        this.$delete(this.reports, reportId)
        this.$bvModal.msgBoxOk("削除が完了しました。", {title: "成功"})
      }).catch(error => {
        this.$bvModal.msgBoxOk(`削除に失敗しました。${JSON.stringify(error)}`, {title: "警告"})
      })
    },
    getShiftPatternValue(shiftPattern) {
      return shiftPattern == null
            ? this.shiftPatterns?.regular
            : Object.values(this.shiftPatterns).find(v => v.value === shiftPattern) ?? this.shiftPatterns?.regular
    }
  }
}
</script>