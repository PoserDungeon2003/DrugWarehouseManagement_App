import api from "@/api";
import { buildQueryString } from "@/common/utils";
import { InboundQueryPaging, InboundResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const getInbounds = async (token: string, params: InboundQueryPaging): Promise<InboundResponse> => {
  const queryStrings = buildQueryString(params);
  return await api.get(`api/Inbound${queryStrings}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const useGetInbounds = (token: string, params: InboundQueryPaging) => {
  return useQuery({
    queryKey: ["inbounds", params],
    queryFn: () => getInbounds(token, params),
    enabled: !!token,
  })
}