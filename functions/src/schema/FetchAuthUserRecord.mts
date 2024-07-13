import type { UserRecord } from "firebase-admin/auth";

export interface FetchAuthUserRecordRequestBody {
  uid: string,
}
export interface FetchAuthUserRecordResponse extends UserRecord {}
export type FetchAuthUserRecordResponseStringified = string