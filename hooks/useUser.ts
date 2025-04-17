import api from "@/api";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/auth/authStorage";
import { User, UserProfile, UserStorageData } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

export const getUser = async (): Promise<User> => {
  const UserStorageData = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    "role",
  ]) as UserStorageData;

  return {
    token: UserStorageData[0][1] || "",
    refreshToken: UserStorageData[1][1] || "",
    role: UserStorageData[2][1] || "",
  }
}

export const getProfile = async (token: string): Promise<UserProfile> => {
  return await api.get(`/whoami`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  })
}

export const useGetProfile = (token: string) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(token),
    enabled: !!token,
  })
}

export const useGetUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(),
  })
}