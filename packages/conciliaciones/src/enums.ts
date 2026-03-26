export enum RunStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum RunMemberRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum UnmatchedSystemStatus {
  OVERDUE = 'OVERDUE',
  DEFERRED = 'DEFERRED',
}

export enum PendingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export enum ChequeStatus {
  ISSUED = 'ISSUED',
  CLEARED = 'CLEARED',
  OVERDUE = 'OVERDUE',
}
