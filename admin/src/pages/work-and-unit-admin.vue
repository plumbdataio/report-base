<template>
  <b-container class="p-0">
    <HeaderRow>工事番号管理</HeaderRow>
    <work-editor mode="new"></work-editor>
    <b-card body-class="m-2 p-2" class="my-3">
      <b-card-title>検索</b-card-title>
      <b-row align-v="center">
        <b-col md align-self="center">
          <b-form-group label="ステータス：" label-cols-sm="2" label-align-sm="right" label-class="text-nowrap" class="m-0">
            <b-form-select multiple v-model="selectedOrderStatus" :options="orderStatusList"></b-form-select>
          </b-form-group>
        </b-col>
        <b-col cols="auto">
          <b-button size="sm" @click="search">検索</b-button>
        </b-col>
      </b-row>
    </b-card>
    <b-row>
      <b-col>
        <b-table-simple sticky-header stacked="md" bordered>
          <b-thead v-once head-variant="dark" class="text-center">
            <b-tr>
              <b-th>工事番号</b-th>
              <b-th>案件名/<br>プロジェクト名など</b-th>
              <b-th>製作期間(予定)</b-th>
              <b-th>ステータス</b-th>
              <b-th>製作拠点</b-th>
              <b-th></b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <template v-if="isWorkIdFetched">
              <template v-for="(work, workId) in fetchedWorkIds">
                <b-tr :key="`table-item__${workId}`">
                  <b-td>{{workId}}</b-td>
                  <b-td>{{work.description}}</b-td>
                  <b-td>{{translateDate(work.startAt)}} ～ {{translateDate(work.endAt)}}</b-td>
                  <b-td>
                    <b-select size="sm" :value="work.status" :options="orderStatusList" @change="confirmChange(workId, $event)"></b-select>
                  </b-td>
                  <b-td class="text-center">
                    <template v-for="value in work.workplace">
                      <!--
                        The line below is a little bit hacky, but I just want to run workplaceList.find() only once
                        thus make it referenceable with variable "workplace"
                      -->
                      <template v-for="workplace in [workplaceList.find(workplace => workplace.value === value)]">
                        <b-tag :key="`workplace__${workplace.value}_for_${workId}`" :style="{backgroundColor: workplace.backgroundColor}" no-remove>{{workplace.text}}</b-tag>
                      </template>
                    </template>
                  </b-td>
                  <b-td class="buttons-cell">
                    <b-button size="sm" variant="info" @click="$bvModal.show(`modal-${workId}`)">編集</b-button>
                    <b-button size="sm" variant="outline-secondary" @click="deleteWorkId(workId, work)">削除</b-button>
                    <b-spinner v-if="workIdToBeDeleted[workId] !== undefined"></b-spinner>
                  </b-td>
                </b-tr>

      <!-- Modal here  -->
                <b-modal hide-header hide-footer dialog-class="modal-90vw" :id="`modal-${workId}`" :key="`modal-${workId}`">
                  <b-container class="m-0 w-100 mw-100">
                    <b-row>
                      <b-col>
                        <WorkEditor mode="modify" class="scrollable-card-body" v-model="fetchedWorkIds[workId]" :work-id="workId"></WorkEditor>
                      </b-col>
                      <b-col>
                        <OrderDocuments class="my-3 scrollable-card-body" v-model="fetchedWorkIds[workId]" :workId="workId"></OrderDocuments>
                      </b-col>
                    </b-row>
                  </b-container>
                </b-modal>
              </template>
            </template>
            <template v-else>
              <b-tr>
                <b-td colspan="7" class="text-center">
                  <div v-if="isResultEmpty">該当する工事番号が見つかりませんでした。</div>
                  <b-spinner v-else variant="info"></b-spinner>
                </b-td>
              </b-tr>
            </template>
          </b-tbody>
        </b-table-simple>
      </b-col>
    </b-row>
  </b-container>
</template>

<style scoped>
.form-row>div {
  display: flex !important;
  align-items: center !important;
}
.buttons-cell button {
  margin-bottom: 5px;
}
.scrollable-card-body {
  overflow-y: auto;
  height: 83vh;
  margin: 0px !important;

}
.scrollable-card-body::-webkit-scrollbar {
  width: 0px;
}
</style>

/** WARNING: This is non scoped style */
<style>
.modal-90vw {
  width: 90vw;
  max-width: 90vw !important;
  height: 90vh;
  min-height: 90vh !important;
}
.modal-90vw .modal-content {
  height: 90vh;
  min-height: 90vh !important;
}
</style>

<script>
import cloneDeep from 'lodash/cloneDeep'
import WorkEditor from '@/components/work-editor.vue'
import OrderDocuments from '@/components/order-documents.vue'

export default {
  components: {
    WorkEditor,
    OrderDocuments,
  },
  async created() {
    this.workplaceList = await this.$firebase.db.fetchTypeOptions("workplace")
    this.orderStatusList = await this.$firebase.db.fetchTypeOptions("orderStatus")
    this.selectedOrderStatus = this.orderStatusList
    .filter(status => status.isActive)
    .map(status => status.value)

    this.search()
  },
  data() {
    return {
      isWorkIdFetched: false,
      isResultEmpty: false,
      orderStatusList: [],
      selectedOrderStatus: [],
      fetchedWorkIds: {},
      workIdToBeDeleted: [],
    }
  },
  methods: {
    shouldPresent(unitIds, unitIdIndex) {
      return unitIds === undefined || unitIds.length <= 1 || unitIdIndex === 0
    },
    cloneDeep(work){
      return cloneDeep(work)
    },
    translateDate(date) {
      return date == null || date === "" ? '(未定)' : date.split("-").join("/")
    },
    search() {
      this.isWorkIdFetched = false
      this.$firebase.db.fetchWorkId(this.selectedOrderStatus)
              .then(data => {
                if(data === null) {
                  this.fetchedWorkIds = {}
                  this.isResultEmpty = true
                  this.isWorkIdFetched = true
                  return
                }

                Object.values(data).forEach(work => {
                  if( ! Boolean(work.unitIds)) {
                    work.unitIds = []
                  }
                })
                this.fetchedWorkIds = data
                this.isResultEmpty = false
                this.isWorkIdFetched = true
              })
    },
    translateStatus(value) {
      return this.orderStatusList.find(status => status.value === value)?.text ?? "(不明)"
    },
    async deleteWorkId(workId) {
      if( ! confirm("登録ミス等でない限り、「削除」ではなく「ステータス」の変更をして下さい。\nそれでも削除を行う場合は、OKを押して下さい。"))
        return
      this.workIdToBeDeleted.push(workId)
      await this.$firebase.db.deleteWorkId(workId)
              .then(result => {
                alert("削除が完了しました。")
              }).catch(error => {
                alert(`削除に失敗しました。\nエラー: ${JSON.stringify(error)}`)
              })
      this.workIdToBeDeleted.pop()
    },
    async confirmChange(workId, newValue) {
      if( ! await this.$bvModal.msgBoxConfirm("ステータスを変更します。よろしいですか？", {centered: true})) {
        this.search()
        return
      }

      this.$firebase.db.changeWorkStatus(workId, newValue)
      .then(async result => {
        await this.$bvModal.msgBoxOk("変更が完了しました。", {centered: true})
      })
    }
  }
}
</script>