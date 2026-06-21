export type SseClient = (event: unknown) => void;

interface Entry {
  client: SseClient;
  accountId: string;
}

// Prices are global market data (reach everyone); account-scoped events (trades, P&L)
// only reach the clients on that account.
export class SseHub {
  private readonly entries = new Set<Entry>();

  add(client: SseClient, accountId: string): Entry {
    const entry: Entry = { client, accountId };
    this.entries.add(entry);
    return entry;
  }

  remove(entry: Entry): void {
    this.entries.delete(entry);
  }

  broadcastPrice(event: unknown): void {
    for (const entry of this.entries) entry.client(event);
  }

  broadcastToAccount(accountId: string, event: unknown): void {
    for (const entry of this.entries) if (entry.accountId === accountId) entry.client(event);
  }

  get size(): number {
    return this.entries.size;
  }
}
