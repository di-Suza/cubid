export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: string;
  aggregateId: string;
  occurredAt: Date;
  payload: TPayload;
}
