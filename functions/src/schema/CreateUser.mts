import { CreateRequest } from 'firebase-admin/auth'
import { FbCustomClaims } from '@/schema/FbAuthUser'
import { Staff } from '@/schema/Staff'
import { StaffConfidential } from '@/schema/StaffConfidential'

export interface CreateUserRequestBody {
  authUser: CreateRequest,
  customClaims: FbCustomClaims,
  staff: Staff,
  staffConfidential: StaffConfidential,
}