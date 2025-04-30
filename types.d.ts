import { LotTransferStatus, OutboundStatus } from "./common/enum";

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

export type User = {
  token: string;
  refreshToken: string;
  role: string;
}
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

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roleId: number;
  roleName: string;
  status: string; // Consider using enum if status values are fixed
  twoFactorEnabled: boolean;
  phoneNumberConfirmed: boolean;
  emailConfirmed: boolean;
  accountSettings: any | null; // Replace 'any' with specific type if known
}

export interface InboundQueryPaging extends QueryPaging {
  inboundStatus?: InboundStatus;
  isReportPendingExist?: boolean;
}

export interface InboundDetail {
  lotNumber: string;
  productId: number;
  productName: string;
  openingStock: number;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Report assets (likely images or documents)
export interface Asset {
  assetId: number;
  fileUrl: string;
  fileName: string;
  fileExtension: string;
  fileSize: number;
  uploadedAt: string; // ISO date string
  status: string;
  accountId: string;
  categoryId: number;
  contentType?: string;
}

// Inbound report information
export interface InboundReport {
  inboundReportId: number;
  problemDescription: string;
  status: string; // Could be typed as enum if values are fixed
  reportDate: string;
  assets: Asset[];
}

// Provider details
export interface ProviderDetails {
  providerId: number;
  providerName: string;
  address: string;
  phoneNumber: string;
  taxCode: string;
  nationality: string | null;
  email: string;
  documentNumber: string;
  documentIssueDate: string;
  status: number; // Could be an enum
}

// Main inbound record
export interface InboundItem {
  inboundId: number;
  inboundCode: string;
  providerOrderCode: string;
  warehouseId: number;
  warehouseName: string;
  createBy: string;
  note: string | null;
  inboundDate: string;
  status: string; // Could use InboundStatus if you map the string to enum
  inboundDetails: InboundDetail[];
  report: InboundReport | null;
  providerDetails: ProviderDetails;
}

// Complete response type using existing PaginatedResponse
export type InboundResponse = PaginatedResponse<InboundItem>;

export interface LotTransferQueryPaging extends QueryPaging {
  status?: string;
}