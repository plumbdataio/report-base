<template>
<b-container class="mw-100 m-0">
  <HeaderRow>工場の人員スケジュール</HeaderRow>
  <b-row class="mt-4">
    <b-col>
      <b-card>
        <div class="ml-3 d-flex align-items-center">
          <b-button size="sm" variant="outline-primary" @click="isSummaryShown = ! isSummaryShown">{{ isSummaryShown ? "▲" : "▼" }}</b-button>
          <div class="ml-3">出勤者数サマリー</div>
        </div>
        <template v-if="options.events.length > 0 && isSummaryShown">
          <div>
            氏名の登録有の人数合計：{{ options.resources.length}}人
          </div>
          <b-table-simple class="mb-0 mt-2 text-center" bordered>
            <b-thead head-variant="light">
              <b-th class="p-0">▼拠点 \ 日付▶</b-th>
              <template v-for="day in $dayjs(getYM() + '-01').daysInMonth()">
                <b-th :key="day" class="p-0">{{day}}</b-th>
              </template>
            </b-thead>
            <b-tbody>
              <template v-for="(days, workPlace) of pivot">
                <b-tr :key="`row-${workPlace}`">
                  <b-td class="p-0">{{workPlaces.concat([{value: "totalCount", text: "予定登録済み人数"},{value: "factorySum", text: "工場のみの合計"}]).find(wp => wp.value === workPlace).text}}</b-td>
                  <template v-for="(count, index) in days">
                    <b-td :key="`${workPlace}-${index}`" class="p-0">{{count}}</b-td>
                  </template>
                </b-tr>
              </template>
            </b-tbody>
          </b-table-simple>
        </template>
        <template v-else-if="options.events.length <= 0 && isSummaryShown">
          <div class="text-center">(データがありません)</div>
        </template>
      </b-card>
    </b-col>
  </b-row>
  <b-row>
    <b-col class="mt-2">
      <InhouseReportSummary></InhouseReportSummary>
    </b-col>
  </b-row>
  <b-row>
    <b-col>
      <b-card v-if="/admin/.test($store.getters.role)" class="mt-3 editable-toggle">
        <div class="d-flex">
          <label style="font-size: 1.25em;">編集を有効にする：</label>
          <b-form-checkbox switch size="lg" @change="toggleEditable()"></b-form-checkbox>
        </div>
      </b-card>
    </b-col>
  </b-row>
  <b-row class="mt-4">
    <b-col cols="12">
      <FullCalendar ref="calendar" :options="options" class="fullcalendar"></FullCalendar>
    </b-col>
  </b-row>
  <b-row class="mt-4">
    <b-col cols="12">
      <template v-if="options.resources.length <= 0">
        <b-button size="sm" class="text-nowrap" variant="warning" @click="migrateDataFromLastMonth()">前月の人員をコピー</b-button>
      </template>
    </b-col>
  </b-row>
  <template v-if="isStaffChooserVisible">
    <StaffChooser :originalObject="chosenStaffList" :callback="listToResources" :visible="isStaffChooserVisible" @hide="isStaffChooserVisible = false"></StaffChooser>
  </template>
  <template v-if="Object.keys(targetEvent).length > 0">
    <b-modal id="eventModal" centered @ok="addEvent()" :title="targetEvent.extendedProps.staffName">
      <b-container>
        <b-row align-v="center" class="mb-2">
          <b-col :cols="4" class="text-right">
            <div>開始:</div>
          </b-col>
          <b-col :cols="8">
            <b-datepicker v-model="targetEvent.start"></b-datepicker>
          </b-col>
        </b-row>
        <b-row align-v="center" class="mb-2">
          <b-col :cols="4" class="text-right">
            <div>終了:</div>
          </b-col>
          <b-col :cols="8">
            <b-datepicker v-model="targetEvent.end"></b-datepicker>
          </b-col>
        </b-row>
        <b-row align-v="center" class="mb-2">
          <b-col :cols="4" class="text-right">
            <div>主な勤務地:</div>
          </b-col>
          <b-col :cols="8">
            <b-select v-model="targetEvent.extendedProps.workPlace">
              <template v-for="workPlace in workPlaces">
                <b-select-option :key="workPlace.value" :value="workPlace.value">{{workPlace.text}}</b-select-option>
              </template>
            </b-select>
          </b-col>
        </b-row>
        <b-row v-if="targetEvent.extendedProps.workPlace === 'on-site'" align-v="center" class="mb-2">
          <b-col :cols="4" class="text-right">
            <div>現場名:</div>
          </b-col>
          <b-col :cols="8">
            <b-input v-model="targetEvent.extendedProps.siteName"></b-input>
          </b-col>
        </b-row>
        <template v-if="targetEvent.id != null">
          <hr>
          <b-row align-v="center" align-h="center">
            <b-col :cols="4" class="text-right" size="sm">
              <b-button size="sm" class="text-nowrap" variant="outline-danger" @click="deleteEvent(targetEvent.id)">この予定を削除</b-button>
            </b-col>
          </b-row>
        </template>
      </b-container>
    </b-modal>
  </template>
</b-container>
</template>

<!-- # # # #  NON SCOPED STYLE # # # #-->
<style scoped>
.editable-toggle {
  background-color: rgb(232, 246, 255);
}
.fullcalendar >>> .timeline-slotlabel-all a {
  color: #444444;
}
.fullcalendar >>> .timeline-slotlabel-holiday {
  background-color: #ff7676;
}
.fullcalendar >>> .timeline-slotlabel-sunday {
  background-color: #5daeff;
}
.fullcalendar >>> .timeline-slotlabel-saturday {
  background-color: #c9e4ff;
}
.fullcalendar >>> .fc-button-primary {
  background-color: #509bd5;
  border-color: #00000000;
}
.fullcalendar >>> .fc-view-harness {
  height: 80vh !important;
}
.fullcalendar >>> .staff-name-header, .fullcalendar >>> .staff-name-cell {
  width: 60%;
}
.fullcalendar >>> .company-name-header, .fullcalendar >>> .company-name-cell {
  width: 40%;
}
.fullcalendar >>> .company-name-cell {
  font-size: 0.8em;
}
.fullcalendar >>> .fc-bg-event {
  display: flex;
  align-items: flex-end;
}
.fullcalendar >>> .fc-bg-event .fc-event-title {
  display: contents;
  font-size: 6px;
}
@media screen and (max-width: 768px) {
  .fullcalendar >>> .fc-header-toolbar {
    flex-direction: column;
  }
  .fullcalendar >>> .fc-toolbar-chunk {
    flex-direction: column;
    display: flex;
    margin-bottom: 5px;
  }
  .fullcalendar >>> .staff-name-header, .fullcalendar >>> .staff-name-cell {
    width: 100%
  }
  .fullcalendar >>> .company-name-header, .fullcalendar >>> .company-name-cell {
    width: 0%;
  }
}
</style>

<script>
import HeaderRow from '@/components/header-row.vue'
import StaffChooser from '@/components/staff-chooser.vue'
import InhouseReportSummary from '@/components/inhouse-report-summary.vue'

import '@fullcalendar/core/vdom'
import FullCalendar from "@fullcalendar/vue";
import TimeLinePlugin from '@fullcalendar/resource-timeline'
import InteractionPlugin from '@fullcalendar/interaction'
import holidaysJP from 'japanese-holidays'

import cloneDeep from 'lodash/cloneDeep'

export default {
  components: {
    HeaderRow, StaffChooser, FullCalendar, InhouseReportSummary,
  },
  data() {
    return {
      isSummaryShown: false,
      isStaffChooserVisible: false,
      isReportStatusShown: false,
      reportStatusAsEvent: [],
      chosenStaffList: {},
      targetEvent: {},
      isEditable: false,
      isRenderingUnlocked: true,
      listener: null,
      workPlaces: [],
      latestSelection: {
        workPlace: "hikari",
        siteName: "",
      },
      options: {
    /** GENERAL */
        schedulerLicenseKey: "GPL-My-Project-Is-Open-Source",
        locale: 'ja',
        plugins: [TimeLinePlugin, InteractionPlugin],
        initialView: "resourceTimelineMonth",
        datesSet: () => { // this callback is called everytime any properties of this.options are modified.
          /** 
           * this.isRenderingUnlocked is used to avoid rerendering loop
           * caused by updating this.options -> datasSet called
           */ 
          if(this.isRenderingUnlocked)
            this.updateDisplayedData()
        },
    /** TOOLBAR and HEADER*/
        customButtons: {
          addResource: { text: '人員を追加', click: this.addResource },
          displayReportStatus: {text: '日報入力状況の表示切替', click: () => {
            this.isReportStatusShown = ! this.isReportStatusShown
            this.updateDisplayedData()
          }}
        },
        headerToolbar: {
          start: 'addResource displayReportStatus',
          center: '',
          end: 'today prev,next'
        },
        buttonText: {  /** [today, prev, next, prevYear, nextYear, month, week, day] */ 
            today: '今月',
        },
        stickyHeaderDates: true,
    /** RESOURCES */
        resources: [],
        resourceAreaColumns: [
          {
            field: 'staffName',
            headerContent: '氏名',
            headerClassNames: "staff-name-header",
            cellClassNames: "staff-name-cell",
          },
          {
            field: 'companyName',
            headerContent: '所属',
            headerClassNames: "company-name-header",
            cellClassNames: "company-name-cell",
          },
        ],
        resourceAreaWidth: '20%',
        resourceOrder: "index",
    /** EVENTS */
        events: [],
        slotLabelFormat: [
          (val) => `${val.date.year}年${val.date.month + 1}月`, // top level of text
          (val) => val.date.day, // top level of text
          { weekday: 'short' } // lower level of text
        ],
        slotLabelClassNames: this.slotLabelClassNames,
        displayEventTime: false,
        eventChange: this.saveEvent,
        eventClick: this.editEvent,
        // eventsSet: () => console.log(`**** Events Set!!!`),
        eventBorderColor: "#00000000",
        editable: this.isEditable,
        selectable: this.isEditable,
        select: this.selectionCallback,
      }
    }
  },
  async created() {
    const typeOptions = await this.$firebase.db.fetchTypeOptions("workplace")
    if(typeOptions != null) {
      this.workPlaces = typeOptions.filter(wp => /factory|misc|attendance/g.test(wp.category))
    }
  },
  beforeDestroy() {
    if(this.listener != null) {
      console.log(`## Detaching listener...`);
      this.$firebase.db.detachListener(this.getYM(), this.listener)
    }
  },
  computed: {
    pivot() {
      const targetMonth = this.getYM()
      const daysInMonth = this.$dayjs(targetMonth + "-01").daysInMonth()
      const result = {
        totalCount: [],
        factorySum: []
      };

      for(let i = 0; i < daysInMonth; i++) {
        result.totalCount.push(0)
        result.factorySum.push(0)
      }
      
      this.options.events.forEach(e => {
        const workPlace = e.extendedProps.workPlace
        if(workPlace === "") return;
        let cursor = this.$dayjs(e.start)
        let end = this.$dayjs(e.end)

        try {
          e.end.length === 10
        } catch (e) {
          console.log(JSON.stringify(e, null, 2));
        }

        if(e?.end?.length === 10) {
          end = end.subtract(1, 'day')
        }
        
        while(cursor.format('YYYY-MM-DD') <= end.format('YYYY-MM-DD')) {
          if(cursor.format('YYYY-MM') < targetMonth) {
            cursor = cursor.add(1, 'month').startOf('month')
            continue;
          }

          if(result[workPlace] == null) {
            result[workPlace] = []
            for(let i = 1; i <= daysInMonth; i++) {
              result[workPlace].push(0)
            }
          }

          result[workPlace][cursor.date()-1]++
          result.totalCount[cursor.date()-1]++

          if(this.workPlaces.some(wp => wp.value === workPlace && wp.category === "factory")) {
            result.factorySum[cursor.date()-1]++
          }
          cursor = cursor.add(1, 'day')
        }
      })

      const sorted = {}
      const resultKeys = Object.keys(result)

      sorted.totalCount = result.totalCount
      sorted.factorySum = result.factorySum
      this.workPlaces.forEach(wp => {
        if(resultKeys.includes(wp.value))
          sorted[wp.value] = result[wp.value]
      })
      return sorted
    }
  },
  methods: {
    getYM() {
      const date = this.$refs.calendar.getApi().getDate()
      // console.log(`date: ${JSON.stringify(date)}`);
      const month = date.getMonth() + 1
      return `${date.getFullYear()}-${month < 10 ? `0${month}` : month}`
    },
    slotLabelClassNames(obj) {
      if(obj.level > 0) {
        if(obj.date.getDay() === 0)
          return ['timeline-slotlabel-all', 'timeline-slotlabel-sunday']
        else if(holidaysJP.isHoliday(obj.date, true))
          return ['timeline-slotlabel-all', 'timeline-slotlabel-holiday']
        else if(obj.date.getDay() === 6)
          return ['timeline-slotlabel-all', 'timeline-slotlabel-saturday']
      }
      return ['timeline-slotlabel-all']
    },
    toggleEditable(arg) {
      this.isEditable = ! this.isEditable
      this.options.editable = ! this.options.editable
      this.options.selectable = ! this.options.selectable
    },
    getStaffNameByResourceId(resourceId) {
      return this.options.resources.find(resource => resource.id === resourceId)?.extendedProps?.staffName
    },
    async updateDisplayedData() {
      console.log(`## updateDisplayedData()`);
      const ym = this.getYM()
      if(this.listener != null) {
        console.log(`## Detaching listener...`);
        await this.$firebase.db.detachListener(ym, this.listener)
      }
      this.listener = await this.$firebase.db.listenFactorySchedule(ym, async data => {
        // Turn off unlocked flag to avoid update loop
        this.isRenderingUnlocked = false

        this.options.resources = (data?.resources ? [...data.resources] : []).sort((a,b) => {
          const staffNameA = a.extendedProps.staffName
          const staffNameB = b.extendedProps.staffName
          const companyNameA = a.extendedProps.companyName
          const companyNameB = b.extendedProps.companyName

          const result =
          /** aかbが${COMPANY_NAME}の場合 */
          companyNameA.match(new RegExp(process.env.COMPANY_NAME)) && companyNameB.match(new RegExp(process.env.COMPANY_NAME))
          ? (staffNameA > staffNameB ? -1 : 1)
          : companyNameA.match(new RegExp(process.env.COMPANY_NAME))
          ? -1
          : companyNameB.match(new RegExp(process.env.COMPANY_NAME))
          ? 1

          /** aかbが一人外注の場合 */
          : companyNameA.match(/一人外注/) && companyNameB.match(/一人外注/)
          ? (staffNameA > staffNameB ? -1 : 1)
          : companyNameA.match(/一人外注/)
          ? -1
          : companyNameB.match(/一人外注/)
          ? 1

          /** 上記以外 */
          : companyNameA > companyNameB
          ? -1
          : 1
          return result
        }).map((resource, index) => {
          resource.index = index
          return resource
        })

        // this.options.events = data?.events ? [...data.events] : []
        this.options.events = data?.events?.map(rawEvent => new Event(rawEvent)) ?? []
        if(this.isReportStatusShown) {
          if(this.reportStatusAsEvent.length > 0) {
            this.options.events = this.options.events.filter(e => e.display !== "background")
          }
          await this.showReportInputStatus()
          this.options.events = this.options.events.concat(this.reportStatusAsEvent)
        }

        this.$nextTick().then(() => {
          // Now that this.options is updated, you can turn on the unlocked flag
          this.isRenderingUnlocked = true
        })
        console.log(`## Data updated by listener.`);
      })
    },
    async showReportInputStatus() {
      const dayjs = this.$dayjs(this.$refs.calendar.getApi().getDate())
      const start = dayjs.startOf('month').format('YYYY/MM/DD')
      const end = dayjs.endOf('month').format('YYYY/MM/DD')
      const reports = await this.$firebase.db.fetchInhouseReport(false, start, end, null, false)
      const resources = this.options.resources.map(resource => ({
        name: resource.extendedProps?.staffName?.replace(/ |　|・/g, ""),
        id: resource.id
      })).sort((a, b) => a.staffName > b.staffName ? 1 : -1)
      let counter = 0
      this.reportStatusAsEvent = []

      if(reports == null || Object.keys(reports).length <= 0) return

      Object.values(reports)?.sort((a, b) => a.name > b.name ? 1 : -1).forEach(report => {
        const resource = resources.find(item => item.name === report.name?.replace(/ |　|・/g, ""))
        if(resource == null)
          return
        const bgEvent = new Event({
          id: `report-${new Date().getTime()}-${++counter}`,
          resourceId: resource.id,
          start: report.date.replace(/\//g, "-"),
          end: report.date.replace(/\//g, "-"),
          display: "background",
          backgroundColor: "#baff5a",
          title: this.workPlaces.find(workPlace => workPlace.value === report?.checkedInAt)?.text.substr(0,2),
        })
        this.reportStatusAsEvent.push(bgEvent)
      })
      console.log(`## showReportInputStatus(): completed...`);
    },
    addResource() {
      if( ! this.isEditable) {
        this.$bvModal.msgBoxOk(`まず「編集を有効にする」を押して下さい。`, {
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'outline-primary',
          okTitle: 'OK',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true
        })
        return
      }
      
      this.chosenStaffList = {}
      this.options.resources.forEach(resource => {
        this.chosenStaffList[resource.id] = resource.extendedProps
      })
      this.isStaffChooserVisible = true
    },
    listToResources(list) {
      this.isStaffChooserVisible = false
      this.options.resources = []
      console.log(list);
      Object.entries(list).forEach(([staffId, data]) => {
        this.options.resources.push({
          id: staffId,
          extendedProps: data
        })
      })

      this.$firebase.db.saveFactorySchedule(this.getYM(), {
        resources: this.options.resources,
        events: this.options.events.filter(e => e.display !== "background")
      })
    },
    addEvent() {
      console.log(`## addEvent()`);
      const workPlace = cloneDeep(this.workPlaces.find(workPlace => workPlace.value === this.targetEvent.extendedProps.workPlace))

      // Concat siteName to workPlace.text if it's "現場".
      if(workPlace.text?.includes("現場")) {
        workPlace.text = this.workPlaces.find(entry => entry.text?.includes("現場"))?.text + "　" + (this.targetEvent.extendedProps?.siteName ?? "")
      }

      const event = new Event({
        id: this.targetEvent.id ?? new Date().getTime().toString(),
        title: workPlace.text,
        backgroundColor: workPlace.backgroundColor,
        start: this.targetEvent.start,
        end: this.$dayjs(this.targetEvent.end).add(1, 'd').format('YYYY-MM-DD'),
        resourceId: this.targetEvent?.resource?.id ?? this.targetEvent.resourceId,
        allDay: true,
        // display: workPlace.value === "out-of-range" ? "background" : "auto",
        overlap: workPlace.value !== "out-of-range",
        extendedProps: {
          staffName: this.targetEvent.extendedProps.staffName,
          workPlace: workPlace.value,
          siteName: this.targetEvent.extendedProps.siteName,
        }
      })

      if(this.targetEvent.id != null) {
        this.options.events = this.options.events.map(e => e.id === event.id ? event : e)
      } else {
        this.options.events.push(event)
      }

      const additionalEvents = []
      const indiciesToBeDeleted = []
      this.options.events.forEach((existingEvent, index) => {
        if(existingEvent.resourceId != event.resourceId || existingEvent.id == event.id) {
          return
        }

        // The block below will keep all the start and end involved with formatted
        {
          const YYYYMMDD = "YYYY-MM-DD"
          event.start = this.$dayjs(event.start).format(YYYYMMDD)
          event.end = this.$dayjs(event.end).format(YYYYMMDD)
          existingEvent.start = this.$dayjs(existingEvent.start).format(YYYYMMDD)
          existingEvent.end = this.$dayjs(existingEvent.end).format(YYYYMMDD)
        }

        if(event.end <= existingEvent.start || existingEvent.end <= event.start) {
          console.log(`1. out of range: ${existingEvent.start} to ${existingEvent.end}`)
        } else if(event.start <= existingEvent.start && existingEvent.end <= event.end) {
          console.log(`2. existingEvent is completely comprehended by new event: ${existingEvent.start} to ${existingEvent.end}`)
          indiciesToBeDeleted.push(index)
        } else if(event.start <= existingEvent.start) {
          console.log(`3. existingEvent starts later than new event: ${existingEvent.start} => ${event.end}`)
          existingEvent.start = event.end
        } else if(existingEvent.end <= event.end ) {
          console.log(`4. existingEvent ends earlier than new event: ${existingEvent.end} => ${event.start}`)
          existingEvent.end = event.start
        } else {
          console.log(`5. new event is completely comprehended by existingEvent: ${existingEvent.start} to ${existingEvent.end}`)

          const duplicatedEvent = new Event(existingEvent)
          duplicatedEvent.id = new Date().getTime().toString()
          existingEvent.end = event.start
          duplicatedEvent.start = event.end

          additionalEvents.push(duplicatedEvent)
        }
      })

      indiciesToBeDeleted.sort().reverse()
      indiciesToBeDeleted.forEach(index => this.options.events.splice(index, 1))
      this.options.events.push(...additionalEvents)
      this.saveEvent()

      Object.keys(this.latestSelection).forEach(key => {
        console.log(`assigned new ${key}: ${event?.extendedProps?.[key]}`);
        this.latestSelection[key] = event?.extendedProps?.[key]
      })
    },
    saveEvent(received) {
      console.log(`## saveEvent()`);
      if( ! this.isRenderingUnlocked) {
        console.log(`it's not unlocked...`);
        return
      }
      if(received?.oldEvent != null) {
        let isEqualEventFound = false
        this.isRenderingUnlocked = false
        this.options.events = this.options.events.map(current => {
          if(current.id == received.oldEvent.id) {
            Object.keys(current).forEach(key => {
              current[key] = received.event[key] ?? current[key]
            })
            isEqualEventFound = true
          }
          return current
        })
        this.$nextTick().then(() => {
          // Now that this.options is updated, you can turn on the unlocked flag
          this.isRenderingUnlocked = true
        })

        if( ! isEqualEventFound) {
          alert(`エラー：変更が保存できませんでした。`)
          return
        }
      }

      this.$firebase.db.saveFactorySchedule(this.getYM(), {
        resources: this.options.resources,
        events: this.options.events.filter(e => e.display !== "background")
      })
    },
    editEvent(arg) {
      console.log(`## editEvent()`);
      this.isRenderingUnlocked = false
      const eventSent = new Event(arg.event)
      this.isRenderingUnlocked = true
      this.selectionCallback(eventSent)
    },
    async selectionCallback(receivedEvent) {
      console.log(`## selectionCallback()`);
      if( ! this.isEditable) return

      // receivedEvent.end is exclusive, so needs to be translated
      this.targetEvent = receivedEvent
      this.targetEvent.end = this.$dayjs(this.targetEvent.end).subtract(1, 'date').format('YYYY-MM-DD')

      if(this.targetEvent?.extendedProps == null) {
        this.$set(this.targetEvent, "extendedProps", {})
      }
      if(this.targetEvent.extendedProps.staffName == null) {
        this.targetEvent.extendedProps.staffName = this.getStaffNameByResourceId(this.targetEvent?.resource?.id ?? this.targetEvent?.resourceId)
      }
      if(this.targetEvent.extendedProps.workPlace == null) {
        this.$set(this.targetEvent.extendedProps, "workPlace", this.latestSelection.workPlace)
      }
      if(this.targetEvent.extendedProps.siteName == null) {
        this.$set(this.targetEvent.extendedProps, "siteName", this.latestSelection.siteName)
      }

      this.$nextTick().then(() => {
        this.$bvModal.show("eventModal")
      })
    },
    async deleteEvent(eventId) {
      const bool = await this.$bvModal.msgBoxConfirm('本当に削除してよろしいですか？', {
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'danger',
        okTitle: 'はい',
        cancelTitle: 'いいえ',
        footerClass: 'p-2',
        hideHeaderClose: false,
        centered: true
      })
      if( ! bool) return
      console.log(`## deleteEvent()`);
      this.options.events = this.options.events.filter(event => event.id != eventId)
      this.saveEvent()
      this.$bvModal.hide("eventModal")
    },
    async migrateDataFromLastMonth() {
      const thisMonth = this.$dayjs(this.$refs.calendar.getApi().getDate())
      const firstDateOnThisMonth = thisMonth.startOf("month").format('YYYY-MM-DD')
      const lastDateOnThisMonth = thisMonth.endOf("month").add(1, "d").format('YYYY-MM-DD')
      const lastMonth = thisMonth.clone().startOf("month").subtract(1, 'd')
      const lastYM = lastMonth.format('YYYY-MM')
      const lastDateOnLastMonth = lastMonth.format('YYYY-MM-DD')
      console.log(`${lastMonth.year()}年${lastMonth.month()+1}月`);
      const bool = await this.$bvModal.msgBoxConfirm(`前月(${lastMonth.year()}年${lastMonth.month()+1}月)の人員全員を、当月にコピーしますか？`, {
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'danger',
        okTitle: 'はい',
        cancelTitle: 'いいえ',
        footerClass: 'p-2',
        hideHeaderClose: false,
        centered: true
      })
      if( ! bool) return

      const fetchedSchedule = await this.$firebase.db.fetchFactoryScheduleOnce(lastYM)
      // Push resourceId if event on the last day is "out-of-range"
      const removedResourceIds = []
      fetchedSchedule?.events.forEach(e => {
        if(e.extendedProps?.workPlace === "out-of-range" && e.end >= lastDateOnLastMonth) {
          removedResourceIds.push(e.resourceId)
          console.log(e.extendedProps.staffName, e.end, lastDateOnLastMonth);
        }
      })
      
      // Copy events and resources
      this.options.resources = fetchedSchedule?.resources.filter(r => ! removedResourceIds.includes(r.id)) ?? []
      this.options.events = fetchedSchedule?.events
      .filter(e => lastDateOnLastMonth < e.end)
      .filter(e => ! removedResourceIds.includes(e.resourceId))
      .map(e => {
        e.start = firstDateOnThisMonth
        e.end = lastDateOnThisMonth
        return e
      }) ?? []

      await this.$nextTick(() => {
        this.$firebase.db.saveFactorySchedule(this.getYM(), {
          resources: this.options.resources,
          events: this.options.events.filter(e => e.display !== "background")
        })
      })
      this.$bvModal.msgBoxOk(`コピーに成功しました！`, {
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'outline-primary',
        okTitle: 'OK',
        footerClass: 'p-2',
        hideHeaderClose: false,
        centered: true
      })
    }
  }
}

class Event {
  id;
  title;
  backgroundColor;
  start;
  end;
  resourceId;
  allDay = true;
  display;
  overlap;
  extendedProps = {
    staffName: null,
    workPlace: null,
    siteName: null,
  };

  constructor(event) {
    if(event == null) return
    if(typeof event !== "object") {
      throw new Error("The first argument for constructor of class 'Event' should be either an object or instance of Event.")
    }

    Object.keys(this).forEach(prop => {
      if(prop === "resourceId" && event?.getResources) {
        this[prop] = event.getResources()[0].id
        return
      }

      // if the prop is an object, sub-props needs to be assigned one by one, otherwise they remain read-only
      if(prop === "extendedProps" && event?.[prop] != null) {
        Object.keys(event[prop]).forEach(subProp => {
          this[prop][subProp] = event[prop][subProp]
        })
        return
      }
      this[prop] = event[prop] ?? null
    })
  }
}
</script>