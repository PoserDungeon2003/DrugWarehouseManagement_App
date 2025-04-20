import api from "@/api";
import { buildQueryString } from "@/common/utils";
import { InboundItem, InboundQueryPaging, InboundResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const getInbounds = async (token: string, params: InboundQueryPaging): Promise<InboundResponse> => {
  const queryStrings = buildQueryString(params);
  return await api.get(`api/Inbound${queryStrings}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const getInboundById = async (token: string, id: number): Promise<InboundItem> => {
  return await api.get(`api/Inbound/${id}`, {
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

export const useGetInboundById = (token: string, id: number) => {
  return useQuery({
    queryKey: ["inbound", id],
    queryFn: () => getInboundById(token, id),
    enabled: !!token,
  })
}