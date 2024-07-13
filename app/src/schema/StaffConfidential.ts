import cloneDeep from 'lodash/cloneDeep'
import { required, decimal, integer } from "vuelidate/lib/validators";

import DbDataConverter from "./DbDataConverter";
import { CountInValueLiterals, SalaryTypeValueLiterals } from '@/store/modules/bundle';


export type AllowanceCalcOption = "none" | "per-day" | "fixed"
type AllowanceDetail = {
  rate: number,
  calcOption: AllowanceCalcOption
}

const allowanceDefault = {
  transportation: {rate: 400, calcOption: "per-day"} as AllowanceDetail,
  breakfast: {rate: 500, calcOption: "per-day"} as AllowanceDetail,
  lunch: {rate: 500, calcOption: "per-day"} as AllowanceDetail,
  dinner: {rate: 100, calcOption: "per-day"} as AllowanceDetail,
  travel: {rate: 2000, calcOption: "per-day"} as AllowanceDetail,
  misc: [] as FixedAllowance[],
}

export class StaffConfidential extends DbDataConverter<StaffConfidential> {
  staffId : number = 0;
  salaryType : SalaryTypeValueLiterals = "monthly-daybasis";
  baseRate : number = 0;
  expectedOvertime : number = 0;
  allowance : typeof allowanceDefault & {[key: string]: any} = cloneDeep(allowanceDefault);
  remarks : string = "";

  constructor(obj? : Record<string, any>, docId? : string) {
    super(docId)
    if(obj != null) {
      //@ts-expect-error
      Object.keys(obj).forEach((k : string) => this[k] = obj[k])
      if(Array.isArray(allowanceDefault.misc)) {
        if(this.allowance.misc == null) {
          this.allowance.misc = [] as typeof allowanceDefault.misc
        } else if(Array.isArray(this.allowance.misc)) {
          this.allowance.misc.map(item => new FixedAllowance(item))
        } else {
          throw Error("Error: 'staffConfidential.allowance.misc' is not an array.")
        }
      }
    }
  }

  override toJSON() : Partial<StaffConfidential> {
    return super.toJSONSuper()
  }

  addMiscAllowance() {
    this.allowance.misc.push(new FixedAllowance())
  }
  deleteMiscAllowance(index : number) {
    this.allowance.misc.splice(index, 1)
  }
}

export class FixedAllowance extends DbDataConverter<FixedAllowance> {
  name : string = "";
  rate : number = 0;
  countIn : CountInValueLiterals = "baseRate";
  remarks : string = ""

  constructor(obj? : Record<string, any>) {
    super(null)

    //@ts-expect-error
    Object.keys(obj ?? {}).forEach(k => this[k] = obj[k])
  }

  override toJSON(): Partial<FixedAllowance> {
    return super.toJSONSuper()
  }
}

export const StaffConfidentialValidator = () => ({
  staffId: {},
  salaryType: {required},
  baseRate: {required, integer},
  expectedOvertime: {required, decimal},
  remarks: {},
  allowance: {
    transportation: {
      rate: {required, integer},
      calcOption: {required},
    },
    breakfast: {
      rate: {required, integer},
      calcOption: {required},
    },
    lunch: {
      rate: {required, integer},
      calcOption: {required},
    },
    dinner: {
      rate: {required, integer},
      calcOption: {required},
    },
    travel: {
      rate: {required, integer},
      calcOption: {required},
    },
    misc: {
      // required,
      $each: {
        name: {required},
        rate: {required, integer},
        countIn: {required},
        remarks: {}
      }
    },
  },
})