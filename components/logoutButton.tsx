import React from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";

interface Props {
  onPress?: () => void;
}

export default function LogoutButton({ onPress }: Props) {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    if (onPress) {
      onPress();
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          router.replace("/auth/loginScreen");
          setTimeout(() => {
            logout();
          }, 0);
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={handleLogout}
      style={styles.container}
    >
      <LogOut color="#FE2C55" size={22} />
      <Text style={styles.text}>Logout</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
    borderRadius: 18,
    backgroundColor: "#17171F",
    borderWidth: 1,
    borderColor: "#2A2A33",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: "#FE2C55",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 12,
  },
});