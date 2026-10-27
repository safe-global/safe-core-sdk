// SPDX-License-Identifier: FSL-1.1-MIT

/** The one read {@link waitForBlockTimestamp} needs, so any viem public client fits. */
type BlockReader = { getBlock: () => Promise<{ timestamp: bigint }> };

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Waits until the latest block is at or past {@link timestamp}, such as a root's `readyAt`.
 * {@link onWait} is told the seconds left before each pause.
 */
export async function waitForBlockTimestamp(
  client: BlockReader,
  timestamp: bigint,
  onWait: (secondsLeft: bigint) => void = () => {},
): Promise<void> {
  for (;;) {
    const { timestamp: now } = await client.getBlock();
    if (now >= timestamp) {
      return;
    }
    onWait(timestamp - now);
    await sleep(Math.min(Number(timestamp - now), 12) * 1000 + 1000);
  }
}
