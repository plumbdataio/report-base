<template>
<div>
  <HeaderRow>売上と支出</HeaderRow>
  <b-container class="m-0">
    <b-row align-v="center">
      <label class="m-0 mr-2">新規入力</label>
      <b-button variant="outline-secondary" size="sm" :class="{'button-plus': ! isCollapsed, 'button-minus': isCollapsed}" @click="isCollapsed = ! isCollapsed"></b-button>
    </b-row>
    <b-collapse v-model="isCollapsed">
      <SalesAndExpensesEditor mode="new"></SalesAndExpensesEditor>
    </b-collapse>
  </b-container>
  <hr>
  <b-container class="mw-100 vh-75 mt-3">
    <b-row class="align-items-center">
      <div class="d-flex flex-wrap">
        <div class="mt-2 d-flex align-items-center">
          <label>カテゴリー</label>
          <b-select :disabled=" ! isTypeOptionsFetched" size="sm" class="ml-2 search-workid" v-model="searchCategory">
            <template v-if="isTypeOptionsFetched">
              <b-select-option :value="null"></b-select-option>
              <b-select-option-group label="売上">
                <template v-for="entry in categorySales">
                  <b-select-option :key="`sales-${entry.value}`" :value="entry.value">{{entry.text}}</b-select-option>
                </template>
              </b-select-option-group>
              <b-select-option-group label="支出">
                <template v-for="entry in categoryExpenses">
                  <b-select-option :key="`expenses-${entry.value}`" :value="entry.value">{{entry.text}}</b-select-option>
                </template>
              </b-select-option-group>
            </template>
          </b-select>
        </div>
        <div class="ml-4 mt-2 d-flex align-items-center">
          <label>工事番号</label>
          <WorkIdSelector class="ml-2 search-workid" v-model="searchWorkId"></WorkIdSelector>
        </div>
        <div class="ml-4 mt-2 d-flex align-items-center">
          <b-col cols="auto" class="p-0">
            <label class="text-nowrap">月度</label>
          </b-col>
          <b-col class="p-0">
            <MonthPicker reset class="ml-2 month-picker" v-model="searchMonth"></MonthPicker>
          </b-col>
        </div>
        <div class="ml-4 mt-2 d-flex align-items-center">
          <b-col cols="auto" class="p-0">
            <label class="text-nowrap">登録日</label>
          </b-col>
          <b-col class="p-0">
            <MonthPicker reset class="ml-2 month-picker" v-model="searchRegisteredAt"></MonthPicker>
          </b-col>
        </div>
      </div>
      <b-button size="sm" class="ml-2" @click="search">検索</b-button>
    </b-row>
    <b-row class="mt-2 vh-75">
      <template>
        <SalesAndExpensesTable
            :data="fetchedEntry"
            mode="both"
            :categories="[...categorySales, ...categoryExpenses]"
            @deleted="search"
        />
      </template>
    </b-row>
  </b-container>
</div>
</template>

<style scoped>
.search-workid {
  width: 200px;
}
.month-picker {
  max-width: 150px;
}
</style>

<script>
import filtersMixin from '@/mixins/sales-and-expenses-filters.js'
import isEqual from 'lodash/isEqual'
import SalesAndExpensesEditor from '@/components/sales-and-expenses-editor.vue'
import SalesAndExpensesTable from '@/components/sales-and-expenses-table.vue'
import WorkIdSelector from '@/components/work-id-selector.vue'

export default {
  mixins: [
    filtersMixin
  ],
  created() {
    this.$firebase.db.fetchTypeOptions('salesAndExpenses')
    .then(data => {
      this.categorySales = data[0].options
      this.categoryExpenses = data[1].options
      this.isTypeOptionsFetched = true
    })
  },
  components: {
    SalesAndExpensesEditor,
    SalesAndExpensesTable,
    WorkIdSelector
},
  data() {
    return {
      isCollapsed: false,
      isTypeOptionsFetched: false,
      isSearchFinished: true,
      categorySales: [],
      categoryExpenses: [],
      searchCategory: null,
      searchWorkId: null,
      searchMonth: null,
      searchRegisteredAt: null,
      fetchedEntry: {},
    }
  },
  methods: {
    search() {
      this.isSearchFinished = false
      let firstDate = null
      let lastDate = null
      if(this.searchRegisteredAt != null) {
        firstDate = `${this.searchRegisteredAt}-01`
        lastDate = this.$dayjs(firstDate)
        .add(1, 'month')
        .subtract(1, 'day')
        .format('YYYY-MM-DD')
      }

      this.$firebase.db.fetchSalesAndExpenses(
        [this.searchWorkId],
        this.searchMonth,
        this.searchMonth,
        firstDate,
        lastDate,
        this.searchCategory
      ).then(entries => {
        this.fetchedEntry = entries
        this.isSearchFinished = true
        if(isEqual(this.fetchedEntry, {}))
          alert('検索結果が0件でした。')
      })
    }
  }
}
</script>