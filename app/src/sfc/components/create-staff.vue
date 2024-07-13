<template>
<div>
  <b-row class="mb-4">
    <b-col sm="5">
      <label>所属</label>
      <b-form-select v-model="form.staff.affiliation" :options="filteredAffiliation"></b-form-select>
      <div v-if=" ! $v.form.staff?.affiliation.required" class="error-message">*必須項目です</div>
    </b-col>
    <b-col sm="5">
      <label>氏名</label>
      <b-form-input v-model="form.authUser.displayName"></b-form-input>
      <div v-if=" ! $v.form.authUser?.displayName.required" class="error-message">*必須項目です</div>
    </b-col>
  </b-row>
  <b-row class="my-4">
    <b-col sm="5">
      <label>UID<span class="warning-message">&nbsp;※システム管理者のみ表示</span></label>
      <b-form-input v-model="form.authUser.uid"></b-form-input>
    </b-col>
  </b-row>
  <b-row class="my-4">
    <b-col sm="5">
      <b-form-group>
        <label>ログイン可否</label>
        <b-form-radio-group class="mt-2" v-model="form.authUser.disabled">
          <b-form-radio :value="true">不可</b-form-radio>
          <b-form-radio :value="false">可</b-form-radio>
        </b-form-radio-group>
      </b-form-group>
    </b-col>
  </b-row>
  <b-row class="my-4">
    <b-col sm="5">
      <b-form-group>
        <label>メールアドレス <span style="font-size: 0.8em; color: lightgray;">＝ログインID</span></label>
        <b-form-input v-model="form.authUser.email" :disabled="form.authUser.disabled"></b-form-input>
        <div class="warning-message">※実在しないメールアドレスも可能</div>
      </b-form-group>
    </b-col>
    <b-col sm="5">
      <b-form-group description="">
        <label>パスワード</label>
        <b-form-input :type="controls.isPasswordShown ? 'text' : 'password' " autocomplete="off" v-model="form.authUser.password" :disabled="form.authUser.disabled"></b-form-input>
      </b-form-group>
    </b-col>
    <b-col sm="2" class="pl-0">
      <div @click="controls.isPasswordShown = ! controls.isPasswordShown">
        <BIconEyeFill style="height: 1.5em; width: 1.5em; color: var(--secondary); margin-top: 2em;"></BIconEyeFill>
      </div>
    </b-col>
  </b-row>
  <b-row class="my-4">
    <b-col sm="5">
      <b-form-group>
        <label>権限</label>
        <b-form-select v-model="form.customClaims.role" :options="$tstore.bundles.options.role"></b-form-select>
        <div v-if=" ! $v.form.customClaims?.role.required" class="error-message">*必須項目です</div>
      </b-form-group>
    </b-col>
  </b-row>
  <b-row class="my-4">
    <b-col>
      <b-table-simple bordered small stacked="sm" class="permission-chart">
        <b-thead head-variant="light">
          <b-tr>
            <b-th>権限</b-th>
            <b-th>閲覧</b-th>
            <b-th>書き込み</b-th>
          </b-tr>
        </b-thead>
        <b-tbody>
          <b-tr>
            <b-td stacked-heading="権限">社員/特権</b-td>
            <b-td stacked-heading="閲覧">全データ可</b-td>
            <b-td stacked-heading="書き込み">全データ可</b-td>
          </b-tr>
          <b-tr>
            <b-td stacked-heading="権限">社員/一般</b-td>
            <b-td stacked-heading="閲覧">工事一覧のみ<br>(ただし社内の全工事を閲覧可)</b-td>
            <b-td stacked-heading="書き込み">日報更新可<br>(工事の責任者/日報管理者の場合のみ)</b-td>
          </b-tr>
          <b-tr>
            <b-td stacked-heading="権限">外注先</b-td>
            <b-td stacked-heading="閲覧">工事一覧の内、自分がアサインされた工事のみ<br>(関わりのない工事は表示されない)</b-td>
            <b-td stacked-heading="書き込み">日報更新可<br>(工事の責任者/日報管理者の場合のみ)</b-td>
          </b-tr>
        </b-tbody>
      </b-table-simple>
    </b-col>
  </b-row>
  <hr>
  <template v-if="form.staff.affiliation !== 'out-source'">
    <StaffConfidentialEditor embedded-mode :confidential="form.staffConfidential" :staff="form.staff" @change="updateStaffOrStaffConfidential" @validate="updateIsConfidentialValid"></StaffConfidentialEditor>
  </template>
  <b-row class="mt-4">
    <b-col>
      <div class="d-flex align-items-center justify-content-end">
        <b-spinner v-if="controls.isRegistering" variant="info" class="mr-3"></b-spinner>
        <b-button variant="danger" @click="register" :disabled="$v.$invalid || ! controls.isConfidentialValid || controls.isRegistering">登録</b-button>
      </div>
    </b-col>
  </b-row>
</div>
</template>

<style scoped>
.permission-chart {
  font-size:0.8em;
}
</style>

<script lang="ts">
import { to } from 'await-to-js'
import { email, required, requiredIf } from 'vuelidate/lib/validators';

import { BIconEyeFill } from 'bootstrap-vue/esm/icons'
import StaffConfidentialEditor from '@/sfc/components/staff-confidential-editor.vue'
import { FbAuthUser, FbCustomClaims } from '@/schema/FbAuthUser';
import { Staff } from '@/schema/Staff';
import { StaffConfidential } from '@/schema/StaffConfidential'
import { AxiosError } from 'axios';

export default {
  components: {
    StaffConfidentialEditor, BIconEyeFill,
  },
  data() {
    return {
      controls: {
        isRegistering: false,
        isConfidentialValid: false,
        isPasswordShown: false,
      },
      form: {
        staff: new Staff(),
        authUser: new FbAuthUser(),
        customClaims: new FbCustomClaims(),
        staffConfidential: new StaffConfidential(),
      },
    }
  },
  validations: {
    form: {
      authUser: {
        email: {
          email,
          required: requiredIf((parent: FbAuthUser) => {
            return parent.disabled === false
          })
        },
        password: {
          required: requiredIf((parent: FbAuthUser) => {
            return parent.disabled === false
          })
        },
        displayName: {required},
        emailVerified: {},
        disabled: {},
        uid: {},
      },
      staff: {
        staffId: {},
        staffName: {},
        staffNameNormalized: {},
        companyId: {},
        companyName: {},
        affiliation: {required},
      },
      customClaims: {
        role: {required},
        isAccountant: {}
      }
    },
  },
  methods: {
    async register() {
      this.controls.isRegistering = true
      try {
        await this.registerWrapped()
      } catch(e) {
        alert(`予期せぬエラーが発生しました。\n内容：${JSON.stringify(e)}`)
      }
      this.controls.isRegistering = false
    },
    async registerWrapped() : Promise<void> {
      if(this.form.staff.affiliation === "in-source") {
        this.form.staff.companyName = process.env.COMPANY_NAME
        this.form.staff.companyId = 1000
      }

      if(this.form.authUser.uid) {
        const uid = parseInt(this.form.authUser.uid)
        this.form.staff.staffId = uid
        this.form.staffConfidential.staffId = uid
      } else {
        const [error1, nextId] = await to(this.$firebase.db.fetchNextStaffId(this.form.staff.affiliation))
        if(error1) {
          console.log(`error: ${JSON.stringify(error1)}`);
          this.$bvModal.msgBoxOk(this.newLiner(`UIDの最大値を取得できませんでした。`))
          return
        }
        this.form.authUser.uid = nextId.toString()
        this.form.staff.staffId = nextId
        this.form.staffConfidential.staffId = nextId
      }

      if(this.form.authUser.disabled) {
        this.form.authUser.email = `${this.$tstore.auth.disabledEmailPrefix}${this.form.authUser.uid}@${process.env.EMAIL_DOMAIN}`
        this.form.authUser.password = this.generatePassword()
      }

      this.form.staff.staffName = this.form.authUser.displayName
      const [error2] = await to<any, AxiosError>(this.$firebase.db.createUser({
        staff: this.form.staff,
        staffConfidential: this.form.staffConfidential,
        authUser: this.form.authUser,
        customClaims: this.form.customClaims,
      }))
      if(error2) {
        console.log(`Error: ${error2.message};`)
        const responseString = JSON.stringify(error2.response)
        if(responseString.includes("The user with the provided uid already exists.")) {
          this.$bvModal.msgBoxOk(this.newLiner(`エラー：既に使用されているUID(${this.form.authUser.uid})です。\n\n※過去に削除されたユーザーのデータが残っている可能性があります。`))
          return
        } else if(responseString.includes("The email address is already in use by another account.")) {
          this.$bvModal.msgBoxOk(this.newLiner(`エラー：既に使用されているメールアドレス(${this.form.authUser.email})です。`))
          return
        }
        this.$bvModal.msgBoxOk(this.newLiner(`エラー：ユーザーの作成に失敗しました。\n\n${error2.message}`))
        return
      }
      this.$bvModal.msgBoxOk(this.newLiner(`ユーザーの作成が完了しました。`))
    },
    generatePassword() {
      var length = 12,
          charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          retVal = "";
      for (var i = 0, n = charset.length; i < length; ++i) {
          retVal += charset.charAt(Math.floor(Math.random() * n));
      }
      return retVal;
    },
    modifyConfidentialValidStatus(isConfidentialValid: boolean): void {
      this.controls.isConfidentialValid = isConfidentialValid
    },
    updateIsConfidentialValid(isConfidentialValid: boolean): void {
      this.controls.isConfidentialValid = isConfidentialValid
    },
    updateStaffOrStaffConfidential(staffOrStaffConfidential : Staff|StaffConfidential) {
      if(staffOrStaffConfidential instanceof Staff) {
        this.form.staff = staffOrStaffConfidential
      } else {
        this.form.staffConfidential = staffOrStaffConfidential
      }
    },
  }
}
</script>