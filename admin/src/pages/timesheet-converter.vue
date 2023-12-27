<template>
<div>
  <b-container class="p-0">
    <HeaderRow>出勤簿</HeaderRow>
    <b-card class="mt-2" body-class="p-3">
      <b-card-title>元データのアップロード</b-card-title>
      <b-card-body class="p-0">
        <template v-for="location of Object.keys(perLocation).filter(key => perLocation[key].active)">
          <b-row :key="`title__${location}`" class="mx-0 mt-2">
            <b-col>
              <label class="mb-1">{{perLocation[location].title}}</label>
            </b-col>
          </b-row>
          <b-row :key="`file__${location}`" md="2" sm="1" class="mx-0" align-v="center">
            <b-col md="8" sm="12" class="my-sm-1">
              <b-form-file v-model="perLocation[location].file" placeholder="ファイルが選択されていません" browse-text="開く"></b-form-file>
            </b-col>
            <b-col md="auto" sm="12" class="my-sm-1">
              <b-button size="sm" @click="extractData(perLocation[location].file, location)" :disabled="perLocation[location].file == null">アップロード</b-button>
              <b-spinner v-if="isUploading" class="ml-3"></b-spinner>
            </b-col>
          </b-row>
        </template>
      </b-card-body>
    </b-card>
    <b-card title="出勤簿として出力" class="mt-4" body-class="p-3">
      <b-row class="mx-0 mt-2">
        <b-col>
          <label class="mb-1">出力先の出勤簿</label>
        </b-col>
      </b-row>
      <b-row cols="2" class="mx-0 mb-2">
        <b-col class="my-sm-1">
          <b-form-file v-model="outputFile" placeholder="ファイルが選択されていません" browse-text="開く" @input="extractSheetName"></b-form-file>
        </b-col>
      </b-row>
      <b-row class="mx-0 mt-2">
        <b-col>
          <label class="mb-1">出力月</label>
        </b-col>
      </b-row>
      <b-row md="2" sm="1" class="mx-0 mb-2" align-v="center">
        <b-col md="auto" sm="12" class="my-sm-1">
          <MonthPicker v-model="selectedMonthForOutput"></MonthPicker>
        </b-col>
      </b-row>
      <b-row class="mx-0 mt-2">
        <b-col>
          <label class="mb-1">会社名</label>
        </b-col>
      </b-row>
      <b-row md="2" sm="1" class="mx-0 mb-2" align-v="center">
        <b-col class="my-sm-1">
          <b-select v-model="companyName">
            <b-select-option :value="companyName">{{ companyName }}</b-select-option>
          </b-select>
        </b-col>
      </b-row>
      <b-row class="mx-0 mt-2">
        <b-col>
          <label class="mb-1">シート名を選択 (複数可)</label>
        </b-col>
      </b-row>
      <b-row md="2" sm="1" class="mx-0 mb-2" align-v="center">
        <b-col class="my-sm-1">
          <b-overlay :show="isExtractingSheetName" spinner-type="grow" spinner-variant="warning">
            <b-select :disabled="outputFile == null" multiple v-model="selectedSheets" :options="sheetOptions"></b-select>
          </b-overlay>
        </b-col>
      </b-row>
      <b-row md="2" sm="1" class="mx-0" align-v="center">
        <b-col md="auto" sm="12">
          <b-button-toolbar>
            <b-button size="sm" :disabled="outputFile == null || selectedSheets.length === 0 || isFilling" @click="fillTemplate">書き出し</b-button>
            <b-spinner v-if="isFilling" class="ml-3"></b-spinner>
          </b-button-toolbar>
        </b-col>
      </b-row>
    </b-card>
    <b-row class="m-4">
      <div>
        <MonthPicker v-model="selectedMonthForInvestigation"></MonthPicker>
      </div>
      <b-button-toolbar class="ml-2">
        <b-button size="sm" variant="outline-info" @click="turnOnDebugMode" :disabled="isTurningOnDebugMode">調査</b-button>
        <b-button class="ml-2" size="sm" variant="outline-secondary" @click="eraseDataOnSelectedMonth" :disabled="isTurningOnDebugMode">データを削除</b-button>
        <b-spinner v-if="isTurningOnDebugMode" variant="info" class="ml-3"></b-spinner>
      </b-button-toolbar>
    </b-row>
  </b-container>
  <template v-if="isDebugMode">
    <b-table-simple sticky-header="90vh" class="table-bordered">
      <b-thead v-once>
        <b-tr>
          <b-th :stickyColumn="true" :rowspan="2">名前</b-th>
          <template v-for="date in $dayjs(selectedMonthForInvestigation).endOf('month').date()">
            <b-th :key="`date-header_${date}`" class="text-center" v-html="`${date}<br>(${$dayjs(`${selectedMonthForInvestigation}-${date.toString().padStart(2,'0')}`).format('ddd')})`"></b-th>
          </template>
        </b-tr>
      </b-thead>
      <b-tbody>
        <template v-for="[name, data] in Object.entries(timesheetData)">
          <b-tr :key="name">
            <b-th :sticky-column="true">{{name}}</b-th>
            <template v-for="date in $dayjs(selectedMonthForInvestigation).endOf('month').date()">
              <b-td :key="`${name}_${date}`" class="text-center">{{debugCellData(data, date)}}</b-td>
            </template>
          </b-tr>
        </template>
      </b-tbody>
    </b-table-simple>
  </template>
</div>
</template>

<style scoped>
thead >>> th {
  background-color: #739abc !important;
  color: white !important;
}
</style>

<script>
import Excel from '@/js/excel.js'

export default {
  data() {
    return {
      isOptionsLoaded: false,
      isExtractingSheetName: false,
      isFilling: false,
      isUploading: false,
      isDebugMode: false,
      isTurningOnDebugMode: false,
      fetched: false,
      perLocation: {
        hikari: {
          file: null,
          title: "光本社(ALSOKカード)",
          translation: "光本社",
          active: true,
          type: "alsok",
        },
        kubo: {
          file: null,
          title: "久保工場 (指紋)",
          translation: "久保",
          active: true,
          type: "fingerprint",
        },
        dainifuto: {
          file: null,
          title: "第二埠頭工場 (指紋)",
          translation: "第二埠頭",
          active: true,
          type: "fingerprint",
        },
        yobisaka: {
          file: null,
          title: "呼坂工場 (指紋)",
          translation: "呼坂",
          active: false,
          type: "fingerprint",
        },
        hirao: {
          file: null,
          title: "平生工場 (指紋)",
          translation: "平生",
          active: true,
          type: "fingerprint",
        },
        ohfunato: {
          file: null,
          title: "大船渡工場 (指紋)",
          translation: "大船渡",
          active: false,
          type: "fingerprint",
        },
        shimata: {
          file: null,
          title: "島田 - ネクスドア事務所 (指紋)",
          translation: "島田",
          active: false,
          type: "fingerprint",
        },

        // active === false
        yamada: {
          file: null,
          title: "久保工場 (指紋)",
          translation: "久保",
          active: false,
          type: "fingerprint",
        },
        shione: {
          file: null,
          title: "潮音工場 (指紋)",
          translation: "潮音",
          active: false,
          type: "fingerprint",
        },
        kozuo: {
          file: null,
          title: "光本社(ALSOKカード)",
          translation: "小周防",
          active: false,
          type: "alsok",
        },
        nakiri: {
          file: null,
          title: "奈切工場 (指紋)",
          translation: "奈切",
          active: false,
          type: "fingerprint",
        },
      },
      inputStatus: {
        'loaded-from-file': 'ファイル',
        'edited': '修正済み',
        'input-by-human': '手入力',
      },
      outputFile: null,
      timesheetData: {},
      companyName: process.env.COMPANY_NAME,
      selectedSheets: [],
      sheetOptions: [],
      selectedMonthForOutput: this.$dayjs().add(-1, 'M').format('YYYY-MM'),
      selectedMonthForInvestigation: this.$dayjs().add(-1, 'M').format('YYYY-MM'),
      defaultYear: this.$dayjs().month(this.$dayjs().month()).year(),
      defaultMonth: this.$dayjs().month(this.$dayjs().month()).month()
    }
  },
  computed: {
    lastDate() {
      
    }
  },
  methods: {
    async extractData(file, location) {
      const type = this.perLocation[location].type;
      if(type === "alsok" && file.name.split(".").pop() !== "csv") {
        return await this.$bvModal.msgBoxOk('エラー：該当の拠点では、ファイルの末尾が「.csv」のもののみアップロード可能です。',{centered: true})
      } else if(type === "fingerprint" && file.name.split(".").pop() !== "xlsx") {
        return await this.$bvModal.msgBoxOk('エラー：該当の拠点では、ファイルの末尾が「.xlsx」のもののみアップロード可能です。',{centered: true})
      }

      if( ! await this.$bvModal.msgBoxConfirm('リマインダー：氏名の確認は終わりましたか？\n氏名が空白や「ゲストXX」のままでは、\n正しくデータが出力されません。\n\n確認済みの場合は「OK」を、そうでなければ「キャンセル」を押して下さい。', {centered: true})) {
        return
      }

      Excel.extractData(file, location, type)
    },
    readFileAndExecuteCallback(callback) {
      let reader = new FileReader()
      reader.onload = () => callback(reader)
      reader.readAsArrayBuffer(this.outputFile)
      return reader.onload
    },
    async extractSheetName() {
      if(this.outputFile == null) {
        this.sheetOptions = []
        console.log(`Do nothing as this.outputFile is empty...`);
        return
      }

      this.isExtractingSheetName = true
      this.readFileAndExecuteCallback(async (reader) => {
        try {
          const sheetNameList = await Excel.extractSheetName(reader.result)
          this.sheetOptions = sheetNameList.map(sheetName => ({value: sheetName, text: sheetName}))
        } catch(e) {
          this.$bvModal.msgBoxOk("エラー：出力先ファイルからシート名を抽出できませんでした。", {centered: true, buttonSize: "sm"})
        }
        this.isExtractingSheetName = false
      })
    },
    async fillTemplate() {
      this.isFilling = true

      this.readFileAndExecuteCallback(async (reader) => {
        const array = this.selectedMonthForOutput.split('-')
        const year = parseInt(array[0])
        const month = parseInt(array[1])
        try {
          await Excel.fillTemplate(reader.result, this.outputFile.name, this.companyName, this.selectedSheets, year, month)
        } catch(e) {
          console.dir(e)
          this.$bvModal.msgBoxOk(
            (e.message.includes("empty")
            ? "エラー：指定された出力月のデータが存在しません。データのアップロード状況を再度ご確認下さい。"
            : "エラー：予期しないエラーが発生しました。\nシステム管理者に問い合わせて下さい。")
            ,{centered: true})
        }
        this.isFilling = false
      })
    },
    async turnOnDebugMode() {
      if(this.selectedMonthForInvestigation == null)
        return alert('エラー：調査対象の月を上で選んで下さい。')

      this.isTurningOnDebugMode = true
      const [year, month] = this.selectedMonthForInvestigation.split('-')
      this.$set(this, 'timesheetData', await Excel.fetchAndMerge(year, month))
      console.log(JSON.stringify(this.timesheetData, null, 2));
      this.isDebugMode = true
      this.isTurningOnDebugMode = false
    },
    eraseDataOnSelectedMonth() {
      const [year, month] = this.selectedMonthForInvestigation.split('-')
      if( ! confirm(`${year}年${month}月のアップロード済みデータを全て削除します。\n\nよろしいですか？`))
        return

      this.isTurningOnDebugMode = true
      this.$firebase.db.deleteTimesheetDataOn(this.selectedMonthForInvestigation)
      .then(result => {
        alert('削除が完了しました。')
      })
      .finally(() => this.isTurningOnDebugMode = false)
    },
    debugCellData(data, date) {
      const temp = data[`${this.selectedMonthForInvestigation}-${date.toString().padStart(2,'0')}`]
      if(temp == null) {
        return ""
      }
      if(temp.in_location === "公休") {
        return temp.in_location
      }
      if(temp.in_location != "" && this.perLocation[temp?.in_location]?.translation[0] == null) {
        return "現"
      }
      return `${temp?.in_time ? `${temp?.in_time}(${this.perLocation[temp?.in_location]?.translation[0]})`: ""}\n${temp?.out_time ? `${temp?.out_time}(${this.perLocation[temp?.out_location]?.translation[0]})`: ""}`
    }
  }
}
</script>