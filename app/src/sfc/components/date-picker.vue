<template>
  <b-datepicker
    class="datepicker"
    :size="size"
    hide-header
    :reset-button="resetButton"
    :reset-value="null"
    :label-reset-button="labelResetButton"
    label-help=""
    :placeholder="placeholder != null ? placeholder : ''"
    :date-format-options="datepickerFormat"
    locale="ja-JP"
    :value="dateSelected"
    :value-as-date="valueAsDate"
    :disabled="disabled"
    @input="$emit('input', $event)"
    @context="$emit('context', $event)"
  >
  </b-datepicker>
</template>

<script lang="ts">
export default {
  created() {
    if(this.valueAsDate)
      this.dateSelected = this.value ?? null
    else
      this.dateSelected = this.value ? new Date(this.value) : null
  },
  props: {
    size: {
      type: String,
      default: 'sm',
    },
    value: {
      type: [Date, String],
    },
    valueAsDate: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    labelResetButton: {
      type: String,
      default: "クリア"
    },
    resetButton: {
      type: Boolean,
      default: true,
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler(val, oldVal) {
        this.dateSelected = val
      },
    }
  },
  data() {
    return {
      datepickerFormat: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      },
      dateSelected: this.$dayjs().format('YYYY-MM-DD') as Date|string|null,
    }
  }
}
</script>