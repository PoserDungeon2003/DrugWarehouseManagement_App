import { clearTokens } from "@/auth/authStorage";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "react-native-paper";

export default function Profile() {
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clearTokens();
    queryClient.clear();
    router.push('/login');
  };
  return (
    <View style={{
      padding: 20,
      flex: 1,
    }}>
      <Button 
        mode="contained" 
        onPress={handleLogout}
        style={{}}
      >
        Đăng xuất
      </Button>
    </View>
  )
}