<template>
<div>
  <HeaderRow>お問い合わせ先</HeaderRow>
  <template v-if="controls.contact.length > 0">
    <b-table-simple bordered stacked="md" class="mt-4">
      <b-tbody>
        <template v-for="(title, index) in ['システムの使い方・不具合などについて', '勤務体系・日報入力時に選ぶ項目について']">
          <b-tr>
            <b-td style="background-color: rgb(var(--info-args), 0.5);">{{ $mq.match(/xs|sm/) ? "▼" : "" }} {{ title }}</b-td>
            <b-td>{{ controls.contact[index].name }}</b-td>
            <b-td>{{ controls.contact[index].tel }}</b-td>
            <b-td>{{ controls.contact[index].email }}</b-td>
          </b-tr>
        </template>
      </b-tbody>
    </b-table-simple>
  </template>
  <template v-else>
    <div class="d-flex w-100 justify-content-center align-items-center" style="height: 50vh;">
      <b-spinner type="grow" variant="info"></b-spinner>
    </div>
  </template>
</div>
</template>

<style scoped>
</style>

<script lang="ts">
import {Contact} from '@/schema/Contact'

export default {
  async created() {
    this.controls.contact = await this.$firebase.db.fetchContact()
  },
  data() {
    return {
      controls: {
        contact: [] as Contact[]
      }
    }
  }
}
</script>