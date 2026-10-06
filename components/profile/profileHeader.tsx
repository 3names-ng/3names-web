import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Menu,
  GraduationCap,
  School,
  ArrowLeft,
  Library,
  Camera,
  Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Profile } from "@/types/profile";
import { useAuthStore, User } from "@/store/authStore";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedView } from "../ui/ThemedView";
import { LevelBadge } from "../levelBadge";
import ImageViewer from "../ui/ImageViewer";
import { ProfileFrame } from "../ui/ProfileFrame";
import { usePerks } from "@/hooks/usePerks";
import AuthHeader from "../auth/authHeader";

const { width } = Dimensions.get("window");

interface Props {
  profile?: User;
  onBack?: () => void;
  onMenu?: () => void;
  onEditAvatar?: () => void;
}

export default function ProfileHeader({
  onBack,
  onMenu,
  onEditAvatar,
}: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [avatarVisible, setAvatarVisible] = useState(false);
  const { hasPerk } = usePerks();

  const primaryAccent = colors.primary || "#7C3AED";

  return (
    <SafeAreaView
      style={{
      width: "100%",
    position: "relative",
        backgroundColor: colors.background,
      }}
    
     >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
     <AuthHeader
              showBackButton={false}
            title="My Profile" subtitle="View and edit your profile information" 
              rightElement={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}>
                  
            
                  {/* Mark All As Read */}
                     <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onMenu}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                        }}
                      >
                      <Menu color={colors.text} size={18} />
                      </TouchableOpacity>
            
                   
                </View>
              }
            />
      {/* Decorative Background Mesh */}
      <ThemedView style={styles.backgroundMesh}>
        <LinearGradient
          colors={[`${primaryAccent}20`, "#FE2C5510", "transparent"]}
          style={styles.gradientMesh}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </ThemedView>

      {/* Hero Section: Side-by-Side Content Layout */}
      <ThemedView style={styles.heroSection}>
        <ThemedView style={styles.sideBySideRow}>
          {/* LEFT: Avatar Wrapper */}
          <ThemedView style={styles.avatarWrapper}>
            <Pressable onPress={() => setAvatarVisible(true)}>
            <ProfileFrame
              frameId={user?.profileFrame}
              uri={user?.profilePictureUrl}
              size={84}
              initial={user?.username?.[0]?.toUpperCase()}
              fallbackColor={colors.card}
            />
            </Pressable>

            {/* Camera Trigger */}
            <Pressable
              style={({ pressed }) => [
                styles.cameraButton,
                { backgroundColor: primaryAccent, borderColor: colors.background },
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
              onPress={onEditAvatar}
            >
              {/* <Camera size={13} color="#FFF" /> */}
            </Pressable>
          </ThemedView>

          {/* RIGHT: User Main Info */}
          <ThemedView style={styles.infoColumn}>
            <ThemedView style={styles.nameRow}>
              <ThemedText style={styles.displayName} numberOfLines={1}>
                {user?.firstName || user?.lastName
                  ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                  : t("profile.anonymousStudent")}
              </ThemedText>
              {hasPerk("Verified badge") && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#3B82F6"
                  style={{ marginLeft: 5 }}
                />
              )}
            </ThemedView>

            <ThemedText style={[styles.usernameHandle, { color: colors.muted, marginBottom:4 }]}>
              @{user?.username || "username"}
            </ThemedText>
            <LevelBadge level={user?.appLevel}/>
            
        {/* Bio Section */}
        {!!user?.bio && (
          <ThemedView style={[styles.bioCard]}>
            <ThemedText style={[styles.bioText, { color: colors.text }]}>
              {user.bio}
            </ThemedText>
          </ThemedView>
        )}

       
          </ThemedView>
        </ThemedView>

     {/* Micro Badge Tag */}
            {user?.schoolName && (
              <ThemedView style={[styles.microChip, {borderColor:colors.border}]}>
                <School size={12} color={primaryAccent} />
                <ThemedText style={styles.microChipText} numberOfLines={1}>
                  {user.schoolName}
                </ThemedText>
              </ThemedView>
            )}
        {/* Academic Meta Tags */}
        {(user?.facultyName || user?.departmentName) && (
          <ThemedView style={[styles.academicChipsContainer, ]}>
            {!!user?.facultyName && (
              <ThemedView style={[styles.chip, {borderColor:colors.border}]}>
                <GraduationCap size={13} color="#0284C7" />
                <ThemedText style={styles.chipText} numberOfLines={1}>
                  {user.facultyName}
                </ThemedText>
              </ThemedView>
            )}

            {!!user?.departmentName && (
              <ThemedView style={[styles.chip,{borderColor:colors.border} ]}>
                <Library size={13} color="#16A34A" />
                <ThemedText style={styles.chipText} numberOfLines={1}>
                  {user.departmentName}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>

      {/* Full-screen profile picture viewer */}
      <ImageViewer
        visible={avatarVisible}
        imageUrl={user?.profilePictureUrl}
        username={user?.username}
        onClose={() => setAvatarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },
  backgroundMesh: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
   
    overflow: "hidden",
  },
  gradientMesh: {
    width: "100%",
    height: "100%",
  },
  topBar: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
 
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    paddingBottom: 16,
  },
  sideBySideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarGradientRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 2.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
    padding: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoColumn: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    flexShrink: 1,
    textTransform:"lowercase"
  },
  usernameHandle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  microChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    maxWidth: "100%",
  },
  microChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bioCard: {
    
    paddingHorizontal: 0,
    paddingVertical: 6,
   
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  academicChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: width * 0.85,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});