// constants/user.const.ts

/** Roles supported by the platform */
export enum USER_ROLE {
  /** Regular user booking tours */
  TRAVELER = "traveler",

  /** Person conducting tours */
  GUIDE = "guide",

  /** Manages schedules, logistics */
  ASSISTANT = "assistant",

  /** Customer support staff */
  SUPPORT = "support",

  /** Platform administrator */
  ADMIN = "admin",
}
export type UserRole = `${USER_ROLE}`;

/** Account lifecycle states */
export enum ACCOUNT_STATUS {
  /** Account created but not yet verified */
  PENDING = "pending",

  /** Account is active and in good standing */
  ACTIVE = "active",

  /** Temporarily disabled due to violations or inactivity */
  SUSPENDED = "suspended",

  /** Permanently banned from the platform */
  BANNED = "banned",
}
export type AccountStatus = `${ACCOUNT_STATUS}`;
