export interface ActorIdentity {
  id: string;
  role: 'USER' | 'ADMIN';
}

export interface ResourceOwnership {
  ownerId: string;
}

export const isOwner = (actor: ActorIdentity, resource: ResourceOwnership): boolean => actor.id === resource.ownerId;
