<template>
  <b-container class="p-0">
    <HeaderRow>人員管理</HeaderRow>
    <b-row class="pt-4 pl-3" align-v="center">
      <b-button :class="{'button-plus': ! controls.isCollapsed, 'button-minus': controls.isCollapsed}" variant="outline-secondary" size="sm" @click="toggle"></b-button>
      <div class="ml-3">新規ユーザー作成</div>
    </b-row>
    <b-collapse id="collapse" v-model="controls.isCollapsed">
      <b-card class="m-3 p-1">
        <CreateStaff></CreateStaff>
      </b-card>
    </b-collapse>
    <hr class="mt-4">
    <b-row class="pt-3">
      <b-col sm>
        <b-form-group>
          <label>所属</label>
          <b-form-select v-model="controls.searchAffiliation" :options="filteredAffiliation"></b-form-select>
        </b-form-group>
      </b-col>
      <b-col sm>
        <b-form-group description="※あいまい検索">
          <label>名前</label>
          <b-form-input type="text" v-model="controls.searchStaffName" @keypress.enter="searchStaff()"></b-form-input>
        </b-form-group>
      </b-col>
      <b-col align-self="center" sm>
        <b-form-group>
          <b-button variant="primary" @click="searchStaff()">検索</b-button>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-table-simple sticky-header stacked="sm" bordered>
          <b-thead head-variant="light">
            <b-tr>
              <b-th>所属</b-th>
              <b-th>名前</b-th>
              <b-th>ID</b-th>
              <b-th></b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <template v-if="controls.isSearching">
              <b-tr>
                <b-td colspan="4" class="text-center">
                  <b-spinner variant="info"></b-spinner>
                </b-td>
              </b-tr>
            </template>
            <b-tr v-if="controls.isStaffFetched && isEmpty(controls.staffListFetched)">
              <b-td colspan="4" align="center">データがありません。</b-td>
            </b-tr>
            <template v-for="staff in controls.staffListFetched">
              <b-tr :key="'searched-staff-'+staff.staffId">
                <b-td stacked-heading="所属">{{staff.companyName}}</b-td>
                <b-td stacked-heading="名前">{{staff.staffName}}</b-td>
                <b-td stacked-heading="ID">{{staff.staffId}}</b-td>
                <b-td>
                  <div class="d-flex gap-10">
                    <template v-for="disabled in [controls.isDeleting && staff.staffId === controls.targetStaffId]">
                      <b-button size="sm" variant="secondary" :disabled="disabled" @click="showStaffDetail(staff.staffId)">詳細</b-button>
                      <b-button size="sm" variant="warning" :disabled="disabled" @click="editStaffDetail(staff.staffId)">編集</b-button>
                      <b-button size="sm" variant="outline-danger" :disabled="disabled" @click="deleteStaff(staff.staffId)">削除</b-button>
                      <template v-if="disabled">
                        <b-spinner variant="info" class="ml-2"></b-spinner>
                      </template>
                    </template>
                  </div>
                </b-td>
              </b-tr>
            </template>
            <b-modal :id="controls.showStaffDetailModalId" ok-only hide-header>
              <StaffDetail :modal-id="controls.showStaffDetailModalId" :staff-id="controls.targetStaffId"></StaffDetail>
            </b-modal>
            <StaffEditor v-model="controls.isStaffEditorOpened" @success="searchStaff()" :staff-id="controls.targetStaffId"></StaffEditor>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
</style>

<script lang="ts">
import { to } from 'await-to-js'
import isEmpty from 'lodash/isEmpty'

import CreateStaff from '../components/create-staff.vue'
import StaffDetail from '@/sfc/components/staff-detail.vue'
import StaffEditor from '@/sfc/components/staff-editor.vue'
import type { Staff } from '@/schema/Staff'

export default {
  components: {
    CreateStaff, StaffDetail, StaffEditor,
  },
  data() {
    const searchAffiliation : typeof Staff.prototype.affiliation = "in-source"

    return {
      controls: {
        isCollapsed: false,
        isStaffEditorOpened: false,
        isDeleting: false,
        isSearching: false,
        isStaffFetched: false,
        searchAffiliation,
        searchStaffName: "",
        staffListFetched: [] as Staff[],
        showStaffDetailModalId: "show-staff-detail",
        targetStaffId: 0,
      },
    }
  },
  methods: {
    isEmpty,
    toggle() {
      if(this.controls.isCollapsed) {
        this.controls.isCollapsed = false
      } else {
        this.controls.isCollapsed = true
      }
    },
    async searchStaff(){
      this.controls.isStaffFetched = false
      this.controls.staffListFetched = []
      this.controls.isSearching = true
      this.controls.staffListFetched = await this.$firebase.db.searchStaff(this.controls.searchAffiliation, this.controls.searchStaffName)
      this.controls.isStaffFetched = true
      this.controls.isSearching = false
    },
    async showStaffDetail(staffId : typeof Staff.prototype.staffId) {
      this.controls.targetStaffId = staffId
      this.$bvModal.show(this.controls.showStaffDetailModalId)
    },
    async editStaffDetail(staffId : typeof Staff.prototype.staffId){
      this.controls.targetStaffId = staffId
      this.controls.isStaffEditorOpened = true
    },
    async deleteStaff(staffId : typeof Staff.prototype.staffId) {
      if( ! await this.$bvModal.msgBoxConfirm(this.newLiner("該当のユーザーを削除します。\n(日報などの情報は削除されません。)\n\n本当によろしいですか？"))) {
        return
      }
      this.controls.isDeleting = true
      this.controls.targetStaffId = staffId
      const [error] = await to<void, Error>(this.$firebase.db.deleteUser(staffId))
      if(error) {
        this.$bvModal.msgBoxOk(this.newLiner(`エラー：ユーザーの削除に失敗しました。\n\n${error?.message}`))
      } else {
        this.$bvModal.msgBoxOk(this.newLiner(`ユーザーの削除が完了しました。`))
      }
      this.controls.targetStaffId = 0
      this.controls.isDeleting = false
      this.searchStaff()
    },
  }
}
</script>