import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/lib/types/api.types";
import type {
  AcceptInviteResult,
  InviteInput,
  InvitePreview,
  InviteResult,
  MemberRole,
  MembersData,
  OrgMember,
} from "@/lib/types/member.types";
import {
  API_INVITE,
  API_INVITE_ACCEPT,
  API_ORG_INVITE,
  API_ORG_INVITE_RESEND,
  API_ORG_INVITES,
  API_ORG_MEMBER,
  API_ORG_MEMBERS,
} from "@/routes";

export const getMembers = async (
  orgId: string,
): Promise<ApiResponse<MembersData>> => {
  try {
    const res = await axiosInstance.get(API_ORG_MEMBERS(orgId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const inviteMember = async (
  orgId: string,
  input: InviteInput,
): Promise<ApiResponse<InviteResult>> => {
  try {
    const res = await axiosInstance.post(API_ORG_INVITES(orgId), input);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Issues a new link; the previous one stops working.
export const resendInvite = async (
  orgId: string,
  inviteId: string,
): Promise<ApiResponse<InviteResult>> => {
  try {
    const res = await axiosInstance.post(
      API_ORG_INVITE_RESEND(orgId, inviteId),
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const revokeInvite = async (
  orgId: string,
  inviteId: string,
): Promise<ApiResponse<{ id: string }>> => {
  try {
    const res = await axiosInstance.delete(API_ORG_INVITE(orgId, inviteId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const changeMemberRole = async (
  orgId: string,
  userId: string,
  role: MemberRole,
): Promise<ApiResponse<OrgMember>> => {
  try {
    const res = await axiosInstance.patch(API_ORG_MEMBER(orgId, userId), {
      role,
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const removeMember = async (
  orgId: string,
  userId: string,
): Promise<ApiResponse<{ userId: string }>> => {
  try {
    const res = await axiosInstance.delete(API_ORG_MEMBER(orgId, userId));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Public — works without a session.
export const getInvitePreview = async (
  token: string,
): Promise<ApiResponse<InvitePreview>> => {
  try {
    const res = await axiosInstance.get(API_INVITE(token));
    return res.data;
  } catch (error) {
    throw error;
  }
};

// The BE re-issues the session cookie with this org as the active one.
export const acceptInvite = async (
  token: string,
): Promise<ApiResponse<AcceptInviteResult>> => {
  try {
    const res = await axiosInstance.post(API_INVITE_ACCEPT(token));
    return res.data;
  } catch (error) {
    throw error;
  }
};
