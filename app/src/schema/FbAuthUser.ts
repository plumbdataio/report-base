import type { RoleValueLiterals } from "@/store/modules/bundle";
import type { User } from "firebase/auth";

class FbAuthUser implements Partial<User> {
  email : string = "";
  displayName : string = "";
  emailVerified : boolean = false;
  disabled : boolean = true;
  password? : string;
  uid?: string;
  creationTime?: string;
  lastSignInTime?: string;

  constructor(obj?: Partial<FbAuthUser>) {
    if(obj != null) {
      Object.keys(this).forEach(key => {
        //@ts-expect-error
        if(obj[key] != null) {
          //@ts-expect-error
          this[key] = obj[key]
        }
      })
    }
  }
}

class FbCustomClaims {
  role : RoleValueLiterals = "general";
  isAccountant? : boolean = false;

  constructor(obj?: Partial<FbCustomClaims>) {
    if(obj != null) {
      Object.keys(this).forEach(key => {
        //@ts-expect-error
        if(obj[key] != null) {
          //@ts-expect-error
          this[key] = obj[key]
        }
      })
    }
  }
}

export { FbAuthUser, FbCustomClaims }