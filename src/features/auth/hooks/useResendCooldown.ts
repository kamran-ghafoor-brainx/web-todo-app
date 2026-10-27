import { useCallback, useEffect, useState } from "react";

export const RESEND_COOLDOWN_SECONDS = 60;

type Options = {
  seconds?: number;
  startImmediately?: boolean;
};

export function useResendCooldown({
  seconds = RESEND_COOLDOWN_SECONDS,
  startImmediately = false,
}: Options = {}) {
  const [secondsLeft, setSecondsLeft] = useState(startImmediately ? seconds : 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const start = useCallback((duration: number = seconds) => setSecondsLeft(duration), [seconds]);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}
