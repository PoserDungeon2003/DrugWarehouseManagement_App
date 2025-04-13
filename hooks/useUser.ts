import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/auth/authStorage";
import { UserStorageData } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

export const getUser = async (): Promise<UserStorageData> => {
  return await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    "role",
  ]) as UserStorageData;
}

export const useGetUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  })
}