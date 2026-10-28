export function ignoreErrors(action: () => void): void {
  try {
    action();
  } catch {
    return;
  }
}
