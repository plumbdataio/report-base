<template>
<div class="card-wrapper d-flex flex-column">
  <h4 style="color: var(--primary); width: 100%; text-align: center;">最後に登録した<br :class="{'d-none': ! $mq.match(/xs|sm/)}">「自分の日報」から<br :class="{'d-none': ! $mq.match(/xs|sm/)}">データをコピーできます</h4>
  <b-button variant="danger" class="align-self-center mt-0" :style="$mq.match(/md|lg|xl*/) ? 'width: 300px;' : ''">コピーする</b-button>
  <b-card title="勤怠">
    <b-container>
      <b-row>
        <b-col>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="12" md="2" class="text-md-right">
          <label class="text-nowrap">氏名:</label>
        </b-col>
        <b-col cols="12" md="7">
          <!-- TODO: 新規の名前登録の方法を考えて追加する -->
          <b-select :select-size="5" multiple v-model="form.names">
            <b-select-option-group label="" :options="demo.staff" value-field="name" text-field="name">
              <template #first>
                <b-select-option disabled :value="null">※複数選択可(PCの場合はCtrl＋クリック)</b-select-option>
              </template>
            </b-select-option-group>
          </b-select>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="12" md="2" class="text-md-right">
          <label>(氏名を追加)</label>
        </b-col>
        <b-col cols="9" md="3">
          <b-input v-model="controls.newName"></b-input>
        </b-col>
        <b-col cols="3" md="auto" :class="{'text-right text-nowrap w-100 pl-0': $mq === 'sm' || $mq === 'md'}">
          <b-button variant="primary" @click="addNewName">追加</b-button>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="12" md="2" class="text-md-right">
          <label>勤務日:</label>
        </b-col>
        <b-col cols="12" md="3">
          <DatePicker :reset-button="false" size="md" v-model="form.date"></DatePicker>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="12" md="2" class="text-md-right">
          <label>出勤状況:</label>
        </b-col>
        <b-col cols="12" md="3">
          <b-select :options="$tstore.bundles.options.attendance" v-model="form.attendance"></b-select>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="12" md="2" class="text-md-right">
          <label>勤務時間:</label>
        </b-col>
        <b-col cols="12" md="3">
          <b-timepicker value="08:00"></b-timepicker>
        </b-col>
        <b-col cols="12" md="1" class="text-center">
          <div>〜</div>
        </b-col>
        <b-col cols="12" md="3">
          <b-timepicker value="16:30"></b-timepicker>
        </b-col>
      </b-row>
      <!-- <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
        <b-col cols="6" md="2" class="text-md-right">
          <label>食事手当:</label>
        </b-col>
        <b-col cols="6" md="4">
          <b-checkbox-group switches :stacked="$mq === 'sm' || $mq === 'md'" button-variant="info" :options="$tstore.bundles.options.meals" v-model="form.meals" :class="$mq === 'sm' || $mq === 'md' ? 'd-flex flex-column row-gap-20' : ''"></b-checkbox-group>
        </b-col>
      </b-row>
      <b-row align-v="center" align-h="start" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
        <b-col cols="6" md="2" class="text-md-right">
          <label>出張手当:</label>
        </b-col>
        <b-col cols="6" md="2">
          <b-checkbox switch v-model="form.travelAllowance"></b-checkbox>
        </b-col>
      </b-row> -->
    </b-container>
  </b-card>
  <b-card title="工番別稼働時間">
    <b-container>
      <template v-for="num in form.works.length">
        <b-row :key="`work-${num}`" align-v="center" :class="{'row-gap-10': $mq === 'sm' || $mq === 'md'}">
          <b-col order="0" order-md="0" cols="6" md="2" class="text-md-right">
            <label>工番{{num}}:</label>
          </b-col>
          <b-col order="3" order-md="1" cols="12" md="5">
            <b-select :options="projects" v-model="form.works[num-1].projectId"></b-select>
          </b-col>
          <b-col order="4" order-md="2" cols="12" md="3">
            <b-timepicker v-model="form.works[num-1].duration"></b-timepicker>
          </b-col>
          <b-col order="1" order-md="3" cols="2" md="auto" offset="4" offset-md="0" class="text-md-right">
            <b-icon-trash :scale="1.5" @click="deleteEntry(num)"></b-icon-trash>
          </b-col>
        </b-row>
        <hr :key="`hr-${num}`">
      </template>
      <b-row>
        <b-col cols="auto" md="2" class="text-md-right pr-0 pr-md-3">
          <div>新規工番:</div>
        </b-col>
        <b-col cols="auto" md="10" class="pl-1 pl-md-3">
          <div @click="addNewEntry">
            <b-icon-plus-square :font-scale="1.5"></b-icon-plus-square>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </b-card>
  <div class="d-flex align-items-center justify-content-end gap-20">
    <div class="d-flex gap-10">
      <div>工番合計:</div>
      <div>{{ durationSum }}</div>
    </div>
    <b-button style="width: fit-content;" variant="primary" @click="register">登録</b-button>
  </div>
</div>
</template>

<style scoped>
.card-wrapper > *:not(:first-child) {
  margin-top: 20px;
}
.container > *:not(:first-child) {
  margin-top: 20px;
}
</style>

<script>
import {BIconTrash, BIconPlusSquare} from "bootstrap-vue/esm/icons"
export default {
  components: {
    BIconTrash, BIconPlusSquare,
  },
  props: {
    projects: {
      default: [],
      type: Array,
      required: true,
    }
  },
  data() {
    return {
      flags: {},
      controls: {
        newName: '',
      },
      form:{
        travelAllowance: false,
        names: [],
        meals: [],
        attendance: "regular-work",
        works: [new Entry()],
      },
      demo: {
        staff: [
          {
            name: "田中 太郎",
          },
          {
            name: "山田 五郎",
          },
          {
            name: "佐藤 八郎",
          },
          {
            name: "鈴木 健太",
          },
        ],
        projectIds: [
          {text: "501: ◯◯◯◯株式会社 / ◯◯工場 / 配管工事", value: ""},
          {text: "502: 株式会社✕✕✕✕ / ✕✕製薬 / 純水供給装置", value: ""},
          {text: "503: △△△△ / △△ / ユニット据付工事", value: ""},
        ]
      }
    }
  },
  computed: {
    durationSum() {
      return this.form.works.reduce((prev, current) => {
        const array = current?.duration?.split(':') ?? ['0', '0', '0']
        return prev.add(array[0], 'hour').add(array[1], 'minute').add(array[2], 'second')
      }, this.$dayjs.duration(0)).format('HH:mm') 
    },
  },
  methods: {
    addNewName() {
      this.demo.staff.push({name: this.controls.newName})
    },
    deleteEntry(num) {
      this.form.works = this.form.works.filter((v, i) => i !== num-1)
      // this.$set(this, "form.works", form.works)
    },
    addNewEntry() {
      console.log("adding...");
      this.form.works.push(new Entry())
    },
    register() {
      this.$bvModal.msgBoxOk("登録しました。")
    },
  }
}

import dayjs from 'dayjs'
import ja from 'dayjs/locale/ja'
dayjs.locale(ja) // add plug-in to show day of week in Japanese
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration)

class Entry {
  projectId;
  duration = dayjs.duration(0).format('HH:mm:ss');
}
</script>