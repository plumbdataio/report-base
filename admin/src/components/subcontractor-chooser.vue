<template>
<b-modal id="subcontractor-chooser" visible title="外注先検索" @ok="set">
  <b-form-group description="※あいまい検索">
    <label>会社名</label>
    <input type="text" v-model="name" @keypress.enter="search()">
  </b-form-group>
  <b-form-group>
    <b-button @click="search()">検索</b-button>
  </b-form-group>
  <b-form>
    <b-form-tag v-if="idSelected" variant="warning" @remove="remove()">{{selected.companyName}}</b-form-tag>
  </b-form>
  <br>
  <b-table-simple sticky-header>
    <b-thead>
      <b-th></b-th>
      <b-th>ID</b-th>
      <b-th>会社名</b-th>
    </b-thead>
    <b-tbody>
      <b-tr v-if="isFetched && (fetched == null || isEmpty(fetched))">
        <b-td colspan="3" align="center">データがありません。</b-td>
      </b-tr>
      <template v-for="(subContractor, subContractorId) in fetched">
        <b-tr :key="'searched-subContractor-'+subContractorId">
          <b-td>
            <b-button @click="select(subContractor, subContractorId)">選択</b-button>
          </b-td>
          <b-td>{{subContractorId}}</b-td>
          <b-td>{{subContractor.companyName}}</b-td>
        </b-tr>
      </template>
    </b-tbody>
  </b-table-simple>
</b-modal>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
export default {
  created() {
    this.$root.$on('bv::modal::hide', (bvEvent, modalId) => {
      if(modalId === 'subcontractor-chooser')
        this.$emit('hide')
    })
  },
  props: {
    value: {
      type: Object,
    }
  },
  data() {
    return {
      name: "",
      isFetched: false,
      fetched: {},
      selected: {},
      idSelected: null,
    }
  },
  methods: {
    isEmpty,
    search() {
      this.fetched = {}
      this.isFetched = false
      this.$firebase.db.fetchContractor("sub", this.name)
              .then(value => {
                this.fetched = value
                this.isFetched = true
              })
    },
    select(subContractor, subContractorId) {
      this.idSelected = subContractorId
      this.selected = subContractor
    },
    remove() {
      this.idSelected = null
      this.selected = {}
    },
    set() {
      if(this.idSelected) {
        const newValue = this.value
        newValue.companyId = this.idSelected
        newValue.companyName = this.selected.companyName
        newValue.companyNameAbbreviated = this.selected.companyNameAbbreviated
        this.$emit('input', newValue)
      }
    },
  }
}
</script>