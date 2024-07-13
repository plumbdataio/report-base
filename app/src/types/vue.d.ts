import type firebase from '@/firebase/index'
import type dayjs from 'dayjs'
import type { VNode } from 'vue'
import type { BreakPoints } from '@/ts/init_vue'
import type { $optionValueTo } from '@/ts/utils'
import type { tstore } from '@/store/index'
import type { affiliation } from '@/store/modules/bundle'
import type { Duration } from 'dayjs/plugin/duration'
declare module 'vue/types/vue' {
  interface Vue {
    $firebase: typeof firebase;
    $mq: keyof typeof BreakPoints;
    $dayjs: typeof dayjs;
    $tstore: typeof tstore;
    newLiner: (msg : string) => VNode[];
    getDayjsDuration: (hhmmss : string) => Duration;
    getFirstAndLastDateOfMonth: (yyyymm : string) => {firstDate : string, lastDate : string};
    $optionValueTo: typeof $optionValueTo;
    filteredAffiliation: Array<typeof affiliation[number]>;
  }
}