import api from "@/api";
import { buildQueryString } from "@/common/utils";
import { LotTransferResponse, QueryPaging } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const getLotTransfers = async (token: string, queryPaging: QueryPaging): Promise<LotTransferResponse> => {
  const queryStrings = buildQueryString(queryPaging);
  return api.get(`api/LotTransfers${queryStrings}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  })
}

export const useGetLotTransfers = (token: string, queryPaging: QueryPaging) => {
  return useQuery({
    queryKey: ['lot-transfers', queryPaging],
    queryFn: () => getLotTransfers(token, queryPaging),
    enabled: !!token,
  })
}