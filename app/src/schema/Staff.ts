import DbDataConverter from "./DbDataConverter";
import { AffiliationValueLiterals } from '@/store/modules/bundle';

export class Staff extends DbDataConverter<Staff> {
  staffId : number = 0;
  staffName : string = "";
  staffNameNormalized : string = "";
  companyId : number = 0;
  companyName : string = "";
  affiliation : AffiliationValueLiterals = "in-source";
  workStart: string = "08:00";
  workEnd: string = "17:00";
  breakTime : string = "01:00";

  constructor(obj? : Record<string, any>, docId? : string) {
    super(docId)

    //@ts-expect-error
    Object.keys(obj ?? {}).forEach(k => this[k] = obj[k])
  }

  override toJSON() : Partial<Staff> {
    const result = super.toJSONSuper()
    result.staffNameNormalized = this.getNameNormalized(result.staffName)
    return result
  }
}