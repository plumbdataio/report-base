<template>
<div class="grand-container">
  <b-input :disabled="disabled" :size="size" class="readonly-input" :readonly="! disabled" placeholder="(選択されていません)" @click="reverse" :value="value ? displayedMonth : null"></b-input>
  <div v-if="isMonthListShown" class="month-list-grid" v-click-outside="reverse">
    <div class="r1-c1">
      <button class="lt-gt-button" @click="addYear(-1)">&lt;</button>
    </div>
    <div class="r1-c2">{{selectedYear}}年</div>
    <div class="r1-c3">
      <button class="lt-gt-button" @click="addYear(1)">&gt;</button>
    </div>
    <template v-for="r of [2,3,4,5]">
      <template v-for="c of 3">
        <div :key="`r${r}c${c}`" :class="{[`r${r}-c${c}`]: true, 'selected-month': valueMonth === ((r-2)*3 + c) && valueYear === selectedYear}" class="month-button" @click="select((r-2)*3 + c)">{{ (r-2)*3 + c }}月</div>
      </template>
    </template>
    <div v-if="reset" class="r6">
      <b-button size="sm" variant="outline-secondary" @click="emitNull">リセット</b-button>
    </div>
  </div>
</div>
</template>

<style scoped>
.readonly-input {
  font-size: 1em;
}
.form-control[readonly] {
  background-color: #ffffff !important;
}
.grand-container {
  min-width: 100px;
  padding: 0;
}
.month-list-grid {
  padding: 10px;
  display: grid;
  grid-template-rows: 40px repeat(4 1fr) 35px;
  grid-template-columns: repeat(3 1fr);
  background-color: #ffffff;
  border: 2px solid #cccccc;
  border-radius: 5px;
  z-index: 9999;
  position: absolute;
  transform: translateY(0px);
  height: 250px;
  width: 200px;
  box-sizing: content-box;
  box-shadow: #cccccc;
}
.month-list-grid div {
  align-self: center;
  justify-self: center;
}
.lt-gt-button {
  border: 1px solid lightblue;
  border-radius: 2px;
}
.month-button {
  border: 1px solid paleturquoise;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.selected-month {
  background-color: paleturquoise;
}
[class*="r3"],[class*="r4"],[class*="r5"] { border-top: 0px; }
[class$="c2"],[class$="c3"] { border-left: 0px; }
[class$="c1"] { grid-column: 1/2; }
[class$="c2"] { grid-column: 2/3; }
[class$="c3"] { grid-column: 3/4; }
[class*="r1"] { grid-row: 1/2; }
[class*="r2"] { grid-row: 2/3; }
[class*="r3"] { grid-row: 3/4; }
[class*="r4"] { grid-row: 4/5; }
[class*="r5"] { grid-row: 5/6; }
[class*="r6"] {
  grid-row: 6/7;
  grid-column: 1/4;
  width: 100%;
  display: flex;
  justify-content: flex-end !important;
}
</style>

<script lang="ts">
import dayjs from 'dayjs'
import ja from 'dayjs/locale/ja'
dayjs.locale(ja) // add plug-in to show day of week in Japanese

export default {
  props: {
    value: {
      type: String,
      default: `${new Date().getFullYear()}-${new Date().getMonth() >= 10 ? new Date().getMonth() : `0${new Date().getMonth()}`}`
    },
    reset: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: "sm",
    },
    disabled: {
      type: Boolean,
      default: false
    },
    displayFormat:{
      type: String,
      default: "YYYY年M月"
    },
    outputFormat:{
      type: String,
      default: "YYYY-MM"
    },
  },
  data() {
    return {
      isMonthListShown: false,
      ymdDelimiter: "-",
      //@ts-expect-error
      selectedYear: parseInt(this.value?.split(this.ymdDelimiter)[0]) as number|null
    }
  },
  watch: {
    isMonthListShown: {
      immediate: true,
      handler: function(isMonthListShown) {
        this.selectedYear =
          this.value == null
          ? this.$dayjs().year()
          : isMonthListShown
          ? parseInt(this.value.split(this.ymdDelimiter)[0])
          : null
      }
    },
  },
  computed: {
    valueYear() { return parseInt(this.value?.split(this.ymdDelimiter)[0]) },
    valueMonth() { return parseInt(this.value?.split(this.ymdDelimiter)[1])},
    displayedMonth() {
      return this.$dayjs().year(this.valueYear).month(this.valueMonth-1).format(this.displayFormat)
    }
  },
  methods: {
    addYear(num: number) {
      this.selectedYear! += num
    },
    select(month: number) {
      this.$emit('input', this.$dayjs().year(this.selectedYear!).month(month-1).format(this.outputFormat))
      this.reverse()
    },
    reverse() { this.isMonthListShown = ! this.isMonthListShown },
    emitNull() {
      this.$emit('input', null)
    }
  }
}
</script>