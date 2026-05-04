export type LockArea = 'planning' | 'quality' | 'sst';

export interface PendingUnlock {
  area: LockArea;
  returnUrl: string;
}
