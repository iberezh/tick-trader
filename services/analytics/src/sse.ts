export type SseClient = (event: unknown) => void;

export class SseHub {
  private readonly clients = new Set<SseClient>();

  add(client: SseClient): void {
    this.clients.add(client);
  }

  remove(client: SseClient): void {
    this.clients.delete(client);
  }

  broadcast(event: unknown): void {
    for (const client of this.clients) client(event);
  }

  get size(): number {
    return this.clients.size;
  }
}
