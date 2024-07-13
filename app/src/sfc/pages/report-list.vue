<template>
<div>
  <HeaderRow>日報一覧</HeaderRow>
  <div class="d-flex flex-column flex-md-row">
    <b-button-toolbar class="button-bar mt-4 align-items-center justify-content-center justify-content-md-start">
      <b-button variant="primary" size="sm" @click="addMonth(-1)">◀</b-button>
      <MonthPicker v-model="controls.selectedYYYYMM" style="width: 150px;"></MonthPicker>
      <b-button variant="primary" size="sm" @click="addMonth(1)">▶</b-button>
    </b-button-toolbar>
    <div class="warning-message align-self-md-end align-self-center ml-md-4 mr-md-auto mx-auto mt-2">※データが入力されている箇所を{{ $mq.match(/xs|sm/) ? "タップ" : "クリック"}}すると詳細表示</div>
  </div>
  <b-table-simple bordered outlined sticky-header="80dvh" class="text-center mt-2 main-table">
    <b-thead head-variant="light">
      <b-tr>
        <b-th rowspan="2" colspan="2" sticky-column class="text-left">氏名</b-th>
        <template v-for="date in controls.lastDate">
          <b-th :key="`date-${date}`" class="header-date">
            <div class="cell-date">{{ date }}</div>
            <div :style="`background-color: ${$dayjs().date(date).day() === 6 ? 'var(--info)' : $dayjs().date(date).day() === 0 ? 'var(--warning)' : ''}`">{{ $dayjs().date(date).format('ddd')}}</div>
          </b-th>
        </template>
      </b-tr>
    </b-thead>
    <b-tbody class="text-nowrap">
      <template v-if="controls.isReportReady">
        <template v-if="Object.keys(form.reports).length === 0">
          <b-tr>
            <b-td :colspan="controls.lastDate + 2" class="fixed-height v-base" style="vertical-align: baseline;">
              <div class="centered-in-window" style="color: var(--secondary)">データが存在しません</div>
            </b-td>
          </b-tr>
        </template>
        <template v-for="(report, staffId) in form.reports">
          <b-tr :key="`row-attendance-${staffId}`" class="row-attendance">
            <b-td rowspan="6" colspan="2" sticky-column class="m-0 p-0 no-border child-fine-tuning">
              <b-td rowspan="7" class="cell-name px-2 px-sm-3 w-100" style="border-top: 0; border-bottom: 0;" v-html="Object.values(report)[0].name.replace(/ |　/g, '<br>')"></b-td>
              <template v-for="itemName in ['勤怠', '通勤費', '出張手当', '朝食代', '昼食代', '夕食代']">
                <b-tr>
                  <b-td class="fixed-height px-1 px-sm-3">{{itemName}}</b-td>
                </b-tr>
              </template>
            </b-td>
            <template v-for="date in controls.lastDate">
              <template v-for="id in [`attendance-${staffId}-${date}`]">
                <b-td :key="id" :id="id" :ref="id" class="fixed-height p-0" @click="openTooltip(id, report[date])" :style="getAttendanceCellStyle(report[date])">
                  <div class="w-100 h-100 d-flex justify-content-center align-items-center position-relative">
                    <template v-if="report[date] != null">
                      <div>{{ $optionValueTo("attendance", report[date]?.attendance, "textShort") }}</div>
                    </template>
                    <template v-if="report[date]?.remarks != null && report[date]?.remarks != ''">
                      <div class="dog-ear"></div>
                    </template>
                    <template v-if="$tstore.auth.role === 'admin'">
                      <div class="tags-bottom">
                        {{ report[date]?.isShort ? "短" : (report[date]?.isLong ? "残" : "")}}
                      </div>
                    </template>
                  </div>
                </b-td>
              </template>
            </template>
          </b-tr>
          <template v-for="item in ['transportation', 'travel', 'breakfast', 'lunch', 'dinner']">
            <b-tr>
              <template v-for="date in controls.lastDate">
                <template v-for="id in [`${item}-${staffId}-${date}`]">
                  <b-td :key="id" :id="id" class="fixed-height" @click="openTooltip(id, report[date])">
                    <template v-if="report[date] != null">
                      <span style="color: var(--warning)">{{ report[date].allowance[item] ? "●" : "" }}</span>
                    </template>
                  </b-td>
                </template>
              </template>
            </b-tr>
          </template>
        </template>
        <b-tooltip id="detail-tooltip" ref="tooltip" :target="controls.tooltipTargetId" variant="light" placement="rightbottom" triggers="manual" boundary="window">
          <template v-if="controls.selectedReport != null">
            <div v-click-outside="clickedOutsideOfTooltipBoundary">
              <div class="d-flex gap-10 justify-content-end">
                <button @click="closeTooltip" style="width: 40px; border: 0px; background-color: transparent;">✕</button>
              </div>
              <div class="d-flex gap-10 justify-content-center">
                <b-button size="sm" variant="secondary" @click="openReportEditor('edit')">編集</b-button>
                <b-button size="sm" variant="outline-secondary" @click="openReportEditor('duplicate')">複製</b-button>
              </div>
              <b-table-simple bordered small class="mb-0 mt-3 detail-table border-0">
                <b-tbody>
                  <b-tr>
                    <b-td variant="primary">日付</b-td>
                    <b-td>{{ controls.selectedReport.date instanceof Date ? $dayjs(controls.selectedReport.date).format("YYYY/M/D(ddd)") : "" }}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">勤怠</b-td>
                    <b-td>{{ $optionValueTo("attendance", controls.selectedReport.attendance, "text") }}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">勤務時間</b-td>
                    <b-td>{{ controls.selectedReport.startTime }} 〜 {{ controls.selectedReport.endTime }}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">休憩時間</b-td>
                    <b-td>{{ controls.selectedReport.breakTime }}</b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">出張手当</b-td>
                    <b-td>
                      <b-checkbox :checked="controls.selectedReport.allowance.travel" disabled class="to-fix-vertical-position"></b-checkbox>
                    </b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">食事</b-td>
                    <b-td>
                      <template v-for="meal in $tstore.bundles.options.meals">
                        <b-checkbox :checked="controls.selectedReport.allowance[meal.value]" disabled>{{meal.text}}</b-checkbox>
                      </template>
                    </b-td>
                  </b-tr>
                  <b-tr>
                    <b-td variant="primary">備考</b-td>
                    <b-td>{{ controls.selectedReport.remarks }}</b-td>
                  </b-tr>
                  <br>
                  <b-tr>
                    <b-td colspan="2" variant="info">工番別稼働時間</b-td>
                  </b-tr>
                  <template v-for="(work, index) in controls.selectedReport.works">
                    <b-tr :key="index">
                      <b-td>{{ work.projectId }}: {{ projectTranslated(work.projectId) }}</b-td>
                      <b-td>{{ work.duration }}
                        <template v-if="work.detail != null">
                          <br>
                          {{ work.detail }}
                        </template>
                      </b-td>
                    </b-tr>
                  </template>
                </b-tbody>
              </b-table-simple>
            </div>
          </template>
        </b-tooltip>
      </template>
      <template v-else>
        <b-tr>
          <b-td :colspan="controls.lastDate + 2" class="fixed-height" style="vertical-align: baseline;">
            <div class="centered-in-window">
              <b-spinner size="sm" variant="info"></b-spinner>
            </div>
          </b-td>
        </b-tr>
      </template>
    </b-tbody>
  </b-table-simple>
</div>
</template>

<style scoped>
.main-table * {
  border-collapse: collapse !important;
}
.header-date {
  margin: 0;
  padding: 0;
  min-width: 50px;
}
.fixed-height {
  height: 50px;
}
.cell-date {
  border-bottom: 1px solid lightgray;
}
.child-fine-tuning {
  & :nth-child(2) > td {
    border-top: 0;
    height: 49px;
  }
  & :last-child > td {
    border-bottom: 0;
  }
}
.row-attendance {
  border-top: 2px solid lightgray;
}
.cell-name {
  vertical-align: middle;
  width: 3em;
}
.button-bar > *:not(:first-child) {
  margin-left: 10px;
}
.dog-ear {
  width: 15px;
  height: 15px;
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: var(--danger);
  clip-path: polygon(0 0, 100% 100%, 100% 0);
}
.tags-bottom {
  position: absolute;
  bottom: -2px;
  right: 1px;
  font-size: 0.7em;
  opacity: 0.6;
}
.detail-table >>> * {
  vertical-align: middle;
}

.to-fix-vertical-position >>> label {
  position: absolute;
}
.tooltip-target {
  background-color: aqua;
}
.centered-in-window {
  position: fixed;
  inset: auto 0;
  @media (min-width: 768px) {
    inset: auto 0 auto var(--sidebar-width);
  }
}
</style>

<script lang="ts">
import Vue from 'vue';
import MonthPicker from '@/sfc/components/month-picker.vue'
import { to } from 'await-to-js'
import { Report } from '@/schema/Report'
import { Project } from '@/schema/Project'
import { Staff } from '@/schema/Staff';

export default {
  async created() {
    this.buildReports()
    const projects : Project[] = await this.$firebase.db.fetchProjectsWithStatusFilter() ?? []
    this.controls.projectOptions = projects.map((project : Project) => {
      return {
        //@ts-expect-error
        value: project.projectId as string,
        text: project.projectTitle as string
      }
    })
  },
  components: { MonthPicker },
  data() {
    return {
      controls: {
        selectedYYYYMM: this.$dayjs().format("YYYY-MM"),
        lastDate: this.$dayjs().daysInMonth(),
        isReportReady: false,
        tooltipTargetId: "",
        selectedReport: null as Report|null,
        projectOptions: [] as {value: string, text: string}[],
      },
      form: {
        reports: {} as {[staffId: string]: {[date: string]: Report}}
      },
      misc: {
        staffs: {} as {[staffId: string]: Staff}
      }
    }
  },
  watch: {
    ["controls.selectedYYYYMM"]: function() {
      this.buildReports()
    }
  },
  methods: {
    addMonth(num : number) : void {
      const current : number[] = this.controls.selectedYYYYMM.split("-").map(s => parseInt(s))
      this.controls.selectedYYYYMM = this.$dayjs().year(current[0]).month(current[1]-1).add(num, 'month').format('YYYY-MM')
    },
    async buildReports() : Promise<void> {
      this.controls.isReportReady = false
      this.form.reports = {}

      const {firstDate, lastDate} = this.getFirstAndLastDateOfMonth(this.controls.selectedYYYYMM)
      const uid = this.$tstore.auth.role !== 'admin' ? this.$tstore.auth.uid : undefined

      let [error1, rawReports] = await to(this.$firebase.db.fetchReport(firstDate, lastDate, uid))
      if(error1 || rawReports == null) {
        console.error(`failed to fetch reports.`, error1);
        this.$bvModal.msgBoxOk(this.newLiner(`エラー：日報データの取得に失敗しました。\n\n※再読み込みしても解決市ない場合は、数時間後に再度お試し下さい`), {
          okTitle: "再読み込み",
        }).then(() => {
          window.location.reload()
        })
        throw error1
      }

      if(this.$tstore.auth.role === "admin") {
        await this.$firebase.db.searchStaff("in-source").then(staffs => {
          this.misc.staffs = staffs.reduce((result, staff) => {
            result[staff.staffId] = staff
            return result
          }, {} as Record<string, Staff>)
        })
      } else if(this.$tstore.auth.role === "general") {
        await this.$firebase.db.fetchStaffById(this.$tstore.auth.uid).then(staff => {
          this.misc.staffs = {
            [staff.staffId]: staff
          }
        })
      }

      if(this.$tstore.pages.dbUser?.affiliation === "system-developer") {
        const [error2, additionalReports] = await to(this.$firebase.db.fetchReport(firstDate, lastDate, this.$tstore.pages.dbUser.staffId, this.$tstore.pages.dbUser?.affiliation))
        const [error3, sysDevStaffs] = await to(this.$firebase.db.searchStaff("system-developer"))
        if(error2 || error3 || additionalReports == null || sysDevStaffs == null) {
          console.log(`Warning: failed to fetch reports for 'system-developer'.`, error2);
        } else {
          rawReports = Object.assign(rawReports, additionalReports)

          this.misc.staffs = Object.assign(this.misc.staffs, sysDevStaffs.reduce((result, staff) => {
            result[staff.staffId] = staff
            return result
          }, {} as Record<string, Staff>))
        }
      }

      rawReports.forEach(report => {
        if(this.form.reports[report.staffId] == null) {
          this.form.reports[report.staffId] = {} as Record<string, Report>
        }
        const date = this.$dayjs(report.date).format("D")
        this.form.reports[report.staffId][date] = report

        const startTimeDResult = this.getDayjsDuration(report.startTime)
        const endTimeDResult = this.getDayjsDuration(report.endTime)
        const breakTimeDResult = this.getDayjsDuration(report.breakTime)
        const workHoursResult = endTimeDResult.subtract(startTimeDResult).subtract(breakTimeDResult).asHours()

        const startTimeDExpected = this.getDayjsDuration(this.misc.staffs[report.staffId].workStart)
        const endTimeDExpected = this.getDayjsDuration(this.misc.staffs[report.staffId].workEnd)
        const breakTimeDExpected = this.getDayjsDuration(this.misc.staffs[report.staffId].breakTime)
        const workHoursExpected = endTimeDExpected.subtract(startTimeDExpected).subtract(breakTimeDExpected).asHours()

        report.isShort = workHoursResult < workHoursExpected
        report.isLong = workHoursResult > workHoursExpected
      })

      this.controls.isReportReady = true
    },
    async openTooltip(id : string, report : Report) : Promise<void> {
      if( this.$refs[id] != null && this.$refs[id] instanceof Vue) {
        console.log("gtest");
        (this.$refs[id] as Vue).$el.classList.add("tooltip-target")
      }

      this.closeTooltip()
      if(id == null || report == null) {
        return;
      }
      this.controls.tooltipTargetId = id
      this.controls.selectedReport = report

      // Calling $nextTick() x2 is not a mistake.
      // if you make it x1, first click action to open tooltip doesn't open it...
      await this.$nextTick()
      await this.$nextTick()

      if(this.$refs.tooltip != null && this.$refs.tooltip instanceof Vue) {
        (this.$refs.tooltip as Vue).$emit('open')
      }
    },
    clickedOutsideOfTooltipBoundary(pe: PointerEvent) {
      const tooltip = document.getElementById("detail-tooltip")
      if(tooltip != null) {
        const {x, y, height, width} = tooltip.getBoundingClientRect()
        if(x < pe.x && pe.x < x + width) {
          return
        }
        if(y < pe.y && pe.y < y + height) {
          return
        }
      }
      this.closeTooltip()
    },
    closeTooltip() {
      //@ts-expect-error
      this.$refs.tooltip.$emit('close')
    },
    projectTranslated(projectId : number) : string {
      return this.controls.projectOptions.find(o => o.value == projectId.toString())?.text ?? ""
    },
    openReportEditor(mode: "edit"|"duplicate") {
      if(this.controls.selectedReport != null) {
        const encodedReport = encodeURI(JSON.stringify(this.controls.selectedReport.toJSON()))
        open(`/#report-input/${mode}?report=${encodedReport}`)
      }
    },
    getAttendanceCellStyle(report: Report) {
      if(report == null) {
        return {}
      }

      let style = {
        backgroundColor: "",
      }
      switch (report.attendance) {
        case "regular-work":
          style.backgroundColor = "rgb(var(--success-args), 0.3)"
          break;
        case "dayoff":
          style.backgroundColor = "var(--light)"
          break;
        case "site-off":
          style.backgroundColor = "var(--light)"
          break;
        case "absent":
          style.backgroundColor = "rgb(var(--danger-args), 0.3)"
          break;
        case "paidoff":
          style.backgroundColor = "rgb(var(--warning-args), 0.8)"
          break;
        case "half-paidoff":
          style.backgroundColor = "rgb(var(--info-args), 0.6)"
          break;
        case "holiday-work":
          style.backgroundColor = "rgb(var(--secondary-args), 0.4)"
          break;
        default:
          console.log("Warning: Un-styled attendance type: ", report.attendance)
          break;
      }

      return style;
    }
  },
}
</script>