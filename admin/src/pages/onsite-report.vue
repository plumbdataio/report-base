<template>
  <b-container class="p-0 grand-container">
    <HeaderRow>工事別日報{{ canEdit() ? "" : " ※閲覧専用"}}</HeaderRow>
    <b-row class="mt-4">
      <b-col>
        <b-table-simple stacked="md" class="overview">
          <b-thead>
            <tr>
              <th class="text-nowrap">工事名</th>
              <th class="text-nowrap">客先</th>
              <th class="text-nowrap">人数</th>
              <th class="text-nowrap">工期</th>
              <template v-if="$store.getters.isAccountant">
                <th class="text-nowrap">当月人件費</th>
                <th class="text-nowrap">デフォルト<br>単価</th>
                <th clsss="text-nowrap">単価未入力者</th>
              </template>
            </tr>
          </b-thead>
          <b-tbody v-if="isProjectAndConfidentialReady">
            <b-tr class="border-bottom">
              <b-td stacked-heading="工事名">{{project.projectName}}</b-td>
              <b-td stacked-heading="客先">{{project.primeContractorName}}</b-td>
              <b-td stacked-heading="人数">{{Object.keys(project.assignedStaff).length}}名</b-td>
              <b-td stacked-heading="工期">{{project.dateStart.split('-').join('/')}}〜<br>{{dateEndOrUndetermined(project.dateEnd.split('-').join('/'))}}</b-td>
              <template v-if="$store.getters.isAccountant">
                <b-td stacked-heading="当月人件費">{{sumOfWages}}</b-td>
                <b-td stacked-heading="デフォルト単価">
                  <b-input v-model="defaultDailyWage" type="number" step="1000"></b-input>
                </b-td>
                <b-td stacked-heading="単価未入力者" class="unit-price-not-defined">{{countOfStaffWithoutExpenseManhour}}人</b-td>
              </template>
            </b-tr>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
    <b-row class="mt-2" v-once>
      <b-col v-once :class="{'text-center': $mq === 'sm'}">
        <p style="font-size: 1.5em;"><span class="bulletpoint"> ● </span>{{year}}年{{month}}月分</p>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col v-once sm="auto" class="d-flex c-gap" :class="{'justify-content-center': $mq === 'sm'}">
        <b-btn-group>
          <b-button size="sm" variant="warning" @click="addMonth(-1)">◀前月</b-button>
          <b-button size="sm" variant="warning" @click="addMonth(1)">翌月▶</b-button>
        </b-btn-group>
        <b-button size="sm" variant="warning" @click="backToProjectList">
          <BIconArrow90degUp></BIconArrow90degUp>
          一覧に戻る
        </b-button>
      </b-col>
    </b-row>
    <hr>
    <b-row v-if="canEdit()" v-once class="mb-1">
      <b-col class="d-flex c-gap" :class="{'justify-content-center': $mq === 'sm'}">
        <b-button size="sm" variant="primary" :disabled="isRegistering" @click="register">保存</b-button>
        <b-btn-group>
          <b-button size="sm" variant="info" @click="copy">コピー</b-button>
          <b-button size="sm" variant="info" @click="paste">貼り付け</b-button>
        </b-btn-group>
        <b-btn-group>
          <b-button v-if="$store.getters.role === 'admin'" size="sm" variant="secondary" @click="lock(true)">ロック</b-button>
          <b-button v-if="$store.getters.role === 'admin'" size="sm" variant="secondary" @click="lock(false)">解除</b-button>
        </b-btn-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="d-flex flex-column" :class="{'align-items-center': $mq === 'sm'}">
        <b-spinner v-if=" ! fetched" variant="info" class="my-4"></b-spinner>
        <b-table-simple sticky-header="90vh" class="table-bordered" bordered>
          <b-thead v-if="fetched" head-variant="dark" v-once>
            <b-tr>
              <b-th :stickyColumn="true">氏名</b-th>
              <b-th v-for="printableDate in printableDates" :key="printableDate" class="text-center p-1" v-html="printableDate"></b-th>
              <b-th class="text-nowrap p-1">合計</b-th>
            </b-tr>
          </b-thead>
          <b-tbody v-if="fetched">
            <b-tr>
              <b-th class="p-1 text-center sticky-column-th" :stickyColumn="true">
                <b-button size="sm" :variant="allSelected ? 'secondary':'outline-secondary'" @click="selectAll()" :disabled=" ! canEdit()">全選択</b-button>
              </b-th>
              <th class="p-1 text-center" v-for="(ymd, index) in ymds" :key="`column-select-${ymd}`">
                <b-button size="sm" :variant="columnSelected[index] ? 'secondary':'outline-secondary'" @click="selectColumn(ymd, index)" :disabled=" ! canEdit()">▼</b-button>
              </th>
              <td class="paddingless">
                <svg width="45" height="40">
                  <polygon points="45,0,0,40" stroke="#cccccc"></polygon>
                </svg>
              </td>
            </b-tr>
            <template v-for="(staffData, staffId) in project.assignedStaff">
              <b-tr :key="`x-${staffId}`">
                <b-th rowspan="6" sticky-column class="paddingless sticky-column-th">
                  <div class="sticky-column-container">
                    <b-tr>
                      <b-th class="p-2 staff-name" :class="{'unit-price-not-defined': unitPriceNotDefined[staffId]}" :stickyColumn="true" rowspan="6">
                        <div v-if="$mq === 'md'" class="vertical-th">{{staffData.staffName}}</div>
                        <div v-else v-html="staffData.staffName.split(/ |　/).join('<br>')"></div>
                      </b-th>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">選択</b-th>
                    </b-tr>
                    <b-tr>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">勤務</b-th>
                    </b-tr>
                    <b-tr>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">時間</b-th>
                    </b-tr>
                    <b-tr>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">残業</b-th>
                    </b-tr>
                    <b-tr>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">深夜</b-th>
                    </b-tr>
                    <b-tr>
                      <b-th class="text-nowrap p-2 th-height" :stickyColumn="true">弁当</b-th>
                    </b-tr>
                  </div>
                </b-th>
                <td v-for="ymd in ymds" :key="`individual-select-${ymd}`" class="paddingless checkbox-each-day">
                  <b-form-checkbox size="lg" v-model="reportsNew[ymd][staffId].selected" class="checkbox-padding" :disabled=" ! canEdit()"></b-form-checkbox>
                </td>
                <td class="paddingless">
                  <svg width="45" height="40">
                    <polygon points="45,0,0,40" stroke="#cccccc"></polygon>
                  </svg>
                </td>
              </b-tr>
              <tr :key="`type-${staffId}`">
                <td v-for="ymd in ymds" :key="'type-'+ymd" class="paddingless" :class="{'locked': reportsNew[ymd][staffId].isLocked}">
                  <select v-model="reportsNew[ymd][staffId]['type']" class="select" :class="{'modified': isModified(ymd, staffId, 'type')}" :disabled="reportsNew[ymd][staffId].isLocked || ! canEdit()">
                    <option v-once v-for="(option, index) in typeOption" :key="`type-option-${index}`" :value="option.value">{{option.text}}</option>
                  </select>
                </td>
                <td :key="`${staffId}-type-sum`" class="paddingless sum">{{reportsNew | sum(staffId, "type")}}</td>
              </tr>
              <tr :key="`regular-${staffId}`">
                <td v-for="ymd in ymds" :key="'regular-'+ymd" class="paddingless" :class="{'locked': reportsNew[ymd][staffId].isLocked}">
                  <select v-model="reportsNew[ymd][staffId]['hoursRegular']" class="select" :class="{'modified': isModified(ymd, staffId, 'hoursRegular')}" :disabled="reportsNew[ymd][staffId].isLocked || ! canEdit()">
                    <option v-once v-for="(option, index) in regularTimeOption" :key="`regulartime-option-${index}`" :value="option.value">{{option.text}}</option>
                  </select>
                </td>
                <td :key="`${staffId}-regular-sum`" class="paddingless sum">{{reportsNew | sum(staffId, "regular")}}</td>
              </tr>
              <tr :key="`overtime-${staffId}`">
                <td v-for="ymd in ymds" :key="'overtime-'+ymd" class="paddingless" :class="{'locked': reportsNew[ymd][staffId].isLocked}">
                  <select v-model="reportsNew[ymd][staffId]['hoursOvertime']" class="select" :class="{'modified': isModified(ymd, staffId, 'hoursOvertime')}" :disabled="reportsNew[ymd][staffId].isLocked || ! canEdit()">
                    <option v-once v-for="(option, index) in overTimeAndLateNightOption" :key="`overtime-option-${index}`" :value="option.value">{{option.text}}</option>
                  </select>
                </td>
                <td :key="`${staffId}-overtime-sum`" class="paddingless sum">{{reportsNew | sum(staffId, "overtime")}}</td>
              </tr>
              <tr :key="`latenight-${staffId}`">
                <td v-for="ymd in ymds" :key="'latenight-'+ymd" class="paddingless" :class="{'locked': reportsNew[ymd][staffId].isLocked}">
                  <select v-model="reportsNew[ymd][staffId]['hoursLatenight']" class="select" :class="{'modified': isModified(ymd, staffId, 'hoursLatenight')}" :disabled="reportsNew[ymd][staffId].isLocked || ! canEdit()">
                    <option v-once v-for="(option, index) in overTimeAndLateNightOption" :key="`latenight-option-${index}`" :value="option.value">{{option.text}}</option>
                  </select>
                </td>
                <td :key="`${staffId}-latenight-sum`" class="paddingless sum">{{reportsNew | sum(staffId, "latenight")}}</td>
              </tr>
              <tr :key="`bento-${staffId}`">
                <td v-for="ymd in ymds" :key="'bento-'+ymd" class="paddingless" :class="{'locked': reportsNew[ymd][staffId].isLocked}">
                  <select v-model="reportsNew[ymd][staffId]['bento']" class="select" :class="{'modified': isModified(ymd, staffId, 'bento')}" :disabled="reportsNew[ymd][staffId].isLocked || ! canEdit()">
                    <option v-once v-for="(option, index) in bentoOption" :key="`bento-option-${index}`" :value="option.value">{{option.text}}</option>
                  </select>
                </td>
                <td :key="`${staffId}-bento-sum`" class="paddingless sum">{{reportsNew | sum(staffId, "bento")}}</td>
              </tr>
            </template>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
.grand-container {
  min-width: 100% !important;
}
.bulletpoint {
  color: var(--success);
  font-size: 1em;
}
.paddingless {
  padding:0px !important;
  vertical-align: middle !important;
  text-align: -webkit-center;
  text-align: center;
}
_::-webkit-full-page-media, _:future, :root .select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  min-width: 45px !important;
  height:40px !important;
  padding: 0px 0px;
  text-indent: 0.3em;
}
.select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  min-width: 45px !important;
  height:40px !important;
  padding: 0px 0px;
  border: none;
  text-align: -webkit-center;
  text-align: center;
  text-align-last: center;
}
.sticky-column-th {
  width: 112px !important;
  border-left: 0px !important;
  text-align: -webkit-center;
  text-align: center;
}
.sticky-column-container {
  border-top: 0px;
  margin: -1px;
}
.th-height {
  min-height: 41px;
  max-height: 41px;
  height: 41px;
}
.modified {
  background-color: var(--warning);
}
.locked {
  background-color: var(--info);
}
.overview {
  min-width: 80%;
}
.checkbox-each-day {
  padding-top: 5px;
  padding-bottom: 5px;
}
.checkbox-padding {
  padding-left: 2.5rem !important;
  text-align: -webkit-center;
  text-align: center;
}
.table-bordered {
  max-width: calc(100vw - 180px - 2*20px);
}
.staff-name {
  vertical-align: middle;
  border-left: 0px;
  max-width: 4em;
  min-width: 4em;
}
.unit-price-not-defined {
  background-color: var(--info);
}
.sum {
  background-color: var(--info);
}
.c-gap {
  column-gap: 15px;
}


@media screen and (max-width: 768px){
  .table-bordered {
    width: 100%;
    min-width: 100%;
  }
  .overview {
    max-width: 100%;
  }
  .staff-name {
    max-width: 2em;
    min-width: 2em;
    max-height: 15em;
    min-height: 15em;
  }
  .vertical-th {
    writing-mode: vertical-rl;
    white-space: nowrap;
  }
}
</style>

<script>
console.log("### onsite-report.vue")
import isEqual from 'lodash/isEqual'
import cloneDeep from 'lodash/cloneDeep'
import { BIconArrow90degUp } from 'bootstrap-vue'

export default {
    async created() {
        this.projectId = this.$route.params.projectId;
        await this.$firebase.db.fetchProject(this.projectId)
            .then(result => {
            this.$store.commit('project', result);
            console.log("Warn: Fetched 'project' since it has not been set for some reason.");
        });
        if (this.$store.getters.isAccountant === true) {
            await this.$firebase.db.fetchProjectConfidential(this.projectId)
                .then(result => {
                this.confidential = result;
            });
        }
        this.$set(this.$data, "project", cloneDeep(this.$store.getters.project));
        this.regularTimeOption = this.calcTimeOptions("regular");
        this.overTimeAndLateNightOption = this.calcTimeOptions("overtime");
        // Calculates dates for calender
        const deadlineWorkschedule = this.project.deadlineWorkschedule;
        const printableDateFormat = "M/D<br>(ddd)";
        console.log(`deadlineWorkschedule: ${deadlineWorkschedule}`);
        // deadlineWorkschedule === 0 means "月末締め"
        var cursor;
        if (deadlineWorkschedule == 0) {
            this.startDateOfThisTerm = this.$dayjs().year(this.year)
                .month(this.month - 1)
                .startOf('month');
            this.endDateOfThisTerm = this.$dayjs().year(this.year)
                .month(this.month - 1)
                .endOf('month');
            cursor = this.endDateOfThisTerm;
            this.printableDates = Array.apply(null, new Array(cursor.date()))
                .map((v, i) => cursor.subtract(i, "day").format(printableDateFormat))
                .reverse();
            this.ymds = Array.apply(null, new Array(cursor.date()))
                .map((v, i) => cursor.subtract(i, "day").format(this.ymdFormat))
                .reverse();
        }
        else {
            this.endDateOfThisTerm = this.$dayjs().year(this.year)
                .month(this.month)
                .date(deadlineWorkschedule);
            cursor = this.endDateOfThisTerm;
            while (cursor.date() != Number.parseInt(deadlineWorkschedule) + 1) {
                this.printableDates.push(cursor.format(printableDateFormat));
                this.ymds.push(cursor.format(this.ymdFormat));
                cursor = cursor.subtract(1, "day");
            }
            this.printableDates.push(cursor.format(printableDateFormat)); // Push one more time to add deadlineWorkschedule + 1
            this.ymds.push(cursor.format(this.ymdFormat));
            this.startDateOfThisTerm = cursor; //Now date here equals to this.startDateOfThisTerm
            this.printableDates = this.printableDates.reverse();
            this.ymds = this.ymds.reverse();
        }
        // Remove staff that start and end date are both out of range
        // This seems to be redundant as we run same loop again later,
        // but this would reduces total execution count of the loop.
        Object.keys(this.project.assignedStaff).forEach(staffId => {
            const staffData = this.project.assignedStaff[staffId];
            if (this.$dayjs(staffData.dateOut).isBefore(this.startDateOfThisTerm)
                || this.$dayjs(staffData.dateIn).isAfter(this.endDateOfThisTerm)) {
                this.$delete(this.project.assignedStaff, staffId);
                return;
            }
        });
        this.ymds.forEach(ymd => {
            this.columnSelected.push(false);
            this.$set(this.reportsNew, ymd, {});
            Object.keys(this.project.assignedStaff).forEach(staffId => {
                const staffData = this.project.assignedStaff[staffId];
                const blankReport = {
                    selected: false,
                    hoursRegular: "",
                    hoursOvertime: "",
                    hoursLatenight: "",
                    type: "",
                    bento: "",
                    isLocked: false
                };
                if (staffData.dateIn && staffData.dateIn !== "" && ymd < staffData.dateIn) {
                    blankReport.isLocked = true;
                    blankReport.lockedReason = "out-of-date";
                }
                else if (staffData.dateOut && staffData.dateOut !== "" && ymd > staffData.dateOut) {
                    blankReport.isLocked = true;
                    blankReport.lockedReason = "out-of-date";
                }
                this.$set(this.reportsNew[ymd], staffId, blankReport);
            });
        });
        console.log(`dates: ${this.startDateOfThisTerm.format(this.ymdFormat)}, ${this.endDateOfThisTerm.format(this.ymdFormat)}`);
        this.$firebase.db.fetchOnsiteReport(this.projectId, this.startDateOfThisTerm.format(this.ymdFormat), this.endDateOfThisTerm.format(this.ymdFormat))
            .then(fetchedReports => {
            console.log("fetching data by this.$firebase.db.fetchOnsiteReport...");
            this.reportsRaw = fetchedReports;
            if (fetchedReports == null) {
                this.$set(this.$data, "reportsOrig", cloneDeep(this.reportsNew));
                console.log("fetchedReports is empty...");
                this.fetched = true;
                this.isProjectAndConfidentialReady = true;
                return;
            }
            Object.keys(this.reportsRaw).forEach(reportDate => {
                Object.keys(this.reportsRaw[reportDate]).forEach(staffId => {
                    const report = cloneDeep(this.reportsRaw[reportDate][staffId]);
                    report.selected = false;
                    this.$set(this.reportsNew[reportDate], staffId, cloneDeep(report));
                    this.reportsNew[reportDate][staffId] = cloneDeep(report);
                });
            });
            // this.reportsOrig = cloneDeep(this.reportsNew)
            this.$set(this.$data, "reportsOrig", cloneDeep(this.reportsNew));
            this.fetched = true;
            this.isProjectAndConfidentialReady = true;
        });
    },
    data() {
        return {
            isRegistering: false,
            isProjectAndConfidentialReady: false,
            unitPriceNotDefined: {},
            defaultDailyWage: 20000,
            startDateOfThisTerm: null,
            endDateOfThisTerm: null,
            fetched: false,
            allSelected: false,
            columnSelected: [],
            ymdFormat: 'YYYY-MM-DD',
            ymds: [],
            printableDates: [],
            project: {},
            confidential: null,
            projectId: "",
            reportsRaw: {},
            reportsOrig: {},
            reportsNew: {},
            regularTimeOption: [],
            overTimeAndLateNightOption: [],
            typeOption: [
                { text: "", value: "" },
                { text: "出勤", value: "regular" },
                { text: "半休", value: "half-paidoff" },
                { text: "公休", value: "holiday" },
                { text: "有給", value: "paidoff" },
                { text: "欠勤", value: "absence" },
                { text: "移動", value: "transfer" }
            ],
            bentoOption: [{ text: "", value: false }, { text: "〇", value: true }]
        };
    },
    computed: {
        year() { return Number.parseInt(this.$route.params.yearMonth.split("-")[0]); },
        month() { return Number.parseInt(this.$route.params.yearMonth.split("-")[1]); },
        defaultValue() { return `${this.year}年${this.month}月`; },
        isModified: function () {
            return function (ymd, staffId, key) {
                return this.reportsNew[ymd][staffId][key] != this.reportsOrig[ymd][staffId][key];
            };
        },
        sumOfWages() {
            if (!this.isProjectAndConfidentialReady || this.confidential == null || Object.keys(this.project).length === 0)
                return "";
            let wages = 0;
            const workHours = this.project?.manhourBasehour ? this.project?.manhourBasehour : 8;
            const defaultHourlyCost = this.defaultDailyWage / workHours;
            Object.entries(this.confidential.assignedStaff).forEach(([staffId, confidential]) => {
                this.unitPriceNotDefined[staffId] = !confidential?.expenseManhour;
                console.log(!!confidential?.expenseManhour);
                const hourlyCostRegular = confidential?.expenseManhour ? parseInt(confidential.expenseManhour) / workHours : defaultHourlyCost;
                const hourlyCostOvertime = confidential?.expenseOvertime ? parseInt(confidential.expenseOvertime) : hourlyCostRegular * 1.25;
                const hourlyCostLatenight = confidential?.expenseLatenight ? parseInt(confidential.expenseLatenight) : hourlyCostRegular * 1.5;
                Object.values(this.reportsOrig).forEach(reports => {
                    if (!reports?.[staffId])
                        return;
                    wages += hourlyCostRegular * (reports[staffId].hoursRegular
                        ? reports[staffId].hoursRegular
                        : reports[staffId].type === "regular"
                            ? workHours
                            : reports[staffId].type === "half-paidoff"
                                ? workHours / 2
                                : 0);
                    wages += hourlyCostOvertime * (reports[staffId].hoursOvertime ?? 0);
                    wages += hourlyCostLatenight * (reports[staffId].hoursLatenight ?? 0);
                });
            });
            return `¥${Math.floor(wages).toLocaleString()}`;
        },
        countOfStaffWithoutExpenseManhour() {
            let counter = 0;
            Object.values(this.confidential.assignedStaff).forEach(confidential => {
                counter += confidential?.expenseManhour ? 0 : 1;
            });
            return counter;
        },
    },
    filters: {
        sum(reports, staffId, category) {
            let result = parseFloat(0);
            Object.keys(reports).forEach(key => {
                const target = reports[key][staffId];
                if (category === "type") {
                    result +=
                        /^regular$|^paidoff$|^transfer$/.test(target.type) ? 1
                            : target.type === "half-paidoff" ? 0.5
                                : 0;
                }
                else if (category === "regular") {
                    result += parseFloat(target.hoursRegular !== "" ? target.hoursRegular : 0);
                }
                else if (category === "overtime") {
                    result += parseFloat(target.hoursOvertime !== "" ? target.hoursOvertime : 0);
                }
                else if (category === "latenight") {
                    result += parseFloat(target.hoursLatenight !== "" ? target.hoursLatenight : 0);
                }
                else if (category === "bento") {
                    result += target.bento === true ? 1 : 0;
                }
            });
            return result;
        }
    },
    methods: {
        now() {
            return performance.now();
        },
        canEdit() {
            return this.$store.getters.role === 'admin'
                || this.$store.getters.uid === this.project.uidDirector
                || this.project.assignedStaff?.[this.$store.getters.uid]?.isReporter === true;
        },
        calcTimeOptions(type) {
            const option = [];
            const maxHour = type === 'overtime'
                ? 24
                : this.project.manhourBasehour !== ""
                    ? Number.parseFloat(this.project.manhourBasehour)
                    : 9;
            const interval = this.project.interval == null ? 0.5 : parseFloat(this.project.interval);
            const precision = interval.toString().split('.')?.[1].length ?? 2;
            for (let n = 1; n <= (1 / interval) * maxHour; ++n) {
                option.push({
                    value: n * interval,
                    text: `${(n * interval).toFixed(precision)}`
                });
            }
            if (type === "regular")
                option.reverse();
            else if (type === "overtime") { }
            option.unshift({ value: 0, text: "" });
            return option;
        },
        selectColumn(ymd, index) {
            console.log(`columnSelected[${index}] Before: ${this.columnSelected[index]}`);
            this.columnSelected[index] = !this.columnSelected[index];
            Object.keys(this.reportsNew[ymd]).forEach(staffId => {
                this.reportsNew[ymd][staffId].selected = this.columnSelected[index];
                console.log(`this.reportsNew[${ymd}][staffId]: ${JSON.stringify(this.reportsNew[ymd][staffId])}`);
            });
            console.log(`columnSelected[${index}] After: ${this.columnSelected[index]}`);
        },
        selectAll() {
            this.allSelected = !this.allSelected;
            this.columnSelected.forEach((val, index) => {
                this.columnSelected[index] = this.allSelected;
            });
            Object.keys(this.reportsNew).forEach(ymd => {
                Object.keys(this.reportsNew[ymd]).forEach(staffId => {
                    this.reportsNew[ymd][staffId].selected = this.allSelected;
                });
            });
        },
        isEmptyReport(report) {
            if (report.hoursRegular !== null && report.hoursRegular !== "" && report.hoursRegular != "0")
                return false;
            if (report.hoursOvertime !== null && report.hoursOvertime !== "" && report.hoursOvertime != "0")
                return false;
            if (report.hoursLatenight !== null && report.hoursLatenight !== "" && report.hoursLatenight != "0")
                return false;
            if (report.type !== null && report.type !== "")
                return false;
            if (report.bento === true)
                return false;
            if (report.lockedReason != null && report.isLocked === true)
                return false;
            return true;
        },
        async registerWrapper() {
            this.isRegistering = true;
            try {
                await this.register();
            }
            catch (error) {
                this.$bvModal.msgBoxOk(`エラーが発生しました。\n内容：${JSON.stringify(error)}`, { centered: true });
            }
            this.isRegistering = false;
        },
        async register() {
            const reportsToBeSaved = cloneDeep(this.reportsNew);
            let isAnythingModified = false;
            Object.keys(this.reportsOrig).forEach(ymd => {
                Object.keys(this.reportsOrig[ymd]).forEach(staffId => {
                    // Create temporaty object to compare on condition with absence of key "selected"
                    const tempOrig = cloneDeep(this.reportsOrig[ymd][staffId]);
                    const tempNew = reportsToBeSaved[ymd][staffId];
                    delete tempOrig.selected;
                    delete tempNew.selected;
                    if (!isEqual(tempOrig, tempNew))
                        isAnythingModified = true;
                    // Delete empty data
                    if (this.isEmptyReport(tempNew))
                        delete reportsToBeSaved[ymd][staffId]; // "delete tempNew" will be error on strict mode
                    if (tempNew.isLocked && tempNew.lockedReason === "out-of-date") {
                        delete reportsToBeSaved[ymd][staffId];
                    }
                });
            });
            if (!isAnythingModified) {
                this.$bvModal.msgBoxOk("変更点がありません。", { centered: true });
                return;
            }
            if (!await this.$bvModal.msgBoxConfirm("必ず変更点の確認をしてください。\n\n変更点を保存しますか？", { centered: true })) {
                return;
            }
            let isEditedBySomeone;
            await this.$firebase.db.fetchOnsiteReport(this.projectId, this.startDateOfThisTerm.format(this.ymdFormat), this.endDateOfThisTerm.format(this.ymdFormat))
                .then(fetchedReports => {
                // Check if the reports in this view are modified by other user or not
                isEditedBySomeone = !isEqual(this.reportsRaw, fetchedReports);
            });
            console.log(`isEditedBySomeone: ${isEditedBySomeone}`);
            if (isEditedBySomeone
                && !this.$bvModal.msgBoxConfirm("表示期間中の日報のいずれかが、別のユーザーによって変更されました。"
                    + "\n別のユーザーの変更が失われますが、続行しますか？"
                    + "\n(上書きを防ぐには、一度別のページに移動してから再度編集して下さい。)", { centered: true })) {
                return;
            }
            await this.$firebase.db.updateOnsiteReport(this.projectId, reportsToBeSaved)
                .then(() => {
                this.$firebase.db.fetchOnsiteReport(this.projectId, this.startDateOfThisTerm.format(this.ymdFormat), this.endDateOfThisTerm.format(this.ymdFormat))
                    .then(reports => {
                    this.reportsRaw = reports;
                });
                this.$set(this.$data, "reportsOrig", cloneDeep(this.reportsNew));
                this.$bvModal.msgBoxOk("保存が完了しました。", { centered: true });
            }).catch(error => this.$bvModal.msgBoxOk(`保存に失敗しました。\nError: ${JSON.stringify(error)}`, { centered: true }));
        },
        copy() {
            let countCopied = 0;
            let reportCopied;
            Object.keys(this.reportsNew).forEach(ymd => {
                Object.keys(this.reportsNew[ymd]).forEach(staffId => {
                    if (!this.reportsNew[ymd][staffId].selected)
                        return;
                    ++countCopied;
                    reportCopied = this.reportsNew[ymd][staffId];
                    reportCopied.selected = false;
                    console.log(`reportCopied: ${JSON.stringify(reportCopied)}`);
                });
            });
            if (countCopied > 1) {
                this.$bvModal.msgBoxOk("チェックボックスが複数選択されています。", { centered: true });
                return;
            }
            this.$store.commit("reportCopied", reportCopied);
        },
        paste() {
            const reportCopied = this.$store.getters.reportCopied;
            if (isEqual(reportCopied, {})) {
                this.$bvModal.msgBoxOk("先にコピーしてください。", { centered: true });
                return;
            }
            let countLocked = 0;
            Object.keys(this.reportsNew).forEach(ymd => {
                Object.keys(this.reportsNew[ymd]).forEach(staffId => {
                    if (!this.reportsNew[ymd][staffId].selected)
                        return;
                    const reportToBePasted = cloneDeep(reportCopied);
                    console.log(`reportCopied: ${JSON.stringify(reportCopied)}`);
                    if (this.reportsNew[ymd][staffId].isLocked === true) {
                        ++countLocked;
                        return;
                    }
                    reportToBePasted.isLocked = false;
                    this.$set(this.reportsNew[ymd], staffId, reportToBePasted);
                });
            });
            if (countLocked > 0)
                this.$bvModal.msgBoxOk(`${countLocked}件の貼り付け先はロックされていたため、貼り付けできませんでした。`, { centered: true });
        },
        lock(bool) {
            let count = 0;
            Object.keys(this.reportsNew).forEach(ymd => {
                Object.keys(this.reportsNew[ymd]).forEach(staffId => {
                    if (!this.reportsNew[ymd][staffId].selected)
                        return;
                    this.reportsNew[ymd][staffId].selected = false;
                    this.reportsNew[ymd][staffId].isLocked = bool;
                    delete this.reportsNew[ymd][staffId].lockedReason;
                    ++count;
                });
            });
            if (count === 0) {
                this.$bvModal.msgBoxOk("何も選択されていません。", { centered: true });
                return;
            }
        },
        fetchSelectedMonth(value) {
            this.$dayjs().year(value.year)
                .month(value.month)
                .end;
            if (num > 0) {
                console.log(`dateEnd: ${this.$dayjs(this.project.dateEnd).format(this.ymdFormat)}`);
                console.log(`startDateOfThisTerm: ${this.startDateOfThisTerm.add(num, 'month').format(this.ymdFormat)}`);
                if (this.$dayjs(this.project.dateEnd).isBefore(this.startDateOfThisTerm.add(num, 'month'))) {
                    this.$bvModal.msgBoxOk("該当の月は工期に含まれていません。", { centered: true });
                    return;
                }
            }
            else if (num < 0) {
                console.log(`dateStart: ${this.$dayjs(this.project.dateStart).format(this.ymdFormat)}`);
                console.log(`endDateOfThisTerm: ${this.endDateOfThisTerm.add(num, 'month').format(this.ymdFormat)}`);
                if (this.$dayjs(this.project.dateStart).isAfter(this.endDateOfThisTerm.add(num, 'month'))) {
                    this.$bvModal.msgBoxOk("該当の月は工期に含まれていません。", { centered: true });
                    return;
                }
            }
        },
        addMonth(num) {
            // Write a chart of startDateOfThisTerm/endDateOfThisTerm/dateStart/dateEnd in 6 patterns:
            //   1. dateStart < startDateOfThisTerm && dateEnd < startDateOfThisTerm
            //   2. dateStart < startDateOfThisTerm && startDateOfThisTerm =< dateEnd =< endDateOfThisTerm
            //   3. startDateOfThisTerm =< dateStart =< endDateOfThisTerm && startDateOfThisTerm =< dateEnd =< endDateOfThisTerm
            //   4. startDateOfThisTerm =< dateStart =< endDateOfThisTerm && dateEnd > endDateOfThisTerm
            //   5. endDateOfThisTerm < dateStart && endDateOfThisTerm < dateEnd
            //   6. dateStart < startDateOfThisTerm && startDateOfThisTerm < dateEnd
            // Now you know that pattern 1 and 5 are out of range, and only these two conditions below are necessary:
            if (num > 0) {
                if (this.$dayjs(this.project.dateEnd).isBefore(this.startDateOfThisTerm.add(num, 'month'))) {
                    this.$bvModal.msgBoxOk("該当の月は工期に含まれていません。", { centered: true });
                    return;
                }
            }
            else if (num < 0) {
                if (this.$dayjs(this.project.dateStart).isAfter(this.endDateOfThisTerm.add(num, 'month'))) {
                    this.$bvModal.msgBoxOk("該当の月は工期に含まれていません。", { centered: true });
                    return;
                }
            }
            const toMonth = this.$dayjs().month(this.month - 1)
                .year(this.year)
                .add(num, 'month')
                .format("YYYY-MM");
            this.$store.commit('monthSelected', toMonth);
            this.$router.push(`/onsite-report/${this.projectId}/${toMonth}`);
        },
        backToProjectList() {
            this.$router.push('/project-list');
        },
        dateEndOrUndetermined(dateEnd) {
            if (dateEnd.startsWith("9"))
                return "(未定)";
            return dateEnd;
        }
    },
    async beforeRouteLeave(to, from, next) {
        if (!isEqual(this.reportsOrig, this.reportsNew)
            && !await this.$bvModal.msgBoxConfirm("保存前のデータがあります。\n保存せずに別のページへ移動しますか？", { centered: true }))
            next(false);
        else
            next();
    },
    components: { BIconArrow90degUp }
}
</script>>
