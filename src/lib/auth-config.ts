export const authEnabled = process.env.AUTH_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

export const authRequiredForMutations =
  process.env.AUTH_REQUIRED_FOR_MUTATIONS === "true" || process.env.NODE_ENV === "production";

export function authIsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET);
}
