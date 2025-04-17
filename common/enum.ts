export enum OutboundStatus {
  Pending = 1,
  InProgress = 2,
  Cancelled = 3,
  Completed = 4,
  Returned = 5
}

export enum LotTransferStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4
}

export enum InboundStatus {
  Pending = 1,        // Stock-in/stock-out request is pending
  InProgress = 2,     // Stock-in/stock-out is being processed
  Completed = 3,      // Stock-in/stock-out has been completed
  Cancelled = 4       // Stock-in/stock-out request was cancelled
}