import { OutboundStatus } from "./common/enum";

export type LoginResponse = {
  token: string;
  refreshToken: string;
  role: string;
}

export type UserStorageData = [
  [typeof ACCESS_TOKEN_KEY, string | null],
  [typeof REFRESH_TOKEN_KEY, string | null],
  ["role", string | null]
];

export interface OutboundDetail {
  outboundDetailsId: number;
  lotId: number;
  lotNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitType: string;
  productName: string;
  expiryDate: string;
}

export interface OutboundItem {
  outboundId: number;
  outboundCode: string;
  customerName: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  note: string | null;
  phoneNumber: string;
  outboundOrderCode: string | null;
  outboundDate: string; // ISO date string
  status: OutboundStatus;
  outboundDetails: OutboundDetail[];
}

export type OutboundResponse = PaginatedResponse<OutboundItem>

export interface QueryPaging {
  page: number;
  pageSize: number;
  search?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}
export interface SearchOutboundRequest extends QueryPaging {
  customerId?: number | null;
  status?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type CustomerResponse = PaginatedResponse<Customer>;

export interface LotTransferDetail {
  lotTransferDetailId: number;
  expiryDate: string;
  quantity: number;
  productName: string | null;
  lotNumber: string;
}

export interface LotTransferItem {
  lotTransferId: number;
  lotTransferCode: string;
  lotTransferStatus: string;
  fromWareHouse: string;
  toWareHouse: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  lotTransferDetails: LotTransferDetail[];
}

export type LotTransferResponse = PaginatedResponse<LotTransferItem>;