<template>
  <b-container class="p-0 custom-width">
    <HeaderRow>予実管理</HeaderRow>
    <b-row>
      <b-col>
        <label>工事番号
          <b-spinner v-if=" ! isWorkIdSelectorReady" small variant="warning"></b-spinner>
        </label>
        <WorkIdSelector v-model="selectedWorkId" @input="setDate(true)" @ready="isWorkIdSelectorReady = $event"></WorkIdSelector>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col cols="auto">
        <label>期間を自動で指定</label>
        <b-checkbox switch v-model="isDurationAutoFilled" class="d-flex justify-content-center" @change="setDate"></b-checkbox>
      </b-col>
      <b-col>
        <label>開始月</label>
        <MonthPicker reset :disabled="isDurationAutoFilled" v-model="startAt"></MonthPicker>
      </b-col>
      <b-col>
        <label>終了月</label>
        <MonthPicker reset :disabled="isDurationAutoFilled" v-model="endAt"></MonthPicker>
      </b-col>
      <b-col cols="auto" class="calc-button">
        <b-button :disabled="selectedWorkId == null || isCalculating" size="sm" variant="primary" @click="startCalc">計算</b-button>
      </b-col>
    </b-row>
    <hr>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <div class="mandays-main mb-2">
            <div>総工数:</div>
            <div class="ml-4">
              工場製作 = <span class="in-house-box" style="font-size: 1.6em;">
                <template v-if="result != null">{{Math.ceil(result[displayedWorkId].$manDays)}}</template>
                <template v-else>XX</template>
              </span> 人工
            </div>
            <div class="ml-2">/</div>
            <div class="ml-2">
              現場 = <span class="on-site-box" style="font-size: 1.6em;">
                <template v-if="result != null && result[this.displayedWorkId].$onSiteManDays != null">
                  {{Math.ceil(result[displayedWorkId].$onSiteManDays)}}
                </template>
                <template v-else>XX</template>
              </span> 人工
            </div>
          </div>
          <div class="mandays-annotation">※現時刻時点で入力済みの日報をベースに算出。現場分の工数は含まない。</div>
          <hr>
          <p class="mandays-main mt-4">
            <a>現在の利益率:
              <span v-if="result == null">※未計算</span>
              <span v-else-if="profitRate == null">※売上が未入力のため計算できません</span>
              <span v-else-if="isNaN(profitRate)">※計算式に誤りがあります。システム管理社へご報告下さい。</span>
              <a v-else style="font-size: 1.6em;">{{Math.ceil(profitRate * 1000) / 10}}％ ({{profitBalance > 0 ? "+" : "-"}}¥{{ parseInt(profitBalance > 0 ? profitBalance : -profitBalance).toLocaleString() }})</a>
            </a>
          </p>
        </b-card>
      </b-col>
    </b-row>
    <hr>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <b-card-body class="per-work-wrapper">
            <b-overlay :show="isCalculating" class="spinner-container" spinner-type="grow" spinner-variant="warning">
              <canvas ref="chartPerWork" class="per-work-content"></canvas>
            </b-overlay>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="売上 - 全体" :disabled="result == null">
          <SalesAndExpensesTable
            :data="result && result[displayedWorkId] ? result[displayedWorkId].$sales : null"
            mode="sales"
            :categories="[...categorySales, ...categoryExpenses]"
          />
        </CardWithCollapse>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="経費 - 全体" :disabled="result == null">
          <SalesAndExpensesTable
            :data="result && result[displayedWorkId] ? result[displayedWorkId].$expenses : null"
            mode="expenses"
            :categories="[...categorySales, ...categoryExpenses]"
          />
        </CardWithCollapse>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <b-card-body class="per-unit-wrapper">
            <div ref="perUnitOrderBox">
              <div class="d-flex">
                <label class="mr-2">並び替え：</label>
                <b-radio-group v-model="perUnitSortKey" @change="reloadChartPerUnit">
                  <b-radio value="by-cost">支出の合計(人件費＋諸経費)順</b-radio>
                  <b-radio value="by-unit-name">ユニット/スキッド名順</b-radio>
                </b-radio-group>
              </div>
              <hr>
              <div class="d-flex">
                <div class="mr-2">「ユニット番号なし」のコストをそれ以外に分配する：</div>
                <b-checkbox switch size="lg" v-model="shouldWildcardDistributed" @change="reloadChartPerUnit"></b-checkbox>
              </div>
              <div class="ml-2 bold" style="color: red; font-size: 0.8em;">※「分配する」にした場合、現状では「人件費」のみ分配され「諸経費」は無視されます</div>
              <hr>
            </div>
            <b-overlay :show="isCalculating" class="per-unit-box" spinner-type="grow" spinner-variant="warning">
              <canvas ref="chartPerUnit" class="per-unit-content"></canvas>
            </b-overlay>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="経費 - ユニット別" :disabled="result == null">
          <b-row>
            <b-col cols="auto" class="align-self-center">
              <label>ユニット名を選択：</label>
            </b-col>
            <b-col>
              <b-select size="sm" class="my-3" v-model="perUnitExpenseTable.selectedUnitId" @change="setUnitData">
                <template v-if="result != null">
                  <template v-for="(unitId, index) in Object.keys(result[displayedWorkId].perUnit).filter(key => ! key.startsWith('$'))">
                    <b-select-option :key="`${unitId}/${index}`" :value="unitId">{{unitId === '*' ? '(ユニット番号なし)' : unitId}}</b-select-option>
                  </template>
                </template>
              </b-select>
            </b-col>
          </b-row>
          <SalesAndExpensesTable
            :data="perUnitExpenseTable.selectedUnitData"
            mode="expenses"
            :categories="[...categorySales, ...categoryExpenses]"
          />
        </CardWithCollapse>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="DB原価計算" :disabled="result == null">
         <b-card class="my-2 conditions-container">
            <label>- 絞り込み条件 - <span class="remarks-for-condition">&nbsp;&nbsp;※ctrlを押しながらクリックで複数選択可</span></label>
            <b-container>
              <b-row class="mt-2 align-items-center">
                <b-col cols="3">
                  <label>ユニット番号</label>
                </b-col>
                <b-col>
                  <b-select :disabled=" ! workIds[selectedWorkId]" multiple size="sm" v-model="dbCalcTable.selectedUnitId">
                    <b-select-option class="reset-option" :value="null" @click="dbCalcTable.selectedUnitId = []">(ここをクリックすると選択を全て解除)</b-select-option>
                    <template v-if="workIds[selectedWorkId] != null && workIds[selectedWorkId].unitIds != null">
                      <b-select-option
                        v-for="(unitId, index) in workIds[selectedWorkId].unitIds"
                        :key="`${unitId}/${index}`"
                        :value="unitId"
                      >{{ unitId }}</b-select-option>
                    </template>
                    <b-select-option value="*">(ユニット番号なし)</b-select-option>
                  </b-select>
                </b-col>
              </b-row>
              <b-row class="mt-2 align-items-center">
                <b-col cols="3">
                  <label>材質</label>
                </b-col>
                <b-col>
                  <b-select :disabled="materialTypeOptions == []" multiple size="sm" v-model="dbCalcTable.selectedMaterialType">
                    <b-select-option class="reset-option" :value="null" @click="dbCalcTable.selectedMaterialType = []">(ここをクリックすると選択を全て解除)</b-select-option>
                    <b-select-option
                      v-for="materialType in dedupedOptions('materialType')"
                      :key="materialType"
                      :value="materialType"
                    >{{ materialType | processAndMaterialTranslator(materialTypeOptions)}}</b-select-option>
                  </b-select>
                </b-col>
              </b-row>
            </b-container>
          </b-card>
          <b-table
            v-if="result != null"
            small
            bordered
            striped
            head-variant="dark"
            sticky-header="400"
            show-empty
            empty-text="該当するデータがありません"
            empty-filtered-text="該当するデータがありません"
            :items="result[displayedWorkId].$basisForDbCalc"
            :fields="dbCalcTable.fieldDefinition"
            :filter="[dbCalcTable.selectedUnitId, dbCalcTable.selectedMaterialType]"
            :filter-function="dbCalcTableFilter"
          >
            <template #cell(unitId)="data">
              {{data.value === '*' ? '(ユニット番号なし)' : data.value}}
            </template>
            <template #cell(materialType)="data">
              {{data.value === 'none' ? '-' : data.value | processAndMaterialTranslator(materialTypeOptions)}}
            </template>
            <template #cell(laborCost)="data">
              {{data.value | amountTranslator }}
            </template>
            <template #cell(estimatedDb)="data">
              <b-input :disabled="dbCalcTable.selectedUnitId.length !== 1" type="number" number :min="0" v-model="data.item.estimatedDb"></b-input>
            </template>
            <template #cell(estimatedUnitPrice)="data">
              <b-input :disabled="dbCalcTable.selectedUnitId.length !== 1" type="number" number :min="0" :value="data.item.estimatedUnitPrice" @input="data.item.estimatedUnitPrice = data.item.estimatedUnitPrice < 0 ? 0 : data.item.estimatedUnitPrice"></b-input>
            </template>
            <template #cell(resultedUnitPrice)="data">
              <p class="m-0" v-html="calclatedUnitPriceHtml(data.item.laborCost, data.item.estimatedDb)"></p>
            </template>
          </b-table>
          <div class="w-100 text-right">
            <b-spinner v-if="isSavingDbInfo" class="mr-2"></b-spinner>
            <b-button :disabled="isSavingDbInfo" variant="warning" @click="saveDbInfo">DBデータを保存</b-button>
          </div>
        </CardWithCollapse>
      </b-col>
    </b-row>
    <hr>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="工程別分析" :disabled="result == null">
          <b-card class="my-2 conditions-container">
            <label>- 絞り込み条件 -</label>
            <b-container>
              <b-row class="mt-2 align-items-center">
                <b-col cols="3">
                  <label>ユニット番号</label>
                </b-col>
                <b-col>
                  <b-select :disabled=" ! workIds[selectedWorkId]" size="sm" v-model="byProcessTable.selectedUnitId">
                    <b-select-option :value="null"></b-select-option>
                    <template v-if="workIds[selectedWorkId] != null && workIds[selectedWorkId].unitIds != null">
                      <b-select-option value="*">(ユニット番号なし)</b-select-option>
                      <b-select-option
                        v-for="(unitId, index) in workIds[selectedWorkId].unitIds"
                        :key="`${unitId}/${index}`"
                        :value="unitId"
                      >{{ unitId }}</b-select-option>
                    </template>
                  </b-select>
                </b-col>
              </b-row>
              <b-row class="mt-2 align-items-center">
                <b-col cols="3">
                  <label>工程</label>
                </b-col>
                <b-col>
                  <b-select :disabled="processTypeOptions == []" size="sm" v-model="byProcessTable.selectedProcessType">
                    <b-select-option :value="null"></b-select-option>
                    <b-select-option
                      v-for="processType in dedupedOptions('processType')"
                      :key="processType"
                      :value="processType"
                    >{{ processType | processAndMaterialTranslator(processTypeOptions) }}</b-select-option>
                  </b-select>
                </b-col>
              </b-row>
              <b-row class="mt-2 align-items-center">
                <b-col cols="3">
                  <label>材質</label>
                </b-col>
                <b-col>
                  <b-select :disabled="materialTypeOptions == []" size="sm" v-model="byProcessTable.selectedMaterialType">
                    <b-select-option :value="null"></b-select-option>
                    <b-select-option
                      v-for="materialType in dedupedOptions('materialType')"
                      :key="materialType"
                      :value="materialType"
                    >{{ materialType | processAndMaterialTranslator(materialTypeOptions)}}</b-select-option>
                  </b-select>
                </b-col>
              </b-row>
            </b-container>
          </b-card>

          <!--
            in <b-table> below, value of ":filter" need to be re-evaluated
            on condition changed, to trigger filtering
          -->
          <b-table
            v-if="result != null"
            small
            bordered
            striped
            table-variant="success"
            head-variant="dark"
            sticky-header="400"
            show-empty
            empty-text="該当するデータがありません"
            empty-filtered-text="該当するデータがありません"
            :items="result[displayedWorkId].$byProcess"
            :fields="byProcessTable.fieldDefinition"
            :filter="[byProcessTable.selectedUnitId, byProcessTable.selectedProcessType, byProcessTable.selectedMaterialType]"
            :filter-function="byProcessTableFilter"
          >
            <template #cell(unitId)="data">
              {{data.item.unitId === '*' ? '(ユニット番号なし)' : data.item.unitId}}
            </template>
            <template #cell(processType)="data">
              {{data.item.processType | processAndMaterialTranslator(processTypeOptions)}}
            </template>
            <template #cell(materialType)="data">
              {{data.item.materialType === 'none' ? '-' : data.item.materialType | processAndMaterialTranslator(materialTypeOptions)}}
            </template>
          </b-table>
        </CardWithCollapse>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="「その他」の工程の詳細" :disabled="result == null">
          <div v-if="result != null">
            <div v-if="result[displayedWorkId].$miscs != null">
              <table class="miscs-counts-table my-2 w-100">
                <tr>
                  <td class="text-right">入力件数 合計：</td>
                  <td>{{result[displayedWorkId].$miscs.length}} 件</td>
                  <td class="text-right">作業時間 合計：</td>
                  <td>{{result[displayedWorkId].$miscs.reduce((sum, v) => sum + v.duration , 0)}} 時間</td>
                </tr>
              </table>
              <b-table
                v-if="result != null"
                small
                bordered
                striped
                table-variant="warning"
                head-variant="dark"
                sticky-header="400"
                show-empty
                empty-text="該当するデータがありません"
                empty-filtered-text="該当するデータがありません"
                :items="result[displayedWorkId].$miscs"
                :fields="miscsTable.fieldDefinition"
              >
                <template #cell(unitId)="data">
                  {{data.item.unitId === '*' ? '(ユニット番号なし)' : data.item.unitId}}
                </template>
              </b-table>
            </div>
            <div v-else>
              <div class="text-center bg-light">※「その他」で入力された項目がありません。</div>
            </div>
          </div>
        </CardWithCollapse>
      </b-col>
    </b-row>
    <hr>
    <b-row class="mt-3">
      <b-col>
        <CardWithCollapse title="稼働時間カレンダー">
          <div><strong>※「工数合計」以外の数字の単位は、「工数」ではなく「時間」です。</strong></div>
          <b-table-simple v-if="Object.keys(scheduleHistory).length > 0" bordered small sticky-header="800px">
            <b-thead>
              <b-tr variant="warning">
                <b-th sticky-column>工数合計▶</b-th>
                <template v-for="date in Object.keys(Object.values(scheduleHistory)[0])">
                  <b-th :key="`header_${date}`">{{Math.floor(Object.values(scheduleHistory).reduce((p, c) => p += c[date], 0)/7, 0)}}</b-th>
                </template>
              </b-tr>
              <b-tr variant="info">
                <b-th sticky-column>▼氏名\日付▶</b-th>
                <template v-for="(date, index) in Object.keys(Object.values(scheduleHistory)[0])">
                  <b-th :key="`header_${date}`" class="text-center" v-html="index === 0 ? date : $dayjs(date).format('YYYY<br>MM<br>DD<br>(ddd)')"></b-th>
                </template>
              </b-tr>
            </b-thead>
            <b-tbody>
              <template v-for="name in Object.keys(scheduleHistory)">
                <b-tr :key="`row-${name}`">
                  <b-th sticky-column variant="primary" class="text-nowrap">{{name}}</b-th>
                  <template v-for="date in Object.keys(scheduleHistory[name])">
                    <b-td :key="`${name}__${date}`" class="text-center" :style="scheduleHistory[name][date] == 0 ? `color: white;` : `background-color: lightgreen;`">{{scheduleHistory[name][date]}}</b-td>
                  </template>
                </b-tr>
              </template>
            </b-tbody>
          </b-table-simple>
        </CardWithCollapse>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
.ct-barlabel {
  font-size: 0.6em;
}
.calc-button {
  align-self: flex-end;
}
.mandays-main {
  display: inline-flex;
  align-items: baseline;
}
.in-house-box {
  border-bottom: 5px solid var(--warning);
  padding: 0 2px;
}
.on-site-box {
  border-bottom: 5px solid var(--danger);
  padding: 0 2px;
}
.mandays-annotation {
  color: lightgray;
  font-size: 0.7em;
}
.spinner-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.per-work-wrapper {
  width: 100%;
  height: 150px;
  box-sizing: content-box;
  padding: 0;
}
.per-work-content {
  width: 100%;
  height: 150px;
}
.per-unit-wrapper {
  position: relative;
  height: 600px;
  width: 100%;
  box-sizing: content-box;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.per-unit-box {
  position: relative;
  overflow-x: scroll;
  overflow-y: hidden;
  height: 100%;
}
.per-unit-content {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.conditions-container {
  background: whitesmoke;
}
.remarks-for-condition {
  font-size: 0.85em;
  color: cornflowerblue;
}
.reset-option {
  color: lightgray;
}
.miscs-counts-table {
  height: 2.5em;
}
.miscs-counts-table td {
  border: 1px solid white;
  background: #e9d43e9e;
}
.miscs-counts-table td:nth-child(odd) {
  background: #e9d43e;
}
</style>

<script>
import MonthPicker from '@/components/month-picker.vue'
import CardWithCollapse from '@/components/card-with-collapse.vue'
import SalesAndExpensesTable from '@/components/sales-and-expenses-table.vue'
import WorkIdSelector from '@/components/work-id-selector.vue'

import analysis from '@/js/analysis/index.js'
import salesAndExpensesFilterMixin from '@/mixins/sales-and-expenses-filters.js'
import processAndMaterialFilterMixin from '@/mixins/process-and-material-filters.js'

import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'
Chart.register(...registerables, ChartDataLabels)

export default {
  mixins: [
    salesAndExpensesFilterMixin,
    processAndMaterialFilterMixin
  ],
  created() {
    const promise1 = this.$firebase.db.fetchTypeOptions()
    .then(data => {
      const salesAndExpenses = data.salesAndExpenses
      this.categorySales = salesAndExpenses[0].options
      this.categoryExpenses = salesAndExpenses[1].options

      const process = data.process
      this.processTypeOptions = [...(process.reduce((prev, current) => {
        prev.push(...current.options)
        return prev
      },[]))]

      const material = data.material
      this.materialTypeOptions = [
        ...material[0].options.map(option => {
          option.text = material[0].label + ' - ' + option.text
          return option
        }),
        ...material[1].options.map(option => {
          option.text = material[1].label + ' - ' + option.text
          return option
        }),
        ...material[2].options.map(option => {
          option.text = material[2].label + ' - ' + option.text
          return option
        })
      ]
    })

    const promise2 = this.$firebase.db.fetchWorkId().then(workIds => {
      Object.keys(workIds).forEach(workId => {
        this.workIds[workId] = workIds[workId]
      })
    })

    Promise.all([promise1, promise2]).then(() => {
      this.isWorkIdsFetched = true
    })
  },
  components: {
    MonthPicker,
    CardWithCollapse,
    SalesAndExpensesTable,
    WorkIdSelector,
  },
  data() {
    return {
      isWorkIdSelectorReady: false,
      isWorkIdsFetched: false,
      isDurationAutoFilled: true,
      isCalculating: false,
      categorySales: [],
      categoryExpenses: [],
      processTypeOptions: [],
      materialTypeOptions: [],
      workIds: {},
      scheduleHistory: {},
      selectedWorkId: null,
      displayedWorkId: null,
      startAt: null,
      endAt: null,
      result: null,
      profitBalance: 0,
      profitRate: 0,
      chartPerWork: null,
      chartPerUnit: null,
      shouldWildcardDistributed: true,
      perUnitSortKey: 'by-cost',
      perUnitExpenseTable: {
        selectedUnitId: null,
        selectedUnitData: [],
      },
      isSavingDbInfo: false,
      dbCalcTable: {
        selectedUnitId: [],
        selectedMaterialType: [],
        fieldDefinition: [
          {
            key: 'unitId',
            label: 'ユニット番号',
            sortable: true,
          },
          {
            key: 'materialType',
            label: '材質',
            sortable: true,
          },
          {
            key: 'duration',
            label: '稼働時間',
            sortable: true,
          },
          {
            key: 'laborCost',
            label: '人件費',
            sortable: true,
          },
          {
            key: 'estimatedDb',
            label: 'D/B(見積)',
          },
          {
            key: 'estimatedUnitPrice',
            label: '単価(見積)',
          },
          {
            key: 'resultedUnitPrice',
            label: '単価(実績)',
          },
        ]
      },
      byProcessTable: {
        selectedUnitId: null,
        selectedProcessType: null,
        selectedMaterialType: null,
        fieldDefinition: [
          {
            key: 'unitId',
            label: 'ユニット番号',
            sortable: true,
          },
          {
            key: 'processType',
            label: '工程',
            sortable: true,
          },
          {
            key: 'materialType',
            label: '材質',
            sortable: true,
          },
          {
            key: 'duration',
            label: '稼働時間',
            sortable: true,
          },
        ]
      },
      miscsTable: {
        fieldDefinition: [
          {
            key: 'name',
            label: '氏名',
            sortable: true,
          },
          {
            key: 'date',
            label: '入力日付',
            sortable: true,
          },
          {
            key: 'unitId',
            label: 'ユニット番号',
            sortable: true,
          },
          {
            key: 'detail',
            label: '詳細',
            sortable: true,
          },
          {
            key: 'duration',
            label: '作業時間',
            sortable: true,
          },
        ]
      }
    }
  },
  computed: {
    dedupedOptions: function() {
      return function(propertyName) {
        if(this.result == null || this.result[this.displayedWorkId] == null)
          return []

        let materialTypeValuesOnly = []
        if(propertyName === 'materialType') {
          materialTypeValuesOnly = this.materialTypeOptions.map(option => option.value)
          materialTypeValuesOnly.push('none')
        }
        let processTypeValuesOnly = []
        if(propertyName === 'processType') {
          processTypeValuesOnly = this.processTypeOptions.map(option => option.value)
          processTypeValuesOnly.push('none')
        }
        const entries = this.result[this.displayedWorkId].$byProcess ?? []
        return [...new Set(entries.map(entry => entry[propertyName]))].sort((a,b) => {
          if(propertyName === 'processType') {
            return processTypeValuesOnly.indexOf(a) > processTypeValuesOnly.indexOf(b) ? 1 : -1
          }
          if(propertyName === 'materialType') {
            return materialTypeValuesOnly.indexOf(a) > materialTypeValuesOnly.indexOf(b) ? 1 : -1
          }
          return a > b ? 1 : -1
        })
      }
    },
    dbCalcTableFilter() {
      const vm = this
      return function(itemOrig, filter) {
        if(vm.dbCalcTable.selectedUnitId.length > 0 && ! vm.dbCalcTable.selectedUnitId.includes(itemOrig.unitId)) {
          return false
        }
        if(vm.dbCalcTable.selectedMaterialType.length > 0 && ! vm.dbCalcTable.selectedMaterialType.includes(itemOrig.materialType)) {
          return false
        }
        return true
      }
    },
    byProcessTableFilter() {
      const vm = this
      return function(itemOrig, filter) {
        if( vm.byProcessTable.selectedUnitId != null
            && itemOrig.unitId !== vm.byProcessTable.selectedUnitId) {
          return false
        }
        if(vm.byProcessTable.selectedProcessType != null
            && itemOrig.processType !== vm.byProcessTable.selectedProcessType) {
          return false
        }
        if(vm.byProcessTable.selectedMaterialType != null
            && itemOrig.materialType !== vm.byProcessTable.selectedMaterialType) {
          return false
        }
        return true
      }
    },
    calclatedUnitPriceHtml() {
      return function(laborCost, estimatedDb) {
        if(estimatedDb <= 0)
          return '<span style="color: chartreuse;font-size: 0.9em;">※D/B未入力</span>'
        return `¥${Math.floor(laborCost / estimatedDb).toLocaleString()}`
      }
    }
  },
  methods: {
    setDate(isDurationAutoFilled) {
      if(this.selectedWorkId == null) return
      const work = this.workIds[this.selectedWorkId]
      // Assign startAt and endAt
      this.startAt = work.startAt ? work.startAt.split('/').slice(0,2).join('-') : null
      this.endAt = work.endAt ? work.endAt.split('/').slice(0,2).join('-') : null
      if(isDurationAutoFilled != null)
        this.isDurationAutoFilled = isDurationAutoFilled
    },
    setUnitData() {
      this.perUnitExpenseTable.selectedUnitData = this.result[this.displayedWorkId].perUnit[this.perUnitExpenseTable.selectedUnitId].$expenses
    },
    saveDbInfo() {
      this.isSavingDbInfo = true
      const promiseList = []

      this.result[this.displayedWorkId].$basisForDbCalc?.forEach(entry => {
        const estimatedDb = entry.estimatedDb > 0 ? entry.estimatedDb : null 
        const estimatedUnitPrice = entry.estimatedUnitPrice > 0 ? entry.estimatedUnitPrice : null 
        if(estimatedDb == null && estimatedUnitPrice == null) return

        const workId = this.displayedWorkId
        const unitId = entry.unitId
        const materialType = entry.materialType
        const data = this.workIds?.[workId]?.dbData?.[unitId]?.[materialType] ?? {}
        if(data.estimatedDb === estimatedDb && data.estimatedUnitPrice === estimatedUnitPrice) return

        const promise = this.$firebase.db.updateDbData(workId, unitId, materialType, estimatedDb, estimatedUnitPrice)
        .then(result => {
          console.log(`updated: workId="${workId}", unitId="${unitId}", materialType="${materialType}", {estimatedDb: ${estimatedDb}, estimatedUnitPrice: ${estimatedUnitPrice}}`);
        })
        promiseList.push(promise)
      });

      if(promiseList.length <= 0) {
        this.isSavingDbInfo = false
        alert(`警告：更新するべき箇所が見当たりませんでした。`)
        return
      }
      Promise.all(promiseList).then(() => {
        alert(`DB情報の更新が完了しました。`)
      }).finally(() => {
        this.isSavingDbInfo = false
      })
    },
    async startCalc() {
      this.startAt = this.startAt != null ? this.$dayjs(this.startAt).startOf('month').format("YYYY-MM-DD") : this.startAt
      this.endAt = this.endAt != null ? this.$dayjs(this.endAt).endOf('month').format("YYYY-MM-DD") : this.$dayjs().format("YYYY-MM-DD")
      if(this.startAt != null && this.endAt != null && this.startAt > this.endAt) {
        console.log(`this.startAt: ${this.startAt}, this.endAt: ${this.endAt}`);
        return alert('エラー：終了月が開始日より前の月になっています。')
      }
        
      this.isCalculating = true

      this.result = null
      this.displayedWorkId = this.selectedWorkId

      performance.mark("1")
      console.log(`1. Start calculating "Sales and Expenses"...`);
      this.result = await analysis.calcCostPerWork([this.displayedWorkId], this.startAt, this.endAt)
      console.log(`2. Finished calculating "Sales and Expenses"...`);
      performance.mark("2")

      if(this.result?.isNoReportFound) {
        this.result = null
        this.$bvModal.msgBoxOk("エラー：選択された期間では、日報が1件も入力されていません。", {centered:true})
      } else {
        await Promise.all([
          this.renderChartPerWork(),
          this.renderChartPerUnit(),
          this.buildScheduleHistory(),
        ]).then(() => {
          performance.mark("3")
          console.log(`3. Finished all the promise.`);
        })
      }
      
      this.isCalculating = false
      performance.mark("4")
      console.log(`4. Finished Everything !!!`);
      console.log(`1to2:${performance.measure("1", "2").duration}`);
      console.log(`2to3:${performance.measure("2", "3").duration}`);
      console.log(`3to4:${performance.measure("3", "4").duration}`);
    },
    async renderChartPerWork() {
      const resultPerWork = this.result[this.displayedWorkId]
      const labelsPerWork = [this.displayedWorkId]
      const seriesLaborCostPerWork = [resultPerWork.$laborCost]
      const seriesOnSiteLaborCostPerWork = resultPerWork?.$onSiteLaborCost ? [resultPerWork?.$onSiteLaborCost] : [0]
      const seriesExpensesPerWork = [
        resultPerWork?.$expenses
          .map(exp => parseInt(exp.weightedAmount ?? exp.amount))
          .reduce((sum, val) => (sum + val), 0)
          ?? 0
      ]
      const seriesSalesPerWork = [
        resultPerWork?.$sales
          .map(exp => parseInt(exp.weightedAmount ?? exp.amount))
          .reduce((sum, val) => (sum + val), 0)
          ?? 0
      ]

      this.profitBalance = seriesSalesPerWork > 0
        ? seriesSalesPerWork[0] - ( seriesLaborCostPerWork[0] + seriesExpensesPerWork[0] + seriesOnSiteLaborCostPerWork[0])
        : null
      this.profitRate = seriesSalesPerWork > 0 && this.profitBalance != null
        ? this.profitBalance / seriesSalesPerWork[0]
        : null

      if(this.chartPerWork != null)
        this.chartPerWork.destroy()

      this.chartPerWork = new Chart(this.$refs.chartPerWork.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labelsPerWork,
          datasets: [
            {
              label: '売上',
              data: seriesSalesPerWork,
              stack: 'Stack 0',              
              backgroundColor: '#65ACE4AA'
            },
            {
              label: '人件費(工場内作分)',
              data: seriesLaborCostPerWork,
              stack: 'Stack 1',
              backgroundColor: '#F2CF01AA'
            },
            {
              label: '諸経費',
              data: seriesExpensesPerWork,
              stack: 'Stack 1',
              backgroundColor: '#C93A40AA'
            },
            {
              label: '人件費(現場分)',
              data: seriesOnSiteLaborCostPerWork,
              stack: 'Stack 1',
              backgroundColor: '#3ac971aa'
            },
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (val, index) => {
                  return `${Math.floor(parseInt(val) / 10000)}万`
                }
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: '>> 工事番号全体',
              align: 'start'
            },
            legend: {
              align: 'start'
            },
            datalabels: {
              formatter: (value, context) => {
                return parseInt(value) != 0 && ! isNaN(parseInt(value))
                  ? `${Math.floor(parseInt(value)/10000)}万`
                  : ""
              },
            }
          },
          animation: {
            onProgress: () => {
              seriesOnSiteLaborCostPerWork.forEach((data, index) => {
                const total = Math.floor((data + seriesLaborCostPerWork[index] + seriesExpensesPerWork[index]) / 10000) ?? ''
                const totalString = total ? `${total}万` : ''
                const meta = this.chartPerWork.getDatasetMeta(3)
                const posX = meta.data[index].x + 4
                const posY = meta.data[index].y + 4
                this.chartPerWork.ctx.fillStyle = "#777777"
                this.chartPerWork.ctx.fillText(totalString, posX, posY)
              }, this);
            }
          }
        }
      });

      this.chartPerWork.resize()
    },
    async renderChartPerUnit() {
      const notAssociatedToAnyUnitLabel = '(ユニット番号なし)'
      let labelsPerUnit = []
      let seriesLaborCostPerUnit = []
      let seriesExpensesPerUnit = []
      let seriesSalesPerUnit = []
      const sumsOfLaborCostAndExpenses = []

      Object.entries(this.result[this.displayedWorkId].perUnit)
      .sort((a, b) => a[0] > b[0])
      .forEach(([unitId, data]) => {
        if(unitId === '*') {
          if(this.shouldWildcardDistributed) {
            return
          }
          unitId = notAssociatedToAnyUnitLabel
        }
        labelsPerUnit.push(unitId)
        seriesLaborCostPerUnit.push((this.shouldWildcardDistributed ? data.$laborCostWithDistributed : data.$laborCost) ?? 0)

        const expense = data?.$expenses
        .map(exp => parseInt(exp.weightedAmount ?? exp.amount))
        .reduce((sum, val) => (sum + val), 0)
        ?? 0
        seriesExpensesPerUnit.push(expense)
        sumsOfLaborCostAndExpenses.push(expense + ((this.shouldWildcardDistributed ? data.$laborCostWithDistributed : data.$laborCost) ?? 0))

        const sale = data?.$sales
        .map(exp => parseInt(exp.weightedAmount ?? exp.amount))
        .reduce((sum, val) => (sum + val), 0)
        ?? 0
        seriesSalesPerUnit.push(sale)
      });

      if(this.perUnitSortKey === "by-unit-name") {

        const indicies = Array.from(labelsPerUnit.keys())
        .sort((a, b) => 
          labelsPerUnit[a] === notAssociatedToAnyUnitLabel ? -1
          : labelsPerUnit[b] === notAssociatedToAnyUnitLabel ? 1
          : labelsPerUnit[a] === labelsPerUnit[b] ? 0
          : labelsPerUnit[a] > labelsPerUnit[b] ? 1 : -1
        )

        labelsPerUnit = indicies.map(i => labelsPerUnit[i])
        seriesLaborCostPerUnit = indicies.map(i => seriesLaborCostPerUnit[i])
        seriesExpensesPerUnit = indicies.map(i => seriesExpensesPerUnit[i])
        seriesSalesPerUnit = indicies.map(i => seriesSalesPerUnit[i])

      } else if(this.perUnitSortKey === 'by-cost') {

        const indicies = Array.from(sumsOfLaborCostAndExpenses.keys())
        .sort((a,b) =>
          sumsOfLaborCostAndExpenses[b] == null ? -1
          : sumsOfLaborCostAndExpenses[a] == null ? 1
          : sumsOfLaborCostAndExpenses[b] - sumsOfLaborCostAndExpenses[a]
        )
        
        labelsPerUnit = indicies.map(i => labelsPerUnit[i])
        seriesLaborCostPerUnit = indicies.map(i => seriesLaborCostPerUnit[i])
        seriesExpensesPerUnit = indicies.map(i => seriesExpensesPerUnit[i])
        seriesSalesPerUnit = indicies.map(i => seriesSalesPerUnit[i])
      }

      // Render charts
      if(this.chartPerUnit != null)
        this.chartPerUnit.destroy()

      this.chartPerUnit = new Chart(this.$refs.chartPerUnit.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labelsPerUnit,
          datasets: [
            {
              label: '売上',
              data: seriesSalesPerUnit,
              stack: 'Stack 0',              
              backgroundColor: '#65ACE4AA'
            },
            {
              label: '人件費',
              data: seriesLaborCostPerUnit,
              stack: 'Stack 1',
              backgroundColor: '#F2CF01AA'
            },
            {
              label: '諸経費',
              data: seriesExpensesPerUnit,
              stack: 'Stack 1',
              backgroundColor: '#C93A40AA'
            },
          ]
        },
        options: {
          barThickness: 30,
          responsive: false,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val, index) => {
                  return `${Math.floor(parseInt(val) / 10000)}万`
                }
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: '>> ユニット/スキッド別',
              align: 'start'
            },
            legend: {
              align: 'start'
            },
            datalabels: {
              formatter: (value, context) => {
                return parseInt(value) != 0 && ! isNaN(parseInt(value))
                  ? `${Math.floor(parseInt(value)/10000)}万`
                  : ''
              }
            }
          },
          animation: {
            onProgress: () => {
              seriesExpensesPerUnit.forEach((data, index) => {
                const total = Math.floor((data + seriesLaborCostPerUnit[index]) / 10000)
                const totalString = total ? `${total}万` : ''
                const meta = this.chartPerUnit.getDatasetMeta(2)
                const posX = meta.data[index].x - 8
                const posY = meta.data[index].y - 10

                this.chartPerUnit.ctx.fillStyle = "#777777"
                this.chartPerUnit.ctx.fillText(totalString, posX, posY)
              }, this);
            }
          }
        }
      });

      const height = 600 - this.$refs.perUnitOrderBox.clientHeight - 20
      const width = labelsPerUnit.length * 70 + 100*2
      this.chartPerUnit.resize(width, height)
    },
    async buildScheduleHistory() {
      const result = {}
      this.scheduleHistory = {}

      const data = await this.$firebase.db.fetchInhouseReport(false, this.startAt, this.endAt, null, true) ?? {}
      Object.values(data).forEach(v => {
        v.date = v.date.replace(/\//g, "-")
        const works = v?.works?.[this.selectedWorkId]
        if(works == null) {return}

        let duration = this.$dayjs.duration(0)
        Object.values(works).forEach(work => {
          const timeArray = work.duration.split(":").map(t => parseInt(t))
          duration = duration.add(timeArray[0], "h").add(timeArray[1], "m")
        })

        const hours = duration.asHours()
        if(hours == null || hours <= 0) {return}

        if(result?.[v.date] == null) {
          result[v.date] = {}
        }

        result[v.date][v.name.replace(/ |　|・/g, "")] = hours
      })
      
      const dateArray = Object.keys(result)
      let nameArrayUnsorted = Object.values(result).reduce((p, c) => {
        Object.keys(c).forEach(name => p.push(name))
        return p
      }, [])
      nameArrayUnsorted = Array.from(new Set(nameArrayUnsorted))

      const nameArraySorted = nameArrayUnsorted.map(name => {
        let total = 0
        dateArray.forEach(date => {
          total += result[date]?.[name] ?? 0
        })
        return [name, total]
      }).sort((a,b) => b[1] - a[1])
      
      nameArraySorted.forEach(([name, total]) => {
        this.scheduleHistory[name] = this.scheduleHistory[name] ?? {}
        this.scheduleHistory[name]["合計"] = total
        dateArray.forEach(date => {
          this.scheduleHistory[name][date] = result[date]?.[name] ?? 0
        })
      })
    },
    async reloadChartPerUnit() {
      if(this.result == null) return
      this.isCalculating = true
      await this.renderChartPerUnit()
      this.isCalculating = false
    },
  }
}
</script>