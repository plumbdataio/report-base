<template>
<b-table-simple stacked="sm">
  <b-tbody class="text-center">
    <template v-if=" ! controls.isDataFetched">
      <b-spinner variant="info"></b-spinner>
    </template>
    <template v-else>
      <b-tr>
        <b-th>所属</b-th>
        <b-td>{{controls.staff.companyName}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>名前</b-th>
        <b-td>{{controls.staff.staffName}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>ログイン可</b-th>
        <b-td>{{controls.authUser.disabled ? "No" : "Yes"}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>メールアドレス</b-th>
        <b-td>{{controls.authUser.email}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>メール確認済み</b-th>
        <b-td>{{controls.authUser.emailVerified ? "Yes" : "No"}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>権限</b-th>
        <b-td>{{$optionValueTo("role", controls.customClaims.role)}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>経理用機密データの表示</b-th>
        <b-td>{{controls.customClaims.isAccountant ? "可" : "不可"}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>ユーザー作成日時</b-th>
        <b-td>{{controls.authUser.creationTime}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>最終ログイン日時</b-th>
        <b-td>{{controls.authUser.lastSignInTime}}</b-td>
      </b-tr>
      <b-tr>
        <b-th>UID</b-th>
        <b-td>{{controls.authUser.uid}}</b-td>
      </b-tr>
    </template>
  </b-tbody>
</b-table-simple>
</template>

<style scoped>
</style>

<script lang="ts">
import { to } from 'await-to-js'
import { FbAuthUser, FbCustomClaims } from '@/schema/FbAuthUser';
import { Staff } from '@/schema/Staff';

export default {
  async created() {
    type FetchAuthUserAndCustomClaims = Awaited<ReturnType<typeof this.$firebase.db.fetchAuthUserAndCustomClaims>>
    const [error, result] = await to<FetchAuthUserAndCustomClaims, Error>(this.$firebase.db.fetchAuthUserAndCustomClaims(this.staffId))
    if(error || result == null) {
      this.$bvModal.msgBoxOk(this.newLiner(`エラー：ユーザー情報が取得できませんでした。`))
      return
    }
    this.controls.authUser = result.authUser
    this.controls.customClaims = result.customClaims
    this.controls.staff = await this.$firebase.db.fetchStaffById(this.staffId)
    this.controls.isDataFetched = true
  },
  props: {
    modalId: {
      type: String,
      required: true,
    },
    staffId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      controls: {
        staff: new Staff(),
        authUser: new FbAuthUser({}),
        customClaims: new FbCustomClaims(),
        isDataFetched: false,
      }
    }
  },
}
</script>