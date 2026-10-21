import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { MEMBER_ERROR_MESSAGE } from "@/const/member.constant";
import type { ErrorResponse } from "@/lib/types/api.types";

import { toMemberError } from "../memberError";

const httpError = (status: number, data: ErrorResponse, message = "boom") =>
  Object.assign(new Error(message), {
    response: { status, data },
  }) as unknown as AxiosError<ErrorResponse>;

describe("toMemberError", () => {
  it("maps a known code to its message", () => {
    expect(
      toMemberError(
        httpError(409, {
          errors: [{ field: "email", message: "invite_pending" }],
        }),
      ),
    ).toEqual({
      code: "invite_pending",
      message: MEMBER_ERROR_MESSAGE.invite_pending,
    });
  });

  it("reads a top-level code when no field error is sent", () => {
    expect(toMemberError(httpError(409, { message: "last_admin" }))).toEqual({
      code: "last_admin",
      message: MEMBER_ERROR_MESSAGE.last_admin,
    });
  });

  it("always reports 403 as forbidden", () => {
    expect(toMemberError(httpError(403, { message: "role_too_low" }))).toEqual({
      code: "forbidden",
      message: MEMBER_ERROR_MESSAGE.forbidden,
    });
  });

  it("shows an unknown code as is", () => {
    expect(toMemberError(httpError(400, { message: "weird_code" }))).toEqual({
      code: "weird_code",
      message: "weird_code",
    });
  });

  it("falls back to the error message when there is no code", () => {
    expect(toMemberError(httpError(500, {}, "Network Error"))).toEqual({
      code: "",
      message: "Network Error",
    });
  });
});
