<template>
  <b-modal v-model="value" hide-header no-close-on-esc no-close-on-backdrop>
    <template v-if="controls.isInitializing" class="text-center">
      <div class="w-100 text-center">
        <b-spinner variant="info"></b-spinner>
      </div>
    </template>
    <template v-else>
      <b-container class="d-flex flex-column gap-10">
        <b-row align-v="center">
          <b-col sm>
            <label>所属</label>
          </b-col>
          <b-col sm>
            <b-form-select v-model="form.staff.affiliation" :options="$tstore.bundles.options.affiliation"></b-form-select>
          </b-col>
        </b-row>
        <!-- <b-row>
          <b-col sm>
            <label>外注先社名</label>
          </b-col>
          <b-col sm>
            <b-form-input disabled v-model="form.staff.companyName"></b-form-input>
            <div class="error-message" v-if=" ! $v.form.staff?.companyName.required">※必須項目です</div>
          </b-col>
        </b-row> -->
        <b-row align-v="center">
          <b-col sm>
            <label>氏名</label>
          </b-col>
          <b-col sm>
            <b-input v-model="form.staff.staffName" :state="$v.form.staff?.staffName.$invalid ? false : null"></b-input>
            <div class="error-message" v-if=" ! $v.form.staff?.staffName.required">※必須項目です</div>
          </b-col>
        </b-row>
        <!-- <b-row align-v="center">
          <b-col sm>
            <label>電話番号</label>
          </b-col>
          <b-col sm>
            <b-input v-model="form.staff.tel"></b-input>
          </b-col>
        </b-row> -->
        <b-row align-v="center">
          <b-col sm>
            <label>権限</label>
          </b-col>
          <b-col sm>
            <b-form-select v-model="form.customClaims.role" :options="$tstore.bundles.options.role"></b-form-select>
          </b-col>
        </b-row>
        <b-row align-v="center">
          <b-col sm>
            <label>ログイン</label>
          </b-col>
          <b-col sm>
            <b-radio-group v-model="form.authUser.disabled">
              <b-radio :value="true">不可</b-radio>
              <b-radio :value="false">可</b-radio>
            </b-radio-group>
          </b-col>
        </b-row>
        <b-row align-v="center">
          <b-col sm>
            <label>メールアドレス<br>(=ログインID)</label>
          </b-col>
          <b-col sm>
            <b-input v-model="form.authUser.email" :disabled="form.authUser.disabled" :state="$v.form.authUser?.email.$invalid ? false : null"></b-input>
            <div class="error-message" v-if=" ! $v.form.authUser?.email.required">※必須項目です</div>
            <div class="error-message" v-if=" ! $v.form.authUser?.email.email">※有効なメールアドレスの形式ではありません</div>
            <!-- <div class="error-message" v-if=" ! $v.form.authUser?.email.format">※デフォルトのメールアドレスから変更して下さい</div> -->
          </b-col>
        </b-row>
        <b-row align-v="center">
          <b-col sm>
            <label>パスワードを変更しますか？</label>
          </b-col>
          <b-col sm>
            <b-radio-group v-model="controls.isPasswordRenewing" :disabled="form.authUser.disabled">
              <b-radio :value="true">はい</b-radio>
              <b-radio :value="false">いいえ</b-radio>
            </b-radio-group>
          </b-col>
        </b-row>
        <b-row align-v="center">
          <b-col sm>
            <label>パスワード</label>
          </b-col>
          <b-col sm>
            <b-input type="password" v-model="form.authUser.password" :disabled="form.authUser.disabled || ! controls.isPasswordRenewing" :state="$v.form.authUser?.password.$invalid ? false : null"></b-input>
            <div class="error-message" v-if=" ! $v.form.authUser?.password.required">※必須項目です</div>
            <div class="error-message" v-if=" ! $v.form.authUser?.password.minLength">※8文字以上入力して下さい</div>
            <div class="error-message" v-if=" ! $v.form.authUser?.password.maxLength">※最大15文字までです</div>
          </b-col>
        </b-row>
        <b-row align-v="center">
          <b-col sm>
            <label>パスワード(再入力)</label>
          </b-col>
          <b-col sm>
            <b-input type="password" v-model="form.passwordRepeated" :disabled="form.authUser.disabled || ! controls.isPasswordRenewing"></b-input>
            <div class="error-message" v-if=" ! $v.form.passwordRepeated?.samePassword">※パスワードが一致しません</div>
          </b-col>
        </b-row>
      </b-container>
    </template>
    <template #modal-footer>
      <b-spinner v-if="controls.isUpdating" variant="info"></b-spinner>
      <b-button @click="update" :disabled="controls.isUpdating || $v.$invalid">保存</b-button>
      <b-button variant="info" @click="closeModal">キャンセル</b-button>
    </template>
  </b-modal>
</template>

<style scoped>
</style>

<script lang="ts">
import { FbAuthUser, FbCustomClaims } from '@/schema/FbAuthUser';
import { Staff } from '@/schema/Staff';
import { email, maxLength, minLength, required, requiredIf } from 'vuelidate/lib/validators';

export default {
  props: {
    value: {
      type: Boolean,
      required: true
    },
    staffId: {
      type: Number,
      required: true,
    }
  },
  data() {
    return {
      controls: {
        isPasswordRenewing: false,
        isUpdating: false,
        isInitializing: false,
      },
      form: {
        staff: new Staff(),
        authUser: new FbAuthUser(),
        customClaims: new FbCustomClaims(),
        passwordRepeated: "",
      }
    }
  },
  validations() {
    const vm = this
    return {
      form: {
        staff: {
          companyName: {required},
          staffName: {required},
        },
        authUser: {
          email: {
            required: requiredIf((parent) => ! parent.disabled),
            email
          },
          password: {
            required: requiredIf(() => vm.controls.isPasswordRenewing && vm.form.authUser.disabled === false),
            minLength: minLength(8),
            maxLength: maxLength(16)
          },
        },
        customClaims: {
          role: {required},
        },
        passwordRepeated: {
          required: requiredIf(() => vm.controls.isPasswordRenewing && vm.form.authUser.disabled === false),
          samePassword: (value) => vm.controls.isPasswordRenewing && vm.form.authUser.disabled === false ? vm.form.authUser.password === value : true,
        }
      },
      controls: {

      }
    }
  },
  watch: {
    value: function(value) {
      if(value) {
        this.init()
      }
    }
  },
  methods: {
    async init(): Promise<void> {
      this.controls.isInitializing = true
      const {authUser, customClaims} = await this.$firebase.db.fetchAuthUserAndCustomClaims(this.staffId)
      this.form.staff = await this.$firebase.db.fetchStaffById(this.staffId)
      this.form.authUser = authUser
      this.form.customClaims = customClaims
      this.controls.isPasswordRenewing = false
      this.controls.isInitializing = false
    },
    async update(): Promise<void> {
      this.controls.isUpdating = true

      if( ! this.controls.isPasswordRenewing) {
        delete this.form.authUser.password
      }
      this.form.authUser.displayName = this.form.staff.staffName
      await this.$firebase.db.updateUser({
        authUser: this.form.authUser,
        customClaims: this.form.customClaims,
        staff: this.form.staff
      }).then(() => {
        this.$bvModal.msgBoxOk(this.newLiner(`ユーザー情報の更新が完了しました。`))
      }).catch(error => {
        this.$bvModal.msgBoxOk(this.newLiner(`エラー： ユーザー情報の更新に失敗しました。\n\n ${JSON.stringify(error.message)}`))
      })
      this.controls.isUpdating = false
      this.$emit("success")
      this.closeModal()
    },
    closeModal(): void {
      this.$emit('input', false)
    },
  },
}
</script>