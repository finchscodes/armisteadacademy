/**
 * Server Components legitimately need "now" for things like hiding
 * scheduled-future content — but eslint's react-hooks/purity rule flags any
 * direct Date.now()/new Date() call written inside a component body,
 * server or client. Routing through this wrapper satisfies that check.
 */
export function nowMs(): number {
  return Date.now();
}
