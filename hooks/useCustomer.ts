import api from "@/api";
import { buildQueryString } from "@/common/utils";
import { CustomerResponse, QueryPaging } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const getCustomers = async (token: string, params: QueryPaging): Promise<CustomerResponse> => {
  const queryStrings = buildQueryString(params);
  return await api.get(`/api/Customer${queryStrings}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })
}

export const useGetCustomers = (token: string, params: QueryPaging) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => getCustomers(token, params),
    enabled: !!token,
  })
}