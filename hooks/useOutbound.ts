import api from "@/api"
import { getAccessToken } from "@/auth/authStorage"
import { buildQueryString } from "@/common/utils"
import { OutboundResponse, SearchOutboundRequest } from "@/types"
import { useQuery } from "@tanstack/react-query"

export const getOutbound = async (token: string, params?: SearchOutboundRequest): Promise<OutboundResponse> => {
  const queryString = buildQueryString(params || {})
  return await api.get(`/api/Outbound${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })
}

export const useGetOutbound = (token: string, params: SearchOutboundRequest) => {
  return useQuery({
    queryKey: ["outbound", params],
    queryFn: () => getOutbound(token, params),
    enabled: !!token,
  })
}