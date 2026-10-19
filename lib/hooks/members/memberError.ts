import type { AxiosError } from "axios";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import type { ErrorResponse } from "@/lib/types/api.types";

export interface MemberError {
  code: string;
  message: string;
}

// `{ errors: [{ field, message }] }` → a readable message plus the code, so
// callers can branch (e.g. offer Resend on `invite_pending`).
export const toMemberError = (
  error: AxiosError<ErrorResponse>,
): MemberError => {
  const code = getErrorCode(error) ?? "";
  if (error.response?.status === 403) {
    return { code: "forbidden", message: MEMBER_ERROR_MESSAGE.forbidden };
  }
  return {
    code,
    message: MEMBER_ERROR_MESSAGE[code] ?? (code || error.message),
  };
};
