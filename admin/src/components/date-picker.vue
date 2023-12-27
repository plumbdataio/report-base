<template>
  <b-datepicker
    class="datepicker"
    :size="size"
    hide-header
    reset-button
    :reset-value="null"
    :label-reset-button="labelResetButton"
    label-help="" 
    :placeholder="placeholder != null ? placeholder : ''"
    :date-format-options="datepickerFormat"
    locale="ja-JP"
    :value="dateSelected"
    :value-as-date="valueAsDate"
    :disabled="false"
    @input="$emit('input', $event)"
    @context="$emit('context', $event)"
  >
  </b-datepicker>
</template>

<script>
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
      dateSelected: this.$dayjs().format('YYYY-MM-DD'),
    }
  }
}
</script>