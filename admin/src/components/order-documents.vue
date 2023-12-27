<template>
  <b-card body-class="m-2 p-0">
    <b-card-title>書類</b-card-title>
    <b-card class="mb-3">
      <b-form-group label="ファイル" label-cols="4" label-class="text-right align-self-center p-0" class="mb-2">
        <b-file v-model="newFile.blob" size="sm" placeholder="ファイルを選択" browse-text="参照" ></b-file>
      </b-form-group>
      <b-form-group label="書類種別" label-cols="4" label-class="text-right align-self-center p-0" class="mb-2">
        <b-select v-model="newFile.type" size="sm" :options="documentTypeOptions"></b-select>
      </b-form-group>
      <b-form-group
        :label="newFile.type == null || newFile.type === 'other' ? '受領/送付日' : newFile.type === 'purchase-order' ? '弊社受領日' : '客先送付日'"
        label-cols="4"
        label-class="text-right align-self-center p-0"
        class="mb-2"
      >
        <b-datepicker v-model="newFile.dateSentOrReceived" size="sm"></b-datepicker>
      </b-form-group>
      <b-form-group label="備考" label-cols="4" label-class="text-right align-self-center p-0" class="mb-2">
        <b-textarea v-model="newFile.description"></b-textarea>
      </b-form-group>
      <b-button-group class="w-100 justify-content-end">
        <b-button
          size="sm"
          variant="info"
          :disabled="Object.values(newFile).includes(null) || isProcessing" @click="uploadNewFile(workId)"
        >アップロード<b-spinner v-if="isProcessing" small variant="light" class="ml-2"></b-spinner></b-button>
      </b-button-group>
    </b-card>
    <template v-for="documentType in documentTypeOptions">
      <b-card :key="documentType.value" body-class="p-2">
        <div class="d-flex align-items-center">
          <b-button size="sm" variant="outline-secondary" v-b-toggle="`collapse_${documentType.value}`">{{isCollapsed[documentType.value] ? "▲" : "▼"}}</b-button>
          <h5 class="ml-2 mb-0">{{ documentType.text }}</h5>
        </div>
        <b-collapse :id="`collapse_${documentType.value}`" v-model="isCollapsed[documentType.value]">
          <b-table
            :items="work.orderDocuments != null ? work.orderDocuments.filter(doc => doc.type === documentType.value) : []"
            :fields="fields"
            small
            show-empty
            head-row-variant="info"
            sort-by="dateSentOrReceived"
            sort-desc
            empty-text="アップロードされたファイルがありません"
            class="mt-2"
          >
          <template #cell(url)="data">
            <div class="psuedo-a" @click="openInNewTab(data.item.url)">{{data.item.fileName}}</div>
          </template>
          <template #cell(deleteButton)="data">
            <b-button size="sm" variant="outline-secondary" @click="deleteOrderDocument(workId, data.item.url)" :disabled="isProcessing">✕</b-button>
          </template>
          <template #cell(dateSentOrReceived)="data">
            <div>{{$dayjs(data.item.dateSentOrReceived).format("YYYY/MM/DD(ddd)")}}</div>
          </template>
          </b-table>
        </b-collapse>
      </b-card>
    </template>
  </b-card>
</template>

<style scoped>
.psuedo-a {
  color: cornflowerblue;
}
</style>

<script>
import cloneDeep from "lodash/cloneDeep"

export default {
  created() {
    this.work = cloneDeep(this.value) // this step is not necessary...
    this.refreshData()
    this.documentTypeOptions.forEach(doc => this.isCollapsed[doc.value] === false)
    
  },
  props: {
    value: {
      type: Object,
      required: true
    },
    workId: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      work: {},
      isProcessing: false,
      isCollapsed: {},
      documentTypeOptions: [
        {value: "quatation", text: "見積書"},
        {value: "purchase-order", text: "発注書"},
        {value: "order-confirmation", text: "請書"},
        {value: "invoice", text: "請求書"},
        {value: "other", text: "(その他)"},
      ],
      fields: [
        {key: "dateSentOrReceived", label: "受領/送付日", sortable: true},
        {key: "url", label: "ファイル名", sortable: true},
        {key: "description", label: "備考", sortable: true},
        {key: "deleteButton", label: "", sortable: false}
      ],
      newFile: {
        blob: null,
        type: null,
        description: "",
        // version: null,
        dateSentOrReceived: new Date(),
        dateUploaded: new Date(),
      },
    }
  },
  methods: {
    async refreshData() {
      this.work = await this.$firebase.db.fetchWork(this.workId)
      this.$emit("input", this.work)
    },
    async uploadNewFile(workId) {
      if(this.work?.orderDocuments?.some(doc => doc.fileName === this.newFile.blob.name)) {
        await this.$bvModal.msgBoxOk("エラー：同じ工番内で、同じファイル名のファイルが存在します。", {centered: true})
        return
      }

      this.isProcessing = true

      const fileObject = this.newFile.blob
      this.$firebase.storage.uploadOrderDocument(workId, fileObject)
      .then(async url => {
        const data = {
          type: this.newFile.type,
          url: url,
          fileName: fileObject.name,
          description: this.newFile.description,
          // version: this.newFile.version,
          dateUploaded: this.newFile.dateUploaded,
          dateSentOrReceived: this.newFile.dateSentOrReceived,
        }
        await this.$firebase.db.addOrderDocument(workId, data)
        this.$bvModal.msgBoxOk("ファイルのアップロードが完了しました。", {centered: true})
      }).catch(async error => {
        this.$bvModal.msgBoxOk("エラー：アップロードに失敗しました", {centered: true})
      })
      .finally(() => {
        this.refreshData()
        this.isProcessing = false
      })
    },
    async deleteOrderDocument(workId, url) {
      if( ! await this.$bvModal.msgBoxConfirm("該当のファイルを削除してよろしいですか？", {centered: true})) {
        return
      }
      this.isProcessing = true
      this.$firebase.storage.deleteOrderDocument(url)
      .then(async result => {
        await this.$firebase.db.deleteOrderDocument(workId, url)
        .then(result => {
          this.$bvModal.msgBoxOk("削除が完了しました。", {centered: true})
        })
      })
      .catch(async error => {
        if(error.code === "storage/object-not-found") {
          await this.$firebase.db.deleteOrderDocument(workId, url)
          .then(result => {
            this.$bvModal.msgBoxOk("削除が完了しました。", {centered: true})
          })
        } else {
          this.$bvModal.msgBoxOk("エラー削除に失敗しました。", {centered: true})
        }
      })
      .finally(() => {
        this.refreshData()
        this.isProcessing = false
      })
    },
    openInNewTab(url) {
      Object.assign(document.createElement('a'), {
        target: '_blank',
        rel: 'noopener noreferrer',
        href: url,
      }).click();
    },
  }
}
</script>