import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Image, Modal, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/ThemedText";
import StoryViewerScreen, { UserStoryGroup } from "./storyScreen";
// import StoryViewerScreen, { UserStoryGroup } from "./StoryViewerScreen";

const ALL_USER_STORIES: UserStoryGroup[] = [
  {
    userId: "usr_1",
    userName: "Alex",
    userAvatar: "https://i.pravatar.cc/150?img=11",
    stories: [
      { id: "s1", mediaUrl: "https://picsum.photos/id/10/1080/1920", type: "image", timestamp: "3h ago" },
    ],
  },
  {
    userId: "usr_2",
    userName: "Sarah",
    userAvatar: "https://i.pravatar.cc/150?img=20",
    stories: [
      { id: "s2", mediaUrl: "https://picsum.photos/id/20/1080/1920", type: "image", timestamp: "5h ago" },
      { id: "s3", mediaUrl: "https://picsum.photos/id/28/1080/1920", type: "image", timestamp: "1h ago" },
    ],
  },
];

export default function StoryHeaderBar() {
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);

  const activeGroup = activeUserIndex !== null ? ALL_USER_STORIES[activeUserIndex] : null;

  // Transitions to the next user's story queue automatically
  const handleStoryFinish = () => {
    if (activeUserIndex !== null && activeUserIndex < ALL_USER_STORIES.length - 1) {
      setActiveUserIndex(activeUserIndex + 1);
    } else {
      setActiveUserIndex(null);
    }
  };

  return (
    <View style={{ paddingVertical: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {ALL_USER_STORIES.map((userGroup, index) => (
          <TouchableOpacity
            key={userGroup.userId}
            onPress={() => setActiveUserIndex(index)}
            style={styles.avatarWrapper}
          >
            <View style={styles.gradientBorder}>
              <Image source={{ uri: userGroup.userAvatar }} style={styles.avatarImage} />
            </View>
            <ThemedText style={styles.userNameText}>{userGroup.userName}</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Story Screen Modal */}
      <Modal visible={activeUserIndex !== null} animationType="fade" statusBarTranslucent>
        {activeGroup && (
          <StoryViewerScreen
            userStories={activeGroup}
            onClose={() => setActiveUserIndex(null)}
            onFinish={handleStoryFinish}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: { alignItems: "center", marginRight: 16 },
  gradientBorder: {
    padding: 2,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#6D28D9",
  },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  userNameText: { fontSize: 12, marginTop: 4, fontWeight: "600" },
});