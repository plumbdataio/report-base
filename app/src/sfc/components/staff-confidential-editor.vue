<template>
<b-container class="d-flex flex-column gap-10">
  <template v-if=" ! embeddedMode">
    <b-row align-v="center">
      <b-col cols="4">氏名</b-col>
      <b-col cols="4">
        <b-input disabled :value="form.staff.staffName"></b-input>
      </b-col>
    </b-row>
  </template>
  <b-row align-v="center">
    <b-col cols="4">給与形態</b-col>
    <b-col cols="4">
      <b-select :options="$tstore.bundles.options.salaryType" v-model="form.confidential.salaryType"></b-select>
      <div v-if="$v.form.confidential?.salaryType.$invalid" class="error-message">※必須項目です</div>
    </b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">基本給</b-col>
    <b-col cols="4">
      <b-input number v-model="form.confidential.baseRate"></b-input>
      <div v-if=" ! $v.form.confidential?.baseRate.required" class="error-message">※必須項目です</div>
      <div v-if=" ! $v.form.confidential?.baseRate.integer" class="error-message">※整数を入力してください</div>
    </b-col>
    <b-col cols="4" class="p-0">
      {{ form.confidential.salaryType != null ? $optionValueTo("salaryType", form.confidential.salaryType, "unit") : "" }}
    </b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">標準出勤時間</b-col>
    <b-col cols="4">
      <b-input v-model="form.staff.workStart"></b-input>
      <div v-if=" ! $v.form.staff?.workStart.required" class="error-message">※必須項目です</div>
      <div v-if=" ! $v.form.staff?.workStart.timeFormatted" class="error-message">※時刻の形式(例：01:23)で入力してください</div>
    </b-col>
    <b-col cols="4" class="p-0">時間/日</b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">標準退勤時間</b-col>
    <b-col cols="4">
      <b-input v-model="form.staff.workEnd"></b-input>
      <div v-if=" ! $v.form.staff?.workEnd.required" class="error-message">※必須項目です</div>
      <div v-if=" ! $v.form.staff?.workEnd.timeFormatted" class="error-message">※時刻の形式(例：01:23)で入力してください</div>
    </b-col>
    <b-col cols="4" class="p-0">時間/日</b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">標準休憩時間</b-col>
    <b-col cols="4">
      <b-input v-model="form.staff.breakTime"></b-input>
      <div v-if=" ! $v.form.staff?.breakTime.required" class="error-message">※必須項目です</div>
      <div v-if=" ! $v.form.staff?.breakTime.timeFormatted" class="error-message">※時刻の形式(例：01:23)で入力してください</div>
    </b-col>
    <b-col cols="4" class="p-0">時間/日</b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">みなし残業</b-col>
    <b-col cols="4">
      <b-input number v-model="form.confidential.expectedOvertime"></b-input>
      <div v-if=" ! $v.form.confidential?.expectedOvertime.required" class="error-message">※必須項目です</div>
      <div v-if=" ! $v.form.confidential?.expectedOvertime.decimal" class="error-message">※数字を入力してください</div>
    </b-col>
    <b-col cols="4" class="p-0">時間/月</b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">特記事項</b-col>
    <b-col cols="8">
      <b-textarea :rows="5" v-model="form.confidential.remarks"></b-textarea>
    </b-col>
  </b-row>
  <b-row align-v="center"><b-col><hr></b-col></b-row>
  <b-row align-v="center">
    <b-col cols="2">交通費</b-col>
    <b-col cols="8" class="d-flex flex-column gap-10">
      <b-row align-v="center">
        <b-col cols="3" class="text-right p-0 sub-label">有無：</b-col>
        <b-col cols="6">
          <b-select :options="$tstore.bundles.options.transportationAllowance" v-model="form.confidential.allowance.transportation.calcOption"></b-select>
          <div v-if=" ! $v.form.confidential?.allowance.transportation.calcOption" class="error-message">※必須項目です</div>
        </b-col>
      </b-row>
      <b-row align-v="center">
        <b-col cols="3" class="text-right p-0 sub-label">単価：</b-col>
        <b-col cols="6">
          <b-input number v-model="form.confidential.allowance.transportation.rate"></b-input>
          <div v-if=" ! $v.form.confidential?.allowance.transportation.rate" class="error-message">※必須項目です</div>
          <div v-if=" ! $v.form.confidential?.allowance.transportation.rate.integer" class="error-message">※整数を入力してください</div>
        </b-col>
        <b-col cols="3" class="p-0">
          {{
            form.confidential.allowance.transportation.calcOption == "per-day"
            ? "円/日"
            : form.confidential.allowance.transportation.calcOption == "fixed"
            ? "円/月"
            : ""
          }}
        </b-col>
      </b-row>
    </b-col>
  </b-row>
  <hr class="m-0 my-1 p-0 border-0">
  <b-row align-v="center">
    <b-col cols="2">出張手当</b-col>
    <b-col cols="2" class="text-right p-0 sub-label">単価：</b-col>
    <b-col cols="4">
      <b-input number v-model="form.confidential.allowance.travel.rate"></b-input>
    </b-col>
    <b-col cols="4" class="p-0">円/日</b-col>
  </b-row>
  <hr class="m-0 my-1 p-0 border-0">
  <b-row align-v="center">
    <b-col cols="2">食事手当</b-col>
    <b-col cols="8">
      <template v-for="meal in $tstore.bundles.options.meals">
        <b-row :key="`meal-${meal.value}`" align-v="center" class="mb-2">
          <b-col cols="3" class="text-right p-0 sub-label">{{ meal.text }}：</b-col>
          <b-col cols="6">
            <b-input number v-model="form.confidential.allowance[meal.value].rate"></b-input>
          </b-col>
          <b-col cols="3" class="p-0">円/日</b-col>
        </b-row>
      </template>
    </b-col>
  </b-row>
  <b-row align-v="center">
    <b-col>
      <hr>
    </b-col>
  </b-row>
  <b-row align-v="center">
    <b-col cols="4">その他手当(月額固定)</b-col>
    <b-col>
      <template v-for="(misc, index) in form.confidential.allowance.misc">
        <b-card :key="`misc-${index}`" body-class="d-flex flex-column gap-10" class="mb-2" style="background-color: #fafafa">
          <b-row align-v="center">
            <b-col cols="3">名称</b-col>
            <b-col cols="6">
              <b-input v-model="misc.name"></b-input>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="3">金額</b-col>
            <b-col cols="6">
              <b-input number v-model="misc.rate"></b-input>
            </b-col>
            <b-col cols="3">円/月</b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="3">算入項目</b-col>
            <b-col cols="6">
              <b-select :options="$tstore.bundles.options.countIn" v-model="misc.countIn"></b-select>
            </b-col>
          </b-row>
          <b-row align-v="center">
            <b-col cols="3">備考</b-col>
            <b-col cols="6">
              <b-textarea v-model="misc.remarks"></b-textarea>
            </b-col>
          </b-row>
          <b-row>
            <b-col class="text-right">
              <b-button variant="outline-danger" @click="form.confidential.deleteMiscAllowance(index)">
                <b-icon-trash></b-icon-trash>
              </b-button>
            </b-col>
          </b-row>
        </b-card>
      </template>
    </b-col>
  </b-row>
  <b-row>
    <b-col cols="4">
    </b-col>
    <b-col>
      <b-button @click="form.confidential.addMiscAllowance()">＋ その他手当を追加</b-button>
    </b-col>
  </b-row>
  <b-row v-if=" ! embeddedMode">
    <b-col cols="12" class="d-flex w-100 justify-content-end">
      <b-spinner v-if="controls.isUpdating" variant="info" class="mr-2"></b-spinner>
      <b-button variant="success" :disabled="$v.$invalid || controls.isUpdating" @click="updateConfidential">保存</b-button>
    </b-col>
  </b-row>
</b-container>
</template>

<style scoped>
</style>

<script lang="ts">
import {BIconTrash} from 'bootstrap-vue/esm/icons'
import { to } from 'await-to-js'
import { Staff } from '@/schema/Staff'
import { StaffConfidential, StaffConfidentialValidator } from '@/schema/StaffConfidential'
import { decimal, required } from 'vuelidate/lib/validators'

export default {
  created() {
    if( ! this.embeddedMode) {
      this.form.staff = this.staff
      this.form.confidential = this.confidential
    }
  },
  props: {
    embeddedMode: {
      type: Boolean,
      required: false,
      default: false
    },
    staff: {
      type: Staff,
      required: true,
    },
    confidential: {
      type: StaffConfidential,
      required: true,
    }
  },
  components: {
    BIconTrash,
  },
  data() {
    return {
      controls: {
        isUpdating: false,
      },
      form: {
        staff: new Staff(),
        confidential: new StaffConfidential(),
      }
    }
  },
  validations() {
    const timeFormatted = (value: string) => {
      return /^[0-9]{2}\:[0-9]{2}$/.test(value)
      ? parseInt(value.split(":")[0]) <= 23 && parseInt(value.split(":")[1]) <= 59
      : false
    }

    return {
      form: {
        confidential: StaffConfidentialValidator(),
        staff: {
          workStart: {required, timeFormatted},
          workEnd: {required, timeFormatted},
          breakTime: {required, timeFormatted},
        }
      }
    }
  },
  watch: {
    "form.confidential": {
      deep: true,
      immediate: true,
      handler() {
        this.$emit("validate", ! this.$v.$invalid)
        this.$emit("change", this.form.confidential)
      }
    },
    "form.staff": {
      deep: true,
      immediate: true,
      handler() {
        this.$emit("validate", ! this.$v.$invalid)
        this.$emit("change", this.form.staff)
      }
    },
  },
  methods: {
    async updateConfidential() {
      this.controls.isUpdating = true
      try{
        await this.updateConfidentialWrapped()
      } catch(e) {
        console.log(e);
      }
      this.controls.isUpdating = false
    },
    async updateConfidentialWrapped() {
      if( ! this.form.confidential) {
        throw Error(`Error: this.form.confidential shouldn't be nullish.`)
      }

      const [error1] = await to<void, Error>(this.$firebase.db.upsertStaff(this.form.staff.docId, this.form.staff.toJSON()))
      if(error1) {
        this.$bvModal.msgBoxOk(this.newLiner(`エラー1：保存できませんでした。\n\nもう一度試してみて、エラーが発生する場合はシステム管理者にお問い合わせください。`))
        throw Error(`Error: failed to update staff -> ${error1.message}`)
      }

      const [error2] = await to<void, Error>(this.$firebase.db.upsertStaffCofidential(this.form.confidential.docId, this.form.confidential.toJSON()))
      if(error2) {
        this.$bvModal.msgBoxOk(this.newLiner(`エラー2：保存できませんでした。\n\nもう一度試してみて、エラーが発生する場合はシステム管理者にお問い合わせください。`))
        return
      }

      this.$bvModal.msgBoxOk(this.newLiner(`保存が完了しました。`))
    },
  }
}
</script>