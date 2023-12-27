<template>
<div class="w-100 text-center">
  <b-table-simple v-if="data && isWorkIdsFetched" bordered sticky-header striped small class="w-100 table">
    <b-thead class="table-header" :class="`${mode}-header-color`">
      <b-tr>
        <b-th>カテゴリー</b-th>
        <b-th>概要</b-th>
        <b-th>金額</b-th>
        <b-th v-if="mode !== 'both'" class="text-nowrap">按分後<br>金額</b-th>
        <b-th class="text-nowrap">見積<br>or<br>実績</b-th>
        <b-th>工事番号</b-th>
        <b-th>ユニット番号</b-th>
        <b-th>月度</b-th>
        <b-th>拠点</b-th>
        <b-th>登録日</b-th>
        <b-th>登録者</b-th>
        <b-th>備考</b-th>
        <b-th v-if="mode === 'both'">編集</b-th>
      </b-tr>
    </b-thead>
    <b-tbody>
      <b-tr v-if="Object.keys(data).length === 0">
        <b-td :colspan="mode === 'both' ? 12 : 12" class="text-center">(該当するデータがありません)</b-td>
      </b-tr>
      <template v-for="(entry, indexOrKey) in data">
        <b-tr :key="`${mode}-${indexOrKey}`">
          <b-td>{{entry.category | categoryTranslator(categories, [])}}</b-td>
          <b-td>{{entry.description}}</b-td>
          <b-td>{{entry.amount | amountTranslator}}</b-td>
          <b-td v-if="mode !== 'both'">{{Math.floor(entry.weightedAmount) | amountTranslator}}</b-td>
          <b-td>{{entry.forecastStatus | forecastStatusTranslator}}</b-td>
          <b-td>{{workIdWithDescription(entry.workId)}}</b-td>
          <b-td>{{entry.unitId}}</b-td>
          <b-td>{{entry.month | monthTranslator}}</b-td>
          <b-td>{{workplaces.find(wp => wp.value === entry.workplace) ? workplaces.find(wp => wp.value === entry.workplace).text : entry.workplace}}</b-td>
          <b-td>{{entry.registeredAt | registeredAtTranslator}}</b-td>
          <b-td>{{entry.staffName}}</b-td>
          <b-td>{{entry.remarks}}</b-td>
          <b-td v-if="mode === 'both'" class="min-width-col">
            <b-button size="sm" variant="warning" class="text-nowrap" @click="showEditor(indexOrKey, entry)">編集</b-button>
            <b-button size="sm" variant="outline-secondary" class="text-nowrap" @click="deleteEntry(indexOrKey)">削除</b-button>
          </b-td>
        </b-tr>
      </template>
    </b-tbody>
    <b-modal id="editor" size="lg" hide-header hide-footer>
      <SalesAndExpensesEditor mode="edit" :target-id="selectedId" :target-data="selectedEntry" @changed="$bvModal.hide('editor')" />
    </b-modal>
  </b-table-simple>
  <b-spinner v-else></b-spinner>
</div>
</template>

<style scoped>
.table {
  max-height: 75vh;
}
.table-header th {
  color: ghostwhite !important;
  text-align: center;
}
.both-header-color th {
  background-color: #af1818 !important;
}
.sales-header-color th {
  background-color: #7dc3f1 !important;
}
.expenses-header-color th {
  background-color: #ce5e5e !important;
}
table td, table th{
  font-size: 0.8em;
}
.min-width-col {
  width: 1px;
  white-space: nowrap;
}
@media screen and (max-width: 1200px) {
  .min-width-col {
    white-space: normal;
  }
  .min-width-col button {
    margin-bottom: 5px;
  }
}
</style>

<script>
import filtersMixin from '@/mixins/sales-and-expenses-filters.js'
import SalesAndExpensesEditor from '@/components/sales-and-expenses-editor.vue'

export default {
  created() {
    this.$firebase.db.fetchTypeOptions("workplace")
    .then(data => {
      this.workplaces = data
      this.workplaces.push({value: "none", text: "なし"})
      this.isWorkplaceFetched = true
    })

    this.$firebase.db.fetchWorkId().then(workIds => {
      this.fetchedWorkIds = workIds
      this.isWorkIdsFetched = true
    })
  },
  mixins: [
    filtersMixin
  ],
  components: {
    SalesAndExpensesEditor
  },
  props: {
    data: [Object, Array], // Should be Object with key === id when mode === 'both'
    mode: {
      type: String,
      required: true,
      validator: (val) => ['sales', 'expenses', 'both'].includes(val)
    },
    headerColor: String,
    categories: Array
  },
  data() {
    return {
      isCollapsed: false,
      isWorkplaceFetched: false,
      isWorkIdsFetched: false,
      workplaces: [],
      selectedId: null,
      selectedEntry: {},
      fetchedWorkIds: {}
    }
  },
  computed: {
    workIdWithDescription() {
      return function(workId) {
        const description = this.fetchedWorkIds[workId]?.description
        return description ? `${workId} (${description})` : workId
      }
    }
  },
  methods: {
    showEditor(id, entry) {
      this.selectedId = id
      this.selectedEntry = entry
      this.$bvModal.show('editor')
    },
    deleteEntry(id) {
      if( ! confirm('該当の情報を削除します。\n※この操作は元に戻せません。\nよろしいですか？'))
        return

      this.$firebase.db.deleteSalesAndExpenses(id)
      .then(() => {
        this.$emit('deleted', id)
        alert('削除が完了しました。')
      }).catch(error => {
        alert(`エラー：削除に失敗しました。\n${JSON.stringify(error)}`)
      })
    }
  }
}
</script>