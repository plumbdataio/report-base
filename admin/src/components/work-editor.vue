<template>
  <b-card body-class="m-2 p-0" class="my-3">
    <b-card-title class="d-flex mb-0">
      <b-button
        v-if="mode === 'new'"
        v-b-toggle.input-conatiner
        size="sm"
        variant="outline-secondary"
        class="mr-2"
      >{{isCollapsed ? "▲" : "▼"}}</b-button>
      <div>{{mode === "new" ? "工事番号の新規発行" : "変更"}}</div>
    </b-card-title>
    <b-collapse id="input-conatiner" v-model="isCollapsed">
      <b-container>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="会社名*" label-cols-sm="5" label-align-sm="right" :disabled="mode === 'modify'">
              <b-form-select v-model="selectedProfile" size="sm" class="limit-width">
                <b-select-option :value="null" disabled>(選択してください)</b-select-option>
                <template v-if="isProfilesFetched">
                  <template v-for="profile in profiles">
                    <b-select-option :key="`selected-profile_${profile.initials}`" :value="profile">{{profile.initials}} : {{profile.name}}</b-select-option>
                  </template>
                </template>
                <b-select-option value="none" disabled>---------------</b-select-option>
                <b-select-option value="invokeAddClientModal">＋ 新しい取引先を追加</b-select-option>
              </b-form-select>
              <b-modal id="addClientModal" :ok-disabled="newProfile.name == '' || isInvalidInitials" @ok="registerNewProfile">
                <div>
                  <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="会社名" label-cols-sm="4" label-align-sm="right" :disabled="mode === 'modify'">
                    <b-form-input class="limit-width" size="sm" v-model="newProfile.name"></b-form-input>
                  </b-form-group>
                  <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="企業コード" label-cols-sm="4" label-align-sm="right" :disabled="mode === 'modify'">
                    <b-form-input class="limit-width" size="sm" v-model="newProfile.initials" :formatter="val => val.substring(0,2).toUpperCase().replace(/[^A-Z]/g,'')" placeholder="アルファベット2文字"></b-form-input>
                  </b-form-group>
                  <b-card class="mt-2">
                    <b-table-simple sticky-header small no-border-collapse>
                      <b-thead>
                        <b-th>企業コード</b-th>
                        <b-th>会社名</b-th>
                      </b-thead>
                      <b-tbody>
                        <template v-for="profile in profiles">
                          <b-tr :key="profile.initials">
                            <b-td>{{profile.initials}}</b-td>
                            <b-td>{{profile.name}}</b-td>
                          </b-tr>
                        </template>
                      </b-tbody>
                    </b-table-simple>
                  </b-card>
                </div>
              </b-modal>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="月度*" label-cols-sm="5" label-align-sm="right">
              <div class="d-flex align-items-center">
                <MonthPicker class="limit-width" v-model="yyyymm" displayFormat="YYYY年M月度" :disabled="mode !== 'new'"></MonthPicker>
              </div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" :label="`工事番号（自動生成）*`" label-cols-sm="5" label-align-sm="right">
              <div class="d-flex align-items-center">
                <b-input readonly size="sm" class="limit-width" :value="localWorkId"></b-input>
              </div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="案件名/プロジェクト名など*" label-cols-sm="5" label-align-sm="right">
              <b-form-input size="sm" class="limit-width" v-model="localWork.description"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row align-h="center" class="mb-3 ">
          <b-col>
            <b-form-group label="" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
              <div class="remarks">※日報入力時のことなども考慮して、工番を特定しやすい表記にしてください</div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group label="ステータス*" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
              <b-form-select size="sm" class="limit-width" :options="orderStatusOptions" v-model="localWork.status" :disabled="Object.keys(orderStatusOptions).length === 0"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="mode !== 'new'" :class="{'mb-2': mode !== 'new'}" align-h="center">
          <b-col>
            <b-form-group label="" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
              <div class="error-message">※工事番号の変更が必要な場合は、<br>一旦「削除」ボタンで削除してから<br>登録し直してください。</div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="製作開始(予定)" label-cols-sm="5" label-align-sm="right">
              <DatePicker class="limit-width" v-model="localWork.startAt" placeholder="未定" labelResetButton="未定"></DatePicker>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="製作終了(予定)" label-cols-sm="5" label-align-sm="right">
              <DatePicker class="limit-width" v-model="localWork.endAt" placeholder="未定" labelResetButton="未定"></DatePicker>
              <div v-if=" ! $v.localWork.isStartAtNotBeforeEndAt" class="error-message mb-2">※終了日が開始日より前になっています</div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="製作拠点*" label-cols-sm="5" label-align-sm="right">
              <b-form-checkbox-group v-model="localWork.workplace" :options="workplaceOptions" class="limit-width">
                <b-spinner v-if="workplaceOptions.length === 0" small variant="warning"></b-spinner>
              </b-form-checkbox-group>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="$store.getters.isAccountant">
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="1人工の平均単価(社員)" label-cols-sm="5" label-align-sm="right">
              <b-form-input size="sm" class="limit-width" number v-model="localWork.costPerManDayInSource"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row v-if="$store.getters.isAccountant">
          <b-col>
            <b-form-group class="m-0 custom-form-group" label-class="text-nowrap" label="1人工の平均単価(外注)" label-cols-sm="5" label-align-sm="right">
              <b-form-input size="sm" class="limit-width" number v-model="localWork.costPerManDayOutSource"></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row align-h="center" class="mb-3 ">
          <b-col>
            <b-form-group label="" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
              <div class="remarks">※平均単価の入力欄は経理担当者の画面にしか表示されません</div>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row class="mt-2">
          <b-col>
            <template v-if="localWork.unitIds == null || localWork.unitIds.length === 0">
              <b-form-group label="ユニット等" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
                <b-input class="limit-width" size="sm" value="(なし)" disabled></b-input>
              </b-form-group>
            </template>
            <template v-for="(unitId, index) in localWork.unitIds">
              <b-form-group :key="`new-unit-id-${index}`" :label="`ユニット等番号 ${index+1}`" label-cols-sm="5" label-align-sm="right" class="m-0 custom-form-group" label-class="text-nowrap">
                <b-form-input size="sm" class="limit-width d-inline valign-middle" v-model="localWork.unitIds[index]"></b-form-input>
                <b-button size="sm" variant="outline-secondary" @click="localWork.unitIds.splice(index,1)">×</b-button>
              </b-form-group>
            </template>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-button-toolbar class="mt-2 justify-content-end">
              <b-spinner v-if="isRegistering"></b-spinner>
              <b-button :disabled="isRegistering" size="sm" variant="outline-primary" @click="addBlankUnit">ユニット等追加</b-button>
              <b-button :disabled="isRegistering" v-if="mode === 'new'" size="sm" class="ml-1" @click="clearNewEntry">クリア</b-button>
              <b-button :disabled="isRegistering || $v.$invalid" size="sm" variant="primary" class="ml-1" @click="registerNewEntry">{{mode === "new" ? "登録" : mode === "modify" ? "保存" : ""}}</b-button>
            </b-button-toolbar>
          </b-col>
        </b-row>
      </b-container>
    </b-collapse>
  </b-card>
</template>

<style scoped>
.limit-width {
  max-width: 180px;
}
.valign-middle {
  vertical-align: middle;
}
.error-message, .remarks {
  font-size: 0.7em;
}
.error-message {
  color:red;
}
.remarks {
  color: lightgray;
}
.custom-form-group >>> .form-row {
  align-items: center;
}
@media screen and (max-width: 768px) {
  .custom-form-group >>> .form-row>.col {
    flex-direction: column;
    align-items: flex-start !important;
  }
}
</style>

<script>
import { required } from 'vuelidate/lib/validators'
import cloneDeep from 'lodash/cloneDeep'
import dayjs from 'dayjs'
// add plug-in to show day of week in Japanese
import ja from 'dayjs/locale/ja'
dayjs.locale(ja)

import MonthPicker from '@/components/month-picker.vue'
export default {
  created() {
    // Migrate props into data to avoid vue warning "Do not modify props directly"
    this.localWork = cloneDeep(this.value)
    this.localWorkId = this.workId
    this.$firebase.db.fetchTypeOptions("orderStatus").then(result => {
      this.orderStatusOptions = result
    })
    this.$firebase.db.fetchTypeOptions("workplace").then(result => {
      this.workplaceOptions = result?.filter(workplace => /factory|misc/.test(workplace.category))
    })

    this.initialize()
  },
  components: {
    MonthPicker,
  },
  props: {
    value: {
      type: Object,
      default: () => {
        return {
          description: "",
          status: null,
          unitIds: [],
          startAt: null,
          endAt: null,
          workplace: []
        }
      }
    },
    workId: {
      type: String,
      default: ""
    },
    mode: String
  },
  data() {
    return {
      separator: "-",
      isCollapsed: this.mode !== "new",
      isAddClientModalShown: false,
      isProfilesFetched: false,
      isRegistering: false,
      doubleDigitCounter: null,
      selectedProfile: null,
      newProfile: {},
      profiles: [],
      yyyymm: this.$dayjs().format("YYYY-MM"),
      localWork: {},
      localWorkId: "",
      latestWorkIdList: [],
      orderStatusOptions: [],
      workplaceOptions: [],
    }
  },
  validations: {
    localWorkId: {
      required,
      formatted: value => value.search(/^[A-Z]{2}-[0-9]{4}-[0-9]{2}$/) >= 0
    },
    localWork: {
      status: {
        required,
      },
      description: {
        required,
      },
      workplace: {
        required,
      },
      isStartAtNotBeforeEndAt: localWork => {
        return localWork.startAt == null || localWork.startAt === ""
            || localWork.endAt == null || localWork.endAt === ""
            || localWork.startAt <= localWork.endAt
      }
    }
  },
  watch: {
    selectedProfile: {
      deep: true,
      immediate: true,
      handler: 'updateData'
    },
    yyyymm: {
      handler: 'updateData'
    },
  },
  computed: {
    isInvalidInitials: function() {
      return this.newProfile.initials == null
            || this.newProfile.initials.length !== 2
            || this.profiles.find(profile => profile?.initials === this.newProfile?.initials) != null
    },
  },
  methods: {
    async initialize() {
      console.log(`### initialize() called`);
      
      this.newProfile = {
        initials: "",
        name: "",
      }
      
      // Needs database access
      this.latestWorkIdList = Object.keys(await this.$firebase.db.fetchWorkId())
      this.profiles = await this.$firebase.db.fetchWorkIdProfiles()

      if(this.mode !== "new") {
        this.selectedProfile = this.profiles.find(p => p.initials === this.localWorkId?.split(this.separator)[0]) ?? {}
        console.log(`### selectedProfile has been set: ${JSON.stringify(this.selectedProfile)}`);

        const tempArray = this.localWorkId?.split(this.separator)
        let yy, mm
        if(tempArray[0] === process.env.PROJECT_PREFIX) {
          yy = tempArray[1].substr(2,2)
          mm = tempArray[2]
        } else {
          yy = tempArray[1].substr(0,2)
          mm = tempArray[1].substr(2,2)
        }
        this.yyyymm = `20${yy}-${mm}`
      }

      this.isProfilesFetched = true
    },
    async updateData(newVal, oldVal) {
      if(this.mode !== "new") {
        return
      }

      console.log(`### updateData() called`);
      if(newVal === "invokeAddClientModal") {
        this.$nextTick().then(() => {
          this.selectedProfile = oldVal
        })
        this.$bvModal.show('addClientModal')
        return
      }
      if(this.selectedProfile == null || this.yyyymm == null) {
        this.localWorkId = "※会社名を選んで下さい"
        return 
      }

      if(this.selectedProfile.initials === process.env.PROJECT_PREFIX) {
        const array = this.yyyymm.split(this.separator)
        this.localWorkId = `${this.selectedProfile.initials}-${array[0]}-${array[1]}`
      } else {
        const yymm = this.$dayjs(this.yyyymm).format("YYMM")
        const currentDoubleDigit = this.latestWorkIdList.filter(workId =>
          workId.startsWith(this.selectedProfile?.initials)
          && workId.split(this.separator)[1] === yymm
        )?.sort().pop()

        this.doubleDigitCounter = currentDoubleDigit == null
          ? "01"
          : (parseInt(currentDoubleDigit.split(this.separator)[2]) + 1).toString().padStart(2, 0)

        this.localWorkId = `${this.selectedProfile?.initials}-${yymm}-${this.doubleDigitCounter}`
      }

    },
    clearNewEntry() {
      if( ! confirm("内容を全てクリアします。\nよろしいですか？"))
        return

      this.localWorkId = ""
      this.localWork.unitIds.splice(0, this.localWork.unitIds.length)
    },
    addBlankUnit() {
      if(Boolean(this.localWork.unitIds))
        this.localWork.unitIds.push('')
      else
        this.localWork.unitIds = ['']
    },
    async registerNewEntry() {
      let hasInvalidUnitId = false
      this.localWork.unitIds.some(unitId => {
        if(unitId == null || unitId === "") {
          hasInvalidUnitId = true
          return true
        }
      })
      if(hasInvalidUnitId)
        return alert("空白のユニットIDがあります。")

      this.isRegistering = true

      // Assemble and prepare data
      this.localWorkId = this.localWorkId.replace('/', '／')
      this.localWork.unitIds = this.localWork.unitIds.map(unitId => unitId.replace('/', '／'))
      if(this.localWork?.costPerManDayInSource !== null) {
        this.localWork.costPerManDayInSource = parseInt(this.localWork.costPerManDayInSource) || null
      }
      if(this.localWork?.costPerManDayOutSource !== null) {
        this.localWork.costPerManDayOutSource = parseInt(this.localWork.costPerManDayOutSource) || null
      }

      const newWork = {}
      newWork[this.localWorkId] = {...this.localWork}

      await this.$firebase.db.registerWork(newWork)
      .then(result => {
        alert(`保存が完了しました。\n\n注意：再度検索を押すまで、変更内容は画面に反映されません。`)
        this.$emit("input", this.localWork)
      })
      this.isRegistering = false
    },
    registerNewProfile() {
      this.$firebase.db.registerNewProfile(this.newProfile)
      .then(async () => {
        this.$bvModal.msgBoxOk("登録が完了しました。", {
          centered: true,
        })
        .then(() => {
          this.initialize()
        })
      })
      .catch(() => {
        this.$bvModal.msgBoxOk("登録に失敗しました！", {
          centered: true,
          title: "警告",
        })
      })
      this.initialize()
    },
  }
}
</script>