type QueueTask<T> = () => Promise<T>;

export class AuctionQueueService {
  private readonly tails = new Map<string, Promise<unknown>>();

  run<T>(auctionId: string, task: QueueTask<T>): Promise<T> {
    const previousTail = this.tails.get(auctionId) ?? Promise.resolve();

    const nextTask = previousTail
      .catch(() => undefined)
      .then(task)
      .finally(() => {
        if (this.tails.get(auctionId) === nextTask) {
          this.tails.delete(auctionId);
        }
      });

    this.tails.set(auctionId, nextTask);
    return nextTask;
  }
}

export const auctionQueueService = new AuctionQueueService();
