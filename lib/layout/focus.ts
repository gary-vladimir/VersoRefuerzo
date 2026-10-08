// Practice sessions run in "focus mode" on phones: the bottom tab bar is
// hidden so it does not cover the session's bottom actions (Revelar verso,
// the four grade buttons, Saltar). Sessions are 100dvh tall, so with the
// fixed bar on top of them those buttons sat partly under it. The session's
// own close button is the way out. The hub (/practice) and the summary
// keep the tab bar.
const FOCUS_ROUTE = /^\/practice\/(classic|first-letter|scramble|match|gap)(\/|$)/;

export function isFocusRoute(pathname: string): boolean {
  return FOCUS_ROUTE.test(pathname);
}
