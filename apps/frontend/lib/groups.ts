import api from "./api-client";
import type { BalancesResponse, GroupDetail, GroupSummary, SimplifyResponse } from "./types";

export const GROUPS_STALE_TIME = 1000 * 60 * 2;

export async function fetchGroups(): Promise<GroupSummary[]> {
  const { data } = await api.get<{ groups: GroupSummary[] }>("/groups");
  return data.groups;
}

export async function createGroup(input: {
  name: string;
  description?: string;
  baseCurrency: string;
}): Promise<GroupSummary> {
  const { data } = await api.post<{ group: GroupSummary }>("/groups", input);
  return data.group;
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail> {
  const { data } = await api.get<{ group: GroupDetail }>(`/groups/${groupId}`);
  return data.group;
}

export async function addGroupMember(groupId: string, userId: string) {
  const { data } = await api.post(`/groups/${groupId}/members`, { userId });
  return data.member;
}

export async function fetchGroupExpenses(groupId: string) {
  const { expenses } = (await api.get<{ expenses: GroupDetail["expenses"] }>(
    `/expenses/group/${groupId}`
  )).data;
  return expenses;
}

export async function getGroupBalances(groupId: string): Promise<BalancesResponse> {
  const { data } = await api.get<BalancesResponse>(`/balances/group/${groupId}`);
  return data;
}

export async function simplifyGroup(groupId: string): Promise<SimplifyResponse> {
  const { data } = await api.get<SimplifyResponse>(`/balances/group/${groupId}/simplify`);
  return data;
}

export async function settleGroup(
  groupId: string,
  payload: { fromUserId: string; toUserId: string; amount: number; note?: string }
) {
  const { data } = await api.post<{ settlement: GroupDetail["settlements"][number] }>(
    `/balances/group/${groupId}/settlements`,
    payload
  );
  return data.settlement;
}
