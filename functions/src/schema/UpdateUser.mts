import type { Staff } from "@/schema/Staff";
import type { FbAuthUser, FbCustomClaims } from "../../../app/src/schema/FbAuthUser";

export interface UpdateUserRequestBody {
  staff: Staff,
  authUser: FbAuthUser,
  customClaims: FbCustomClaims,
}