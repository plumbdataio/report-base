import cloneDeep from 'lodash/cloneDeep'
import {required, requiredIf, minLength, and} from 'vuelidate/lib/validators'
import dayjs from 'dayjs'
import ja from 'dayjs/locale/ja'
dayjs.locale(ja) // add plug-in to show day of week in Japanese
import dayjsDuration from 'dayjs/plugin/duration'
dayjs.extend(dayjsDuration);

import { tstore } from '@/store/index'
import DbDataConverter from '@/schema/DbDataConverter'
import { AffiliationValueLiterals, AttendanceValueLiterals } from '@/store/modules/bundle'
import { $optionValueTo } from '@/ts/utils'

const initialAllowance = {
  travel: false,
  breakfast: false,
  lunch: false,
  dinner: false,
  transportation: false,
  projectId: 0,
}

class Report extends DbDataConverter<Report> {
  name : string = "";
  nameNormalized : string = "";
  staffId : number = 0;
  affiliation : AffiliationValueLiterals = "in-source";
  date : string|Date = new Date();
  staffIdWithDate : string = "";
  attendance : AttendanceValueLiterals = "regular-work";
  startTime : string = "09:00:00";
  endTime : string = "17:00:00";
  breakTime : string = "01:00:00";
  remarks : string = "";
  allowance : {[key: string]: any} & typeof initialAllowance = cloneDeep(initialAllowance);
  works : Work[] = [];
  isShort? : boolean = false;
  isLong? : boolean = false;
  reportedBy = {
    id: "",
    name: ""
  };
  reportedOn : string|Date = new Date();

  constructor(obj? : Partial<Report>, docId? : string) {
    super(docId)

    Object.defineProperties(this, {
      isShort: {
        value: this.isShort,
        writable: true,
        enumerable: false,
        configurable: false,
      },
      isLong: {
        value: this.isLong,
        writable: true,
        enumerable: false,
        configurable: false,
      }
    })

    if(obj == null) {
      this.startTime = tstore.bundles.params.DEFAULT_REPORT_START_TIME;
      this.endTime = tstore.bundles.params.DEFAULT_REPORT_END_TIME;
      this.works.push(new Work())
      return
    }

    Object.keys(obj ?? {}).forEach(k => {
      //@ts-expect-error
      this[k] = obj[k]
    })
    this.works.map(item => new Work(item))

    if(obj.date) {
      this.date = new Date(obj.date)
    }
  }

  isAttended(reportLike?: Partial<Report>) {
    const regExp = /regular-work|holiday-work|half-paidoff/
    if(reportLike) {
      if( ! reportLike.attendance) {
        throw Error("Error: The arg passed to isAttended() is nullish.")
      }
      return reportLike.attendance.match(regExp) != null
    }
    return this.attendance.match(regExp) != null
  }

  override toJSON() : Partial<Report> {
    const obj = super.toJSONSuper()

    obj.nameNormalized = this.getNameNormalized(obj.name)

    if(obj.date instanceof Date) {
      obj.date = dayjs(obj.date).format("YYYY/MM/DD")
    }

    if(obj.reportedOn instanceof Date) {
      obj.reportedOn = obj.reportedOn.toLocaleString()
    }

    if( ! obj.attendance) {
      throw Error("Error: report.attendance shouldn't be nullish.")
    } else if( ! this.isAttended(obj)) {
      obj.works = []
    }

    obj.staffIdWithDate = `${obj.staffId}-${obj.date}`

    return obj
  }

  getRelatedProjectIds() : number[] {
    const ids : number[] = this.works.map(work => work.projectId)
    if(this.allowance.projectId !== 0) {
      ids.push(this.allowance.projectId)
    }
    return Array.from(new Set(ids))
  }
}

class Work extends DbDataConverter<Work> {
  projectId : number = 0;
  duration = dayjs.duration(0).format('HH:mm:ss');
  detail? : string = "";

  constructor(obj? : Partial<Work>) {
    super()
    Object.keys(obj ?? {}).forEach(k => {
      //@ts-expect-error
      this[k] = obj[k]
    })
  }

  override toJSON() : Partial<Work> {
    return super.toJSONSuper()
  }
}

// Using function form (Dynamic validation schema) just to pass vm as arg
const reportValidator = (report : Report) => {
  const requiredIfAttended = requiredIf(() => report.isAttended())
  return {
    name: {required},
    affiliation: {required},
    date: {required},
    attendance: {required},
    startTime: {
      required: requiredIfAttended,
    },
    endTime: {
      required: requiredIfAttended
    },
    breakTime: {
      required: requiredIfAttended
    },
    allowance: {
      required,
      travelAndTransportationCanNotBeBothTrue: (allowance : any) => {
        return allowance.travel !== true || allowance.transportation !== true
      },
      travel: {required},
      transportation: {required},
      breakfast: {required},
      lunch: {required},
      dinner: {required},
      projectId: {
        not0: () => {
          return ! (Object.entries(report.allowance).some(([key, value]) => (!/transportation/.test(key)) && value === true) && report.allowance.projectId <= 0)
        },
      },
    },
    works: {
      required: requiredIfAttended,
      minLength: minLength(1),
      $each: {
        projectId: {
          requiredAndNotZero: requiredIfAttended,
          notZero: (value: any) => ! report.isAttended() || value !== 0,
        },
        duration: {
          required: requiredIfAttended,
          notSameAs0h: (duration : string) => ! report.isAttended() || ! new RegExp("00:00:00").test(duration)
        },
        detail: {
          required: requiredIf((parent: Work) => report.isAttended() && tstore.bundles.options.projectRequireWorkDetail.some((option: any) => option.value == parent.projectId)),
        }
        // instanceofWork: ($each : Partial<Work>) => {
        //   return $each instanceof Work
        // }
      }
    }
  }
}

export {Report, Work, reportValidator}