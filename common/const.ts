import { InboundStatus, LotTransferStatus, OutboundStatus } from "./enum";

export const OUTBOUND_STATUS_TEXT: Record<number, string> = {
  [OutboundStatus.Pending]: 'Đang chờ',
  [OutboundStatus.InProgress]: 'Đang xử lý',
  [OutboundStatus.Cancelled]: 'Đã hủy',
  [OutboundStatus.Completed]: 'Hoàn thành',
  [OutboundStatus.Returned]: 'Đã trả lại',
};

export const OUTBOUND_STATUS_COLOR: Record<number, string> = {
  [OutboundStatus.Pending]: '#FF9800', // Orange
  [OutboundStatus.InProgress]: '#2196F3', // Blue
  [OutboundStatus.Cancelled]: '#F44336', // Red
  [OutboundStatus.Completed]: '#4CAF50', // Green
  [OutboundStatus.Returned]: '#9C27B0', // Purple
};

export const LOT_TRANSFER_STATUS_COLOR: Record<string, string> = {
  "pending": '#FF9800', // Orange
  "inprogress": '#2196F3', // Blue
  "completed": '#F44336', // Red
  "cancelled": '#4CAF50', // Green
};

export const LOT_TRANSFER_STATUS_TEXT: Record<string, string> = {
  "pending": "Đang chờ", // Pending
  "inprogress": "Đang xử lý", // InProgress
  "completed": "Đã hoàn thành", // Completed
  "cancelled": "Đã hủy", // Cancelled
};

export const INBOUND_STATUS_TEXT: Record<InboundStatus, string> = {
  [InboundStatus.Pending]: "Đang chờ",
  [InboundStatus.InProgress]: "Đang xử lý",
  [InboundStatus.Completed]: "Đã hoàn thành", 
  [InboundStatus.Cancelled]: "Đã hủy"
};

// Status color mapping
export const INBOUND_STATUS_COLOR = {
  [InboundStatus.Pending]: "#FF9800",     // Orange
  [InboundStatus.InProgress]: "#2196F3",  // Blue  
  [InboundStatus.Completed]: "#4CAF50",   // Green
  [InboundStatus.Cancelled]: "#F44336",   // Red
};