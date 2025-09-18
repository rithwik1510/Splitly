export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "CAD",
  "AUD"
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface ApiError {
  message: string;
  code?: string;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export const JWT_COOKIE_NAME = "splitwiseplus_token";
export const REFRESH_COOKIE_NAME = "splitwiseplus_refresh";

export enum SplitMode {
  EQUAL = "EQUAL",
  UNEQUAL = "UNEQUAL",
  PERCENT = "PERCENT",
  SHARES = "SHARES",
}

export enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}