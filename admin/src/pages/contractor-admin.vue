<template>
  <b-container class="p-0">
    <HeaderRow>元請/外注先</HeaderRow>
    <b-row class="pt-4 pl-3" align-v="center">
      <label class="mr-3">新規</label>
      <b-button class="mb-2" :class="{'button-plus': ! isCollapsed, 'button-minus': isCollapsed}" variant="outline-secondary" size="sm" @click="toggle"></b-button>
    </b-row>
    <b-collapse id="collapse" v-model="isCollapsed">
      <b-form-row>
        <b-col sm="2">
          <b-form-group>
            <label>種別</label>
            <b-form-select v-model="contractorData.type">
              <b-form-select-option value="prime">元請</b-form-select-option>
              <b-form-select-option value="sub">外注先</b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col sm="6">
          <b-form-group>
            <label>社名(正式名称)</label>
            <b-form-input v-model="contractorData.companyName"></b-form-input>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-col sm="8">
          <b-form-group>
            <label>社名(略称)</label>
            <b-form-input v-model="contractorData.companyNameAbbrebiated"></b-form-input>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-col sm="2">
          <b-form-group>
            <label>郵便番号</label>
            <b-form-input v-model="contractorData.postalCode"></b-form-input>
          </b-form-group>
        </b-col>
        <b-col sm="6">
          <b-form-group>
            <label>住所</label>
            <b-form-input v-model="contractorData.address"></b-form-input>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-col sm="4">
          <b-form-group description="">
            <label>TEL</label>
            <b-form-input v-model="contractorData.tel"></b-form-input>
          </b-form-group>
        </b-col>
        <b-col sm="4">
          <b-form-group description="">
            <label>FAX</label>
            <b-form-input v-model="contractorData.fax"></b-form-input>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-col sm="2">
          <b-form-group>
            <label>日報締日</label>
            <b-form-select v-model="contractorData.deadlineWorkschedule">
              <b-form-select-option value=0>末日</b-form-select-option>
              <b-form-select-option v-for="n in 28" :key="n" :value="n.toString()">{{n}}</b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col sm="2">
          <b-form-group>
            <label>支払い日</label>
            <b-form-select v-model="contractorData.deadlineInvoice">
              <b-form-select-option value=0>末日</b-form-select-option>
              <b-form-select-option v-for="n in 28" :key="n" :value="n">{{n}}</b-form-select-option>
            </b-form-select>
          </b-form-group>
        </b-col>
      </b-form-row>
      <b-form-row>
        <b-button @click="register">登録</b-button>
      </b-form-row>
    </b-collapse>
    <hr>
    <b-row class="pt-3">
      <b-col cols="3">
        <b-form-group>
          <label>種別</label>
          <b-form-select v-model="searchType">
            <option value=""></option>
            <option value="prime">元請</option>
            <option value="sub">外注先</option>
          </b-form-select>
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group description="※あいまい検索">
          <label>社名</label>
          <b-form-input type="text" v-model="searchContractorName" @keypress.enter="searchContractor()"></b-form-input>
        </b-form-group>
      </b-col>
      <b-col align-self="center">
        <b-form-group>
          <b-button @click="searchContractor()">検索</b-button>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-table-simple stacked="sm" sticky-header="100%" class="table-bordered">
          <b-thead head-variant="dark">
            <b-tr>
              <b-th>ID</b-th>
              <b-th>種別</b-th>
              <b-th>社名</b-th>
              <b-th>郵便番号</b-th>
              <b-th>住所</b-th>
              <b-th>TEL</b-th>
              <b-th>FAX</b-th>
              <b-th>日報締日</b-th>
              <b-th>支払日</b-th>
              <b-th></b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <b-tr v-if="isContractorFetched && (contractorListFetched == null || isEmpty(contractorListFetched))">
              <b-td colspan="9" align="center">データがありません。</b-td>
            </b-tr>
            <template v-for="(data, contractorId) in contractorListFetched">
              <b-tr :key="'searched-contractor-'+contractorId">
                <b-td stacked-heading="ID">{{contractorId}}</b-td>
                <b-td stacked-heading="種別">{{data.type === "prime" ? "元請" : data.type === "sub" ? "外注先" : "???"}}</b-td>
                <b-td stacked-heading="社名" class="text-nowrap">{{data.companyName}}</b-td>
                <b-td stacked-heading="郵便番号">{{data.postalCode}}</b-td>
                <b-td stacked-heading="住所">{{data.address}}</b-td>
                <b-td stacked-heading="TEL">{{data.tel}}</b-td>
                <b-td stacked-heading="FAX">{{data.fax}}</b-td>
                <b-td stacked-heading="日報締日">{{data.deadlineWorkschedule}}</b-td>
                <b-td stacked-heading="支払日">{{data.deadlineInvoice}}</b-td>
                <b-td>
                  <b-button @click="deleteContractor(contractorId)">削除</b-button>
                </b-td>
              </b-tr>
            </template>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import isEmpty from 'lodash/isEmpty'

export default {
  data() {
    return {
      searchType: "",
      searchContractorName: "",
      isContractorFetched: false,
      isCollapsed: false,
      contractorListFetched: {},
      contractorData: {
        type: "",
        companyName: "",
        companyNameAbbreviated: "",
        postalCode: "",
        address: "",
        tel: "",
        fax: "",
        deadlineWorkschedule: "",
        deadlineInvoice: ""
      }
    }
  },
  methods: {
    isEmpty,
    toggle() {
      if(this.isCollapsed) {
        this.isCollapsed = false
      } else {
        this.isCollapsed = true
      }
    },
    register() {
      const vm = this
      this.$firebase.db.fetchIncrementedLargestContractorId(vm.contractorData.type)
      .then(largestIds => {
        const data = {}
        const contractorId = Number.parseInt(largestIds[vm.contractorData.type])
        data[contractorId] = vm.contractorData

        this.$firebase.db.registerContractor(data)
        .then(val => {
          alert(`登録が完了しました。`)
        })
      })
    },
    searchContractor(){
      this.$set(this.$data, "contractorListFetched", {})
      this.$firebase.db.fetchContractor(this.searchType, this.searchContractorName)
              .then(value => {
                const contractorList = value
                console.log(`contractorList: ${JSON.stringify(contractorList)}`);
                if(contractorList === null) {
                  this.$set(this.$data, "contractorListFetched", contractorList)
                  this.isContractorFetched = true
                  return
                }
                
                Object.keys(contractorList).forEach(key => {
                  contractorList[key].isDirector = false
                  contractorList[key].isReporter = false
                })
                this.$set(this.$data, "contractorListFetched", contractorList)
                console.log(`contractorList: ${JSON.stringify(contractorList)}`);
                this.isContractorFetched = true
              })
    },
    async deleteContractor(contractorId) {
      this.$firebase.db.deleteContractor(contractorId)
    }
  }
}
</script>