/**
 * Returns the time-based one-time password expected by the Safe Queue Service in signed requests.
 * It is calculated using 1-hour intervals from the Unix epoch.
 */
export const getTotp = (): bigint => BigInt(Math.floor(Date.now() / 1000 / 3600))
