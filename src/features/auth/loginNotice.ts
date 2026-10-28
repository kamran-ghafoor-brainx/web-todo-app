import type { SessionEndReason } from "@/app/actions";
import { messages } from "@/lib/messages";

const LOGIN_NOTICES = {
  passwordUpdated: { variant: "success", message: messages.auth.passwordUpdated },
  loggedOut: { variant: "info", message: messages.auth.loggedOut },
  sessionExpired: { variant: "info", message: messages.auth.sessionExpired },
} as const satisfies Record<string, ResolvedLoginNotice>;

export type LoginNotice = keyof typeof LOGIN_NOTICES;

export type LoginLocationState = { notice: LoginNotice };

export type ResolvedLoginNotice = { variant: "success" | "info"; message: string };

export function readLoginNotice(state: unknown): ResolvedLoginNotice | null {
  if (typeof state !== "object" || state === null) return null;
  const notice = (state as { notice?: unknown }).notice;
  return typeof notice === "string" && Object.hasOwn(LOGIN_NOTICES, notice)
    ? LOGIN_NOTICES[notice as LoginNotice]
    : null;
}

const NOTICE_BY_END_REASON = {
  loggedOut: "loggedOut",
  expired: "sessionExpired",
} as const satisfies Record<SessionEndReason, LoginNotice>;

export function loginStateAfterSessionEnd(
  reason: SessionEndReason | null,
): LoginLocationState | undefined {
  return reason ? { notice: NOTICE_BY_END_REASON[reason] } : undefined;
}
