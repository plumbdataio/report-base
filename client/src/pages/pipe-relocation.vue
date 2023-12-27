<template>
<div class="p-3 grand-container">
  <b-card bg-variant="dark">
    <b-card-title>
      <b-row align-h="between" class="w-100 m-0">
        <b-col class="align-self-center">
          <div class="text-nowrap text-white text-center">配管追跡システム</div>
        </b-col>
        <b-col class="text-right" cols="auto">
          <b-button size="sm" variant="danger" @click="moveTo('/')">閉じる</b-button>
        </b-col>
      </b-row>
    </b-card-title>
    <div style="background: white; min-height: 5px;"></div>
    <div class="text-right" style="color: gray;">version: {{version}}</div>
  </b-card>
  <b-card class="mt-3" body-bg-variant="light" body-class="p-3">
    <b-card-body class="p-0">
      <template v-if="current != null">
        <b-container>
          <b-row class="mt-2 mb-4">
            <b-col>
              <div class="text-center font-weight-bold">{{current.getStatics().spoolId}}</div>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <b-table
                stacked
                class="m-0"
                style="border-bottom: 2pt solid #dee2e6;"
                :items="[current]"
                :fields="fields.current"
              >
                <template #cell(inhouseId)="data">
                  <div>{{ data.item.getStatics().inhouseId }}</div>
                </template>
                <template #cell(materialClassified)="data">
                  <div>{{ data.item.getStatics().materialClassified }}</div>
                </template>
                <template v-if="statusOptions.length > 0" #cell(status)="data">
                  <div>{{ statusOptions.find(s => s.value === data.item.status).text}}</div>
                </template>
                <template v-if="locationOptions.length > 0" #cell(location)="data">
                  <div>{{ data.item.location != null ? locationOptions.find(s => s.value === data.item.location).text : ""}}</div>
                </template>
              </b-table>
            </b-col>
          </b-row>
        </b-container>
      </template>
      <template v-else>
        <b-overlay show spinner-small spinner-variant="warning"></b-overlay>
      </template>
    </b-card-body>
  </b-card>

  <b-card class="mt-3" body-bg-variant="light" body-class="p-3">
    <b-card-body class="p-0">
      <b-container>
        <b-row>
          <b-col cols="auto" class="p-0">
            <b-button variant="info" size="sm" @click="isHistoryShown = ! isHistoryShown">{{isHistoryShown ? "▲" :  "▼"}}</b-button>
          </b-col>
          <b-col class="align-self-center">
            <label class="m-0 ml-3">変更履歴</label>
          </b-col>
        </b-row>
        <b-row v-if="isHistoryShown && statusOptions.length > 0 && materialOptions.length > 0 && locationOptions.length > 0" class="mt-3">
          <b-col cols="auto" class="p-0 w-100 bg-white">
            <b-table
              small
              stacked
              outlined
              striped
              :items="current.histories"
              :fields="fields.histories"
              class="m-0"
              :table-variant="current.histories == null || current.histories.length === 0 ? '' : 'warning'"
              show-empty
              empty-text="この配管にはまだ過去の履歴がありません"
            >
              <template #cell(status)="data">
                <div>{{ statusOptions.find(s => s.value === data.item.status).text}}</div>
              </template>
              <template v-if="locationOptions.length > 0" #cell(location)="data">
                <div>{{ data.item.location != null ? locationOptions.find(s => s.value === data.item.location).text : ""}}</div>
              </template>
            </b-table>
          </b-col>
        </b-row>
      </b-container>
    </b-card-body>
  </b-card>

  <b-card class="mt-3" body-bg-variant="light" body-class="p-3">
    <b-card-body class="p-0">
      <b-container>
        <b-row>
          <b-col>変更が発生した日：</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-datepicker locale="ja" label-no-date-selected="選択してください" label-help="" v-model="next.changesOccuredOn"></b-datepicker>
          </b-col>
        </b-row>
        <b-row>
          <b-col>変更後のステータス：</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-select :options="statusOptions" v-model="next.status"></b-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col>Rev(変更がある場合のみ編集)：</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-input v-model="next.revision"></b-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            {{
              /manufactured/.test(next.status) ? "保管場所" :
              "移動先"
            }}：
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-select v-model="next.location" :options="locationOptions"></b-select>
          </b-col>
        </b-row>
        <b-row>
          <b-col>氏名</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-input v-model="next.changesReportedBy"></b-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col>備考</b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-textarea v-model="next.remarks" :max-rows="100"></b-textarea>
          </b-col>
        </b-row>
        <b-row class="mt-2">
          <b-col>
            <b-input-group class="justify-content-between">
              <b-button variant="outline-primary" size="sm" @click="applyLastUpdate">前回の変更内容を再利用</b-button>
              <b-button variant="warning" @click="register" :disabled=" ! isValidated">登録</b-button>
            </b-input-group>
          </b-col>
        </b-row>
      </b-container>
    </b-card-body>
  </b-card>
</div>
</template>

<style scoped>
.col {
  padding: 0;
}
.grand-container {
  max-width: 500px;
  margin: auto;
}
</style>

<script>
import Firebase from '@/firebase.js'
import dayjs from 'dayjs';
import 'dayjs/locale/ja'
dayjs.locale('ja')

export default {
  async created() {
    this.key = this.$route.query?.key
    const typeOptions = await Firebase.fetchTypeOptions()
    this.statusOptions = Object.values(typeOptions.pipeStatus)
    this.materialOptions = Object.values(typeOptions.pipeMaterial)
    this.locationOptions = Object.values(typeOptions.pipeLocation)

    await Firebase.fetchPipeStatus(this.key)
    .then(data => {
      this.current = new Pipe(data)
      this.next.revision = this.current.revision
    })
  },
  data() {
    return {
      version: "0.0.1",
      isHistoryShown: false,
      key: null,
      current: null,
      next: new Pipe(),
      fields: {
        current:[
          {key: 'inhouseId', label: '自社採番ID'},
          {key: 'materialClassified', label: '材質'},
          {key: 'revision', label: 'Rev'},
          {key: 'status', label: 'ステータス'},
          {key: 'location', label: '所在地'},
          {key: 'changesOccuredOn', label: '変更発生日'},
          {key: 'changesReportedBy', label: '最終更新者'},
          {key: 'remarks', label: '備考'},
        ],
        histories: [
          {sortable: true, key: 'revision', label: 'Rev'},
          {sortable:false, key: 'status', label: 'ステータス'},
          {sortable: true, key: 'location', label: '所在地'},
          {sortable: true, key: 'changesOccuredOn', label: '変更発生日'},
          {sortable: true, key: 'changesReportedBy', label: '最終更新者'},
          {sortable: true, key: 'remarks', label: '備考'},
        ]
      },
      statusOptions: [],
      materialOptions: [],
      locationOptions: [],
    }
  },
  computed: {
    isValidated() {
      return this.next?.status != null && this.next?.location != null && this.next?.changesOccuredOn != null && this.next?.changesReportedBy != null
    }
  },
  methods: {
    async applyLastUpdate() {
      const message = this.$createElement("div",
        [
          this.$createElement("span", "直前に登録した内容を適用します。"),
          this.$createElement("br", ""),
          this.$createElement("span", "よろしいですか？"),
          this.$createElement("br", ""),
          this.$createElement("br", ""),
          this.$createElement("strong", "※注意：revisionは引き継がれません"),
        ]
      )
      if( ! await this.$bvModal.msgBoxConfirm(message, {centered: true})) {
        return
      }

      this.next.reuse(this.$store.getters.lastData)
    },
    register() {
      this.next.merge(this.current)
      Firebase.updatePipeStatus(this.key, this.next.toObject())
      .then(async result => {
        this.$store.commit('lastData', this.next.toObject())
        await this.$bvModal.msgBoxOk("変更が完了しました。", {centered: true})
        this.$router.go({path: this.$router.currentRoute.path, force: true})
      }).catch(error => {
        console.log(`Error: ${JSON.stringify(error)}`);
      })
    },
    moveTo() {
      window.close()
    }
  }
}



class Pipe {

  #static = {
    inhouseId: null,
    spoolId: null,
    materialClassified: null,
    materialDetail: null,
    nominalDiameter: null,
    workId: null,
  };

  revision;
  status;
  location;
  lastUpdateOn;
  changesOccuredOn;
  changesReportedBy;
  remarks;
  histories = [];

  #History = class {
    revision;
    status;
    location;
    lastUpdateOn;
    changesOccuredOn;
    changesReportedBy;
    remarks;
    constructor(obj) {
      Object.keys(this).forEach(key => {
        if(obj?.[key] != null) {
          this[key] = obj[key]
        }
      })
    }
  }

  constructor(obj) {
    if(obj == null) {
      return
    }

    const staticKeys = Object.keys(this.#static)
    const publicKeys = Object.keys(this)
    
    Object.keys(obj).forEach(key => {
      if (staticKeys.includes(key)) {
        this.#static[key] = obj[key]
      } else if(publicKeys.includes(key)) {
        this[key] = obj[key]
      }
    })
  }

  toObject() {
    this.lastUpdateOn = dayjs().format()
    console.log(`lastUpdateOn: ${dayjs().format()}`);

    return {...this, ...this.#static}
  }

  reuse(old) {
    if( ! old instanceof Pipe) {
      throw new Error(`${arguments.callee.name}:First argument should be an instance of Pipe class.`)
    }

    const publicKeys = Object.keys(this)
    Object.keys(old).forEach(key => {
      if(publicKeys.includes(key)) {
        this[key] = this[key] ?? old[key]
      }
    })

    return this
  }

  merge(old) {
    if( ! old instanceof Pipe) {
      throw new Error(`${arguments.callee.name}:First argument should be an instance of Pipe class.`)
    }

    const staticKeys = Object.keys(this.#static)
    Object.keys(old.#static).forEach(key => {
      if (staticKeys.includes(key)) {
        this.#static[key] = this.#static[key] ?? old.#static[key]
      }
    })

    this.histories = old?.histories ?? []
    this.histories.push(new this.#History(old))

    return this
  }

  getStatics() {
    return this.#static
  }
}
</script>