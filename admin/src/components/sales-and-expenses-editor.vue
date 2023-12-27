<template>
<div>
  <b-row class="mt-3">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>登録者氏名<RequiredMark/></label>
    </b-col>
    <b-col>
      <b-input type="text" v-model="newData.staffName"></b-input>
      <ErrorMeesage v-if=" ! $v.newData.staffName.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>種別<RequiredMark/></label>
    </b-col>
    <b-col>
      <b-select v-model="newData.category" @blur="$v.newData.category.$touch" tabindex="0">
        <template v-if="isTypeOptionsFetched">
          <b-select-option-group label="-- 売上 --">
            <template v-for="entry in categorySales">
              <b-select-option :key="entry.value" :value="entry.value">{{entry.text}}</b-select-option>
            </template>
          </b-select-option-group>
          <b-select-option-group label="-- 支出 --">
            <template v-for="entry in categoryExpenses">
              <b-select-option :key="entry.value" :value="entry.value">{{entry.text}}</b-select-option>
            </template>
          </b-select-option-group>
        </template>
      </b-select>
      <ErrorMeesage v-if=" ! $v.newData.category.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>見積or実績<RequiredMark/></label>
    </b-col>
    <b-col class="d-flex justify-content-start">
      <b-radio-group v-model="newData.forecastStatus">
        <b-radio value="estimation">見積</b-radio>
        <b-radio class="ml-2" value="result">実績</b-radio>
      </b-radio-group>
      <ErrorMeesage v-if=" ! $v.newData.forecastStatus.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>概要<RequiredMark/></label>
    </b-col>
    <b-col>
      <b-input type="text" v-model="newData.description"></b-input>
      <ErrorMeesage v-if=" ! $v.newData.description.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>備考</label>
    </b-col>
    <b-col>
      <b-input type="text" v-model="newData.remarks"></b-input>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>金額<span class="font-weight-bold" style="color: blue;">(税別)</span><RequiredMark/></label>
    </b-col>
    <b-col>
      <b-input :formatter="$options.filters.amountTranslator" v-model="newData.amount" @change="newData.amount = $options.filters.amountTranslator(newData.amount)"></b-input>
      <ErrorMeesage v-if=" ! $v.newData.amount.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>工事番号</label>
    </b-col>
    <b-col>
      <WorkIdSelector :class="{'null-selection': newData.workId == null}" :value="newData.workId" @input="onWorkIdChanged($event)"></WorkIdSelector>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>ユニット番号</label>
    </b-col>
    <b-col>
      <b-select :disabled=" ! isWorkIdFetched || newData.workId == null" v-model="newData.unitId">
        <template v-if="newData.workId != null && workIds[newData.workId] != null">
          <b-select-option :value="null">{{ workIds[newData.workId].unitIds == null || workIds[newData.workId].unitIds.length === 0 ? "(該当なし)" : ''}}</b-select-option>
          <template v-for="unitId in workIds[newData.workId].unitIds">
            <b-select-option :key="unitId" :value="unitId">{{unitId}}</b-select-option>
          </template>
        </template>
      </b-select>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>月度</label>
    </b-col>
    <b-col>
      <b-select v-model="newData.month" :state="$v.newData.month.required ? null : false" :class="{'null-selection': newData.month == null}">
        <b-select-option class="null-selection" :value="null">(選択なし)</b-select-option>
        <template v-for="month in months">
          <b-select-option :key="month" class="non-null-selection" :value="month">{{month | monthTranslator}}</b-select-option>
        </template>
      </b-select>
      <ErrorMeesage v-if=" ! $v.newData.month.required">※選択した「種別」で必須の項目です。</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-2">
    <b-col cols="3" class="d-flex justify-content-end">
      <label>拠点<RequiredMark/></label>
    </b-col>
    <b-col class="d-flex justify-content-start">
      <b-radio-group v-model="newData.workplace" :options="workplaces"></b-radio-group>
      <ErrorMeesage v-if=" ! $v.newData.workplace.required">※必須項目です</ErrorMeesage>
    </b-col>
  </b-row>
  <b-row class="mt-3">
    <b-col>
      <b-button-toolbar class="justify-content-end">
        <b-spinner v-if="isRegistering" class="mr-2"></b-spinner>
        <b-button v-if="mode === 'new'" size="sm" variant="outline-primary" @click="clear">クリア</b-button>
        <b-button v-else size="sm" variant="outline-primary" @click="cancel">キャンセル</b-button>
        <b-button size="sm" class="ml-3" :disabled="isRegistering" @click="register">登録</b-button>
      </b-button-toolbar>
    </b-col>
  </b-row>
</div>
</template>

<style scoped>
label {
  margin: auto 0;
  display: flex;
  align-items: center;
}
.required-mark {
  color: red;
  font-size: 0.5em;
}
.null-selection {
  color: #BBBBBB;
}
.non-null-selection {
  color: rgb(33, 37, 41);
}
</style>

<script>
import WorkIdSelector from '@/components/work-id-selector.vue'
import filtersMixin from '@/mixins/sales-and-expenses-filters.js'

import cloneDeep from 'lodash/cloneDeep'
import { required, requiredIf } from 'vuelidate/lib/validators'

export default {
  mixins: [
    filtersMixin
  ],
  created() {
    const promise1 = this.$firebase.db.fetchTypeOptions('salesAndExpenses')
    .then(data => {
      this.categorySales = data[0].options
      this.categoryExpenses = data[1].options
    })

    const promise2 = this.$firebase.db.fetchTypeOptions('orderStatus')
    .then(data => {
      this.orderStatus = data
    })

    const promise3 = this.$firebase.db.fetchTypeOptions('workplace')
    .then(data => {
      const filtered = data.filter(wp => wp.category === "factory")
      const none = {value: "none", text: "なし"}
      this.workplaces = [none, ...filtered]
    })

    Promise.all([promise1, promise2, promise3]).then(() => {
      this.isTypeOptionsFetched = true
    })

    this.$firebase.db.fetchWorkId().then(workIds => {
      this.workIds = workIds
      this.isWorkIdFetched = true
    })

    // Initialize months array
    for(let n in [...Array(6)]) {
      this.months.push(this.$dayjs().add(-(parseInt(n))-1, 'month').format('YYYY-MM'))
      this.months.push(this.$dayjs().add((parseInt(n))+1, 'month').format('YYYY-MM'))
    }
    this.months.push(this.$dayjs().format('YYYY-MM'))
    this.months.sort()

    if(this.mode !== 'new') {
      Object.keys(this.targetData).forEach(key => {
        this.newData[key] = this.targetData[key]
      })

      // Needs to manually translate "amount" for initial display
      this.newData.amount = this.$options.filters.amountTranslator(this.newData.amount)
    }
  },
  components: {
    WorkIdSelector,
    ErrorMeesage: {
      functional: true,
      render(h, context) { return h('div', {class: "error-message"}, context?.children)}
    },
    RequiredMark: {
      render: (h) => h('span', {class: "required-mark"}, "※")
    }
  },
  props: {
    mode: {
      type: String,
      required: true,
      validator: (val) => ['new', 'edit'].includes(val)
    },
    targetData: {
      type: Object
    },
    targetId: {
      type: String
    }
  },
  data() {
    return {
      isTypeOptionsFetched: false,
      isWorkIdFetched: false,
      isRegistering: false,
      workIds: [],
      categorySales: [],
      categoryExpenses: [],
      orderStatus: [],
      workplaces: [],
      months: [],
      // Values below will be registered or cleared
      newData: {
        staffName: null,
        category: null,
        forecastStatus: 'estimation',
        description: null,
        remarks: null,
        amount: "¥0",
        workId: null,
        unitId: null,
        month: null,
        workplace: null
      }
    }
  },
  validations: {
    newData: {
      staffName: {required},
      category: {required},
      forecastStatus: {required},
      description: {required},
      remarks: {},
      amount: {required},
      workId: {},
      unitId: {},
      month: {
        required: requiredIf(function(newData) {
          const bool = [...this.categorySales, ...this.categoryExpenses].some(category =>
            newData.category === category.value && category.requireMonth)
          return bool
        })
      },
      workplace: {required},
      // This is to validate if at least one from 'workId' or 'month' is not null.
      oneOfThemIsNotNull: (data) => data.workId || data.month ? true : false,
    }
  },
  methods: {
    clear() {
      this.newData.staffName = null
      this.newData.category = null
      this.newData.forecastStatus = 'estimation'
      this.newData.description = null
      this.newData.remarks = null
      this.newData.amount = '¥0'
      this.newData.workId = null
      this.newData.unitId = null
      this.newData.month = null
      this.newData.workplace = null
    },
    cancel() {
      this.$emit('changed', null)
    },
    async register() {
      if( ! this.$v.newData.oneOfThemIsNotNull) 
        return alert(`エラー：「工事番号」と「月度」は、少なくともどちらか一つの入力が必要です。`)
      if(this.$v.$invalid)
        return alert(`エラー：入力内容に誤りがあります。`)

      this.isRegistering = true
      const newData = cloneDeep(this.newData)
      // Convert or insert data before registration
      newData.amount = parseInt(newData.amount.replace(/¥|,/g, ''))
      newData.registeredAt = this.$dayjs().format('YYYY-MM-DD')
      newData.taxIncluded = false

      if(this.mode === 'new') {
        await this.$firebase.db.registerSalesAndExpenses(newData).then(() => {
          alert(`登録が完了しました。`)
          // this.clear()
        })
      } else {
        await this.$firebase.db.updateSalesAndExpenses({[this.targetId]:newData}).then(() => {
          alert(`更新が完了しました。`)
        })
      }
      this.$emit('changed', this.newData)
      this.isRegistering = false
    },
    onWorkIdChanged(newValue) {
      if(this.newData.workId !== newValue) {
        this.newData.unitId = null
      }
      this.newData.workId = newValue
    }
  }
}
</script>