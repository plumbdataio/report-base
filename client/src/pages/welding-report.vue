<template>
  <div class="main p-md-4 pt-2 mb-4">
    <div v-if=" ! isSpoolnumsFetched" class="h-100 w-100 mt-5 text-center">
      <div style="color: gray;">
        データの取得中...</div>
      <b-spinner variant="primary" class="mt-3"></b-spinner>
    </div>
    <b-container v-if="isSpoolnumsFetched" class="form-container">
      <b-row class="justify-content-center">
        <b-col cols="12">
          <b-card bg-variant="light" class="mb-2">
            <b-card-title>
              <b-row align-h="between">
                <b-col>
                  <div>溶接出来高日報</div>
                </b-col>
                <b-col class="text-right">
                  <b-button size="sm" variant="outline-info" @click="moveTo('/')">トップへ戻る</b-button>
                </b-col>
              </b-row>
            </b-card-title>
            <b-card-text>
              <div class="text-right" style="color: gray;">version: {{version}}</div>
              <div style="background: #17a2b8; min-height: 5px;"></div>
            </b-card-text>
          </b-card>
          <b-card class="mb-2">
            <b-card-group>
              <b-card bg-variant="light" title="作業日">
                <b-card-body>
                  <b-form-datepicker value-as-date hide-header reset-button label-reset-button="クリア" label-help="" locale="ja-JP" :placeholder="datepickerPlaceholder" :date-format-options="datepickerFormat" v-model="date"></b-form-datepicker>
                </b-card-body>
              </b-card>
              <b-card bg-variant="light" title="氏名">
                <b-card-body>
                  <b-input v-model="name"></b-input>
                </b-card-body>
              </b-card>
            </b-card-group>
          </b-card>
          <template v-for="(work, index) in works">
            <b-card class="mb-2" :key="`work-${index}`">
              <b-card-title>
                <div class="work-title">
                  <div>作業{{index+1}}</div>
                  <b-button size="sm" @click="deleteWork(index)">削除</b-button>
                </div>
              </b-card-title>
              <b-card-group>
                <b-card bg-variant="light" class="mb-2" title="仮付 or 本組">
                  <b-card-body>
                    <b-radio-group v-model="work.assembleType">
                      <b-radio name="assembleType" value="仮付">仮付</b-radio>
                      <b-radio name="assembleType" value="本組">本組</b-radio>
                    </b-radio-group>
                  </b-card-body>
                </b-card>
                <b-card bg-variant="light" class="mb-2" title="スプール番号">
                  <b-card-body>
                    <b-select v-model="work.spoolNum">
                      <template v-for="(spoolNum, index) in spoolNums">
                        <b-select-option :key="`${spoolNum}+${index}`" :value="spoolNum">{{spoolNum}}</b-select-option>
                      </template>
                    </b-select>
                  </b-card-body>
                </b-card>
              </b-card-group>
              <b-card bg-variant="light" class="mb-2" title="溶接番号">
                <b-card-body style="overflow-x: scroll;">
                  <b-checkbox-group class="text-nowrap">
                    <template v-for="n in 150">
                      <b-checkbox :key="`work${index}-cb${n}`" v-model="work.weldingPoints" :value="n">{{n}}</b-checkbox>
                    </template>
                  </b-checkbox-group>
                </b-card-body>
                <div class="mt-3 ml-2">選択済み：{{formatted(work.weldingPoints)}}</div>
              </b-card>
            </b-card>
          </template>
          <b-button-toolbar class="align-items-center">
            <b-button variant="secondary" size="sm" @click="addWork">＋</b-button>
            <label class="mb-0 mx-1">作業を追加</label>
          </b-button-toolbar>
          <b-button-toolbar class="justify-content-end">
            <b-spinner v-if="isRegistering" variant="info" class="mr-4"></b-spinner>
            <b-button variant="outline-secondary" size="sm" @click="register" :disabled="isRegistering">登録</b-button>
          </b-button-toolbar>
          <b-card v-if="cannotRegisterReport" bg-variant="info" class="mt-2">
            <b-card-body>※保存ができない場合は、本社管理部までご連絡下さい。</b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <transition name="original-modal" appear>
      <template v-if="isRegistering">
        <div class="original-modal">
          <div>
            <a>保存中です...<br><br>※最大で20秒程度かかることがあります</a>
          </div>
        </div>
      </template>
    </transition>
  </div>
</template>

<style scoped>
.main {
  min-width: 100%;
  min-height: 100%;
}

.original-modal {
  z-index: 9999;
  background-color: #222222;
  opacity: 0.4;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;  
  text-align: center;
}
.original-modal-enter, .original-modal-leave-to {
  opacity: 0;
}
.original-modal-enter-active, .original-modal-leave-active {
  transition: opacity 0.5s;
}
.form-container {
  max-width: 700px;
}
.work-title {
  display: flex;
  justify-content: space-between;
}
@media screen and (max-width: 768px) {
.form-container {
  width: 100%;
}

}
</style>


<script>
import GoogleSheets from '@/google-sheets.js'

export default {
  beforeMount() {
    this.version = process.env.VERSION

    GoogleSheets.fetchSpoolnums().then(response => {
      console.log(`response.data: response.data`);
      const data = response.data
      this.spoolNums = []
      if(data !== null && data !== undefined)
        this.spoolNums = data
      else {
        this.$bvModal.msgBoxOk("スプール番号の取得に失敗しました。画面を更新して、同じエラーが出る場合は、本社の管理部までご連絡下さい。", {centered: true})
        this.cannotRegisterReport = true
      }

      this.isSpoolnumsFetched = true
    })
    console.log(`spoolNums: ${JSON.stringify(this.spoolNums)}`);

    // Add a blank work
    this.addWork()

    // Fetch name from cache if available
    this.name = this.$store.getters.reporterName
  },
  data(){
    return {
      version: "0.0.0",
      isSpoolnumsFetched: false,
      isRegistering: false,
      cannotRegisterReport: false,
      datepickerPlaceholder: "",
      datepickerFormat: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      },
      spoolNums: [],
      date: new Date(),
      name: "",
      works: []
    }
  },
  validations: {

  },
  computed: {
    formatted() {
      return function(weldingPoints) {
        return weldingPoints.toString().split(',').sort((a,b)=>a-b).join(', ')
      }
    }
  },
  methods: {
    addWork() {
      const newWork = {
        assembleType: null,
        spoolNum: null,
        weldingPoints: []
      }
      this.$set(this.works, Object.keys(this.works).length, newWork)
    },
    deleteWork(index) {
      this.$delete(this.works, index)
    },
    async register() {     
      await this.registerAsync()
      this.isRegistering = false
    },
    async registerAsync() {
      if(this.date === null || this.date === undefined || this.date === "")
        return this.$bvModal.msgBoxOk("作業日が記入されていません。", {centered: true})
      if(this.name === null || this.name === undefined || this.name === "")
        return this.$bvModal.msgBoxOk("氏名が記入されていません。", {centered: true})

      let isValid = true
      this.works.some(work => {
        Object.values(work).some(value => {
          if(value === undefined || value === null || value === "" || value === []) {
            isValid = false
            return true //break if not valid
          }
        })
        return ! isValid //break if not valid
      })
      if( ! isValid)
        return this.$bvModal.msgBoxOk("作業箇所に未入力の箇所があります。", {centered: true})
      
      this.isRegistering = true

      const rows = []
      this.works.forEach(work => {
        const row = [
          new Date().toLocaleString(),
          this.date.toLocaleDateString(),
          this.name,
          work.assembleType,
          work.spoolNum,
          work.weldingPoints.sort((a,b)=>a-b).toString()
        ]
        rows.push(row)
      })

      const returnCode = await GoogleSheets.registerReport(rows)
      console.log(`returnCode: ${returnCode}`);
      this.$store.commit("reporterName", this.name)
      this.isRegistering = false
      if(returnCode === "success") {
        return this.$bvModal.msgBoxOk("日報の保存が完了しました。", {centered: true})
      } else if(returnCode === "duplicated"){
        return this.$bvModal.msgBoxOk("既に同じ内容のデータが存在するため、保存されませんでした。", {centered: true})
      } else if(returnCode === "timeout"){
        return this.$bvModal.msgBoxOk("タイムアウト: 20秒待っても保存できませんでした。再度お試し下さい。", {centered: true})
      } else 
        return this.$bvModal.msgBoxOk("日報の保存に失敗しました。", {centered: true})
    },
    moveTo(destination) {
      var isInputting = false
      this.works.some(work => {
        if(work.assembleType !== null || work.spoolNum !== null || work.weldingPoints.length > 0) {
          isInputting = true
          return true
        }
      })
      if( ! isInputting || confirm("入力中のデータがあります。\nトップへ戻りますか？"))
        this.$router.push(destination)
    }
  }
}
</script>