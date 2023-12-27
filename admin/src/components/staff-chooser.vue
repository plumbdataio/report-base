<template>
<b-modal :visible="visible" title="人員検索" @ok="callback(chosen)" @hide="$emit('hide', $event)">
  <b-form-group>
    <label>所属</label>
    <select v-model="affiliation">
      <option value=""></option>
      <option value="in-house">自社</option>
      <option value="subcontractor">外注先</option>
    </select>
  </b-form-group>
  <b-form-group description="※あいまい検索">
    <label>氏名</label>
    <input type="text" v-model="staffName" @keydown.enter="search()">
  </b-form-group>
  <b-form-group>
    <b-button size="sm" variant="primary" @click="search()">検索</b-button>
  </b-form-group>
  <br>
  <b-table-simple sticky-header>
    <b-thead>
      <b-tr>
        <b-th></b-th>
        <b-th>所属</b-th>
        <b-th>氏名</b-th>
      </b-tr>
    </b-thead>
    <b-tbody>
      <b-tr v-if="isStaffFetched && (fetched == null || isEmpty(fetched))">
        <b-td colspan="3" align="center">データがありません。</b-td>
      </b-tr>
      <template v-else v-for="(staff, staffId) in fetched">
        <b-tr :key="'searched-staff-'+staffId">
          <b-td>
            <b-button size="sm" variant="info" class="text-nowrap" @click="add(staffId, staff)">選択</b-button>
          </b-td>
          <b-td>{{staff.companyName}}</b-td>
          <b-td>{{staff.staffName}}</b-td>
        </b-tr>
      </template>
    </b-tbody>
  </b-table-simple>
  <b-form>
    <template v-for="(staff, staffId) in chosen">
      <b-form-tag :key="'tag-staff-' + staffId" :variant="chooseVariant(staff.affiliation)" @remove="removeStaff(staffId)">{{staff.staffName}}</b-form-tag>
    </template>
  </b-form>
</b-modal>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    originalObject: {
      type: Object,
      required: true,
    },
    callback: {
      type: Function,
      required: true
    },
    staffClass: {
      type: Function,
      required: false
    }
  },
  data() {
    return {
      affiliation: "",
      staffName: "",
      isStaffFetched: false,
      chosen: {},
      fetched: {},
    }
  },
  created() {
    this.chosen = this.originalObject
  },
  methods: {
    isEmpty,
    search(){
      this.$firebase.db.fetchStaff(this.affiliation, this.staffName)
      .then(staffList => {
        if(this.staffClass != null) {
          Object.keys(staffList).forEach(uid => {
              staffList[uid] = new this.staffClass(staffList[uid])
          })
        }
        this.$set(this.$data, 'fetched', cloneDeep(staffList))
        this.isStaffFetched = true
      })
    },
    add(staffId, staff) {
      this.$set(this.chosen, staffId, staff)
    },
    chooseVariant(affiliation) {
      switch (affiliation) {
        case "in-house":
          return "primary"
          break;
        case "subcontractor":
          return "success"
          break;     
        default:
          return "secondary"
          break;
      }
    },
    removeStaff(staffId) {
      this.$delete(this.chosen, staffId)
    }
  }
}
</script>