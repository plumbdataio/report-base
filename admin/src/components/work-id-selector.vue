<template>
  <b-select
      :disabled="disabled || ! isDataReady"
      :size="size"
      :style="noBorder ? 'border: 0px;' : ''"
      :value="value"
      @input="$emit('input', $event)"
    >
    <template v-if="isDataReady">
      <b-select-option :value="null"></b-select-option>
      <b-select-option-group label="アクティブ">
        <template v-for="(work, workId) in workIds">
          <b-select-option :key="workId" v-if="orderStatus.find(status => status.value === work.status).isActive" :value="workId">{{work.description ? `${workId} (${work.description})` : workId}}</b-select-option>
        </template>
      </b-select-option-group>
      <b-select-option-group label="終了">
        <template v-for="(work, workId) in workIds">
          <b-select-option :key="workId" v-if=" ! orderStatus.find(status => status.value === work.status).isActive" :value="workId">{{work.description ? `${workId} (${work.description})` : workId}}</b-select-option>
        </template>
      </b-select-option-group>
    </template>
  </b-select>
</template>

<script>
export default {
  props: {
    value: {
      required: true,
      default: ""
    },
    disabled: {
      required: false,
      default: false,
    },
    size: {
      required: false,
      default: "sm",
    },
    noBorder: {
      required: false,
      default: false,
    },
  },
  data() {
    return {
      isDataReady: false,
      workIds: {},
      orderStatus: {},
    }
  },
  async created() {
    this.$emit('ready', false)
    this.workIds = await this.$firebase.db.fetchWorkId()
    this.orderStatus = await this.$firebase.db.fetchTypeOptions("orderStatus")
    this.isDataReady = true
    this.$emit('ready', true)
  }
}
</script>