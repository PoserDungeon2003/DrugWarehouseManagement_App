import { OutboundStatus } from "./enum";

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