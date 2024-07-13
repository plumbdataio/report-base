import { tstore } from '@/store/index'
import { AffiliationValueLiterals } from '@/store/modules/bundle'
import dayjs from 'dayjs'
import { Duration } from 'dayjs/plugin/duration'
import Vue from 'vue'

type Mixin = Parameters<typeof Vue.mixin>
export const mixin : Mixin[0] = {
  computed: {
    filteredAffiliation() {
      const affiliationOptions = tstore.bundles.options.affiliation
      if( ! tstore.pages.dbUser ) {
        throw Error("Error: dbUser shouldn't be nullish.")
      }
      return tstore.pages.dbUser.affiliation === "system-developer"
        ? affiliationOptions
        : affiliationOptions.filter((item: any) => ! item.hidden)
    },
  },
  methods: {
    newLiner(messageWithSlashN) {
      const arrayOrig : string[] = messageWithSlashN.split("\n")
      const arrayModified : (string|ReturnType<typeof this.$createElement>)[] = []
      arrayOrig.forEach((fragment, index) => {
        if(index > 0) {
          arrayModified.push(this.$createElement("br"))
        }
        arrayModified.push(fragment)
      })
      return [this.$createElement("div", arrayModified)]
    },
    getDayjsDuration(hhmmss : string): Duration {
      const [hh, mm, ss] = hhmmss.split(":").map(unit => parseInt(unit))
      return this.$dayjs.duration({
        hours: hh,
        minutes: mm,
        seconds: ss,
      })
    },
    getFirstAndLastDateOfMonth(yyyymm : string) : {firstDate : string, lastDate : string} {
      const [yyyy, mm] = yyyymm.split("-").map(item => parseInt(item))
      const dayjsInstance = dayjs().year(yyyy).month(mm-1)
      const format = "YYYY/MM/DD"
      const firstDate = dayjsInstance.startOf("month").format(format)
      const lastDate = dayjsInstance.endOf("month").format(format)
      return {firstDate, lastDate}
    }
  }
}

Vue.mixin(mixin)