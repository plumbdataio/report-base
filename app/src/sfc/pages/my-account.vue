<template>
<div>
  <HeaderRow>アカウント情報</HeaderRow>
  <b-overlay :show=" ! isMyDataFetched">
    <b-container class="p-0 grand-container">
      <b-row>
        <b-col>
          <label class="custom-label">氏名</label>
          <div class="avoid-text-cls">{{staffName}}</div>
        </b-col>
      </b-row>
      <br>
      <b-row>
        <b-col>
          <label class="custom-label">所属</label>
          <div class="avoid-text-cls">{{companyName}}</div>
        </b-col>
      </b-row>
      <br>
      <b-row align-v="center">
        <b-col cols="auto">
          <label class="custom-label">メールアドレス (=ログインID)</label>
          <div class="avoid-text-cls">{{$tstore.auth.loginUser?.email}}</div>
        </b-col>
        <b-col>
          <b-button v-if="! isEdittingEmail" size="sm" variant="outline-primary" @click="isEdittingEmail = true">変更</b-button>
        </b-col>
      </b-row>
      <br>
      <b-row v-if="isEdittingEmail">
        <b-col>
          <b-input class="mr-4 email" v-model="emailNew" :state="$v.emailNew.$invalid ? false : null"></b-input>
          <div v-if=" ! $v.emailNew.email" class="error-message">※有効なメールアドレスの形式ではありません</div>
          <div v-if=" ! $v.emailNew.required" class="error-message">※必須項目です</div>
        </b-col>
      </b-row>
      <b-row v-if="isEdittingEmail" class="mt-2">
        <b-col>
          <b-button class="mr-2" size="sm" @click="updateEmail">更新</b-button>
          <b-button size="sm" @click="isEdittingEmail = false">キャンセル</b-button>
        </b-col>
      </b-row>
    </b-container>
  </b-overlay>
  <hr>
  <b-container class="p-0 grand-container">
    <b-row align-v="center">
      <b-col>
        <b-button variant="outline-secondary" size="sm" class="mr-2" :class="{'button-plus': ! isCollapsed, 'button-minus': isCollapsed}" @click="toggle"></b-button>
        <label class="custom-label">パスワード変更</label>
      </b-col>
    </b-row>
    <br>
    <b-collapse id="collapse" v-model="isCollapsed">
      <b-row>
        <b-col class="custom-width">
          <label>古いパスワード</label>
          <b-form-input v-model="passwordOld" type="password" :state="$v.passwordOld.$invalid ? false : null"></b-form-input>
          <div v-if=" ! $v.passwordOld.required" class="error-message">※必須項目です</div>
        </b-col>
      </b-row>
      <br>
      <b-row>
        <b-col class="custom-width">
          <label>新しいパスワード</label>
          <b-form-input v-model="passwordNew" type="password" :state="$v.passwordNew.$invalid ? false : null"></b-form-input>
          <div v-if=" ! $v.passwordNew.required" class="error-message">※必須項目です</div>
          <div v-else-if=" ! $v.passwordNew.minLength" class="error-message">※8文字以上入力して下さい</div>
          <div v-else-if=" ! $v.passwordNew.maxLength" class="error-message">※最大15文字までです</div>
        </b-col>
      </b-row>
      <br>
      <b-row>
        <b-col class="custom-width">
          <label>新しいパスワード(再入力)</label>
          <b-form-input v-model="passwordRepeated" type="password" :state="$v.passwordRepeated.$invalid ? false : null"></b-form-input>
          <div v-if=" ! $v.passwordRepeated.sameAsPassword" class="error-message">パスワードが一致しません</div>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col>
          <div id="recaptchaContainer"></div>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col>
          <div class="d-flex align-items-center">
            <b-button variant="primary" :disabled="isChanging || ! isRecaptchaVerified || $v.$invalid" @click="changePassword">変更</b-button>
            <b-spinner v-if="isChanging" variant="warning" class="ml-4"></b-spinner>
          </div>
        </b-col>
      </b-row>
    </b-collapse>
  </b-container>
</div>
</template>

<style scoped>
.grand-container {
  min-width:100%;
}
.avoid-text-cls {
  height: 1em;
}
.email {
  max-width: 300px;
}
.custom-label {
  color: cornflowerblue;
}
.custom-width {
  max-width: 300px !important;
  min-width: 300px !important;
}
@media screen and (max-width: 768px) {
  .custom-width {
    max-width: 300px !important;
  }
}
</style>

<script lang="ts">
import { RecaptchaVerifier } from 'firebase/auth';
import { required, requiredIf, email, minLength, maxLength, sameAs } from 'vuelidate/lib/validators'

export default {
  created() {
    this.$firebase.db.fetchStaffById(parseInt(this.$tstore.auth.loginUser!.uid))
    .then(data => {
      if( data == null ){
        this.isMyDataFetched = false
        return this.$bvModal.msgBoxOk(this.newLiner('一部のアカウント情報が取得できませんでした。'))
      }
      this.staffName = data.staffName
      this.companyName = data.companyName
      this.isMyDataFetched = true
    })
  },
  mounted() {
    this.recaptchaVerifierObject = this.$firebase.auth.buildRecaptchaVerifier(
      "recaptchaContainer",
      () => { this.isRecaptchaVerified = true },
      () => { this.isRecaptchaVerified = false },
    )
    this.recaptchaVerifierObject.render()
    this.recaptchaVerifierObject.verify()
  },
  data() {
    return {
      isEdittingEmail: false,
      isCollapsed: false,
      isChanging: false,
      isRecaptchaVerified: false,
      emailNew: "",
      passwordOld: null as null|string,
      passwordNew: null as null|string,
      passwordRepeated: null,
      staffName: "",
      companyName: "",
      isMyDataFetched: false,
      recaptchaVerifierObject: null as null|RecaptchaVerifier,
    }
  },
  validations() {
    const vm = this
    return {
      emailNew: {
        required: requiredIf(function(vm){
          return vm.isEdittingEmail
        }),
        email
      },
      passwordOld: {
        required: requiredIf(function(){
          return vm.isCollapsed
        })
      },
      passwordNew: {
        required: requiredIf(function(){
          return vm.isCollapsed
        }),
        minLength: minLength(8),
        maxLength: maxLength(15)
      },
      passwordRepeated: {
        required: requiredIf(function(){
          return vm.isCollapsed
        }),
        sameAsPassword: sameAs(function() {return vm.passwordNew})
      }
    }
  },
  methods: {
    toggle() {
      this.isCollapsed = ! this.isCollapsed
    },
    async changePassword() {
      if(this.passwordNew !== this.passwordRepeated) {
        return this.$bvModal.msgBoxOk(this.newLiner("新しいパスワードが一致していません。"))
      }

      this.isChanging = true

      this.$firebase.auth.refreshCredential(this.passwordOld!)
      .then(() => {
        this.$firebase.auth.changePassword(this.passwordNew!)
        .then(() => {
          this.$bvModal.msgBoxOk(this.newLiner("パスワードを変更しました。"))
        }).catch(error => {
          console.log(error);
          if(error.code?.includes("auth/weak-password")) {
            this.$bvModal.msgBoxOk(this.newLiner(`エラー：新しいパスワードが要件を満たしていません。\n ${JSON.stringify(error)}`))
          } else {
            this.$bvModal.msgBoxOk(this.newLiner(`エラー：何らかの理由でパスワードの変更に失敗しました。\n ${JSON.stringify(error)}`))
          }
        }).finally(() => this.isChanging = false)
      }).catch(error => {
        console.log(error);
        if(error.code?.includes("auth/wrong-password")) {
          this.$bvModal.msgBoxOk(this.newLiner(`エラー：古いパスワードが間違っています。\n Error: ${JSON.stringify(error)}`))
        } else {
          this.$bvModal.msgBoxOk(this.newLiner(`エラー：何らかの理由でパスワードの変更に失敗しました\n Error: ${JSON.stringify(error)}`))
        }

        this.isChanging = false
      })
    },
    updateEmail() {
      this.$firebase.auth.updateEmail(this.emailNew)
      .then(() => {
        this.$bvModal.msgBoxOk(this.newLiner("メールアドレスを変更しました。\n次回のログイン時は新しいメールアドレスを使用してください。"))
        this.isEdittingEmail = false
      }, error => {
        if(error.code.includes("requires-recent-login"))
          this.$bvModal.msgBoxOk(this.newLiner("最後のログイン日から時間が経っているため、更新できません。\nログアウト後、ログインしなおしてから再度試して下さい。"))
        else
          this.$bvModal.msgBoxOk(this.newLiner(`メールアドレスの変更に失敗しました。\n${JSON.stringify(error)}`))
        this.isEdittingEmail = false
      })
    }
  }
}
</script>