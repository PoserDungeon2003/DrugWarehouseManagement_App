import api from "@/api";
import { buildQueryString } from "@/common/utils";
import { LotTransferItem, LotTransferResponse, QueryPaging } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const getLotTransfers = async (token: string, queryPaging: QueryPaging): Promise<LotTransferResponse> => {
  const queryStrings = buildQueryString(queryPaging);
  return await api.get(`/api/LotTransfer${queryStrings}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  })
}

export const useGetLotTransfers = (token: string, queryPaging: QueryPaging) => {
  return useQuery({
    queryKey: ['lot-transfer', queryPaging],
    queryFn: () => getLotTransfers(token, queryPaging),
    enabled: !!token,
  })
}

export const getLotTransferById = async (token: string, id: number): Promise<LotTransferItem> => {
  return await api.get(`/api/LotTransfer/${id}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  })
}

export const useGetLotTransferById = (token: string, id: number) => {
  return useQuery({
    queryKey: ['lot-transfer', id],
    queryFn: () => getLotTransferById(token, id),
    enabled: !!token,
  })
}