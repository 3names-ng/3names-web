import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

type Audience = "public" | "friends" | "school_only";
type CommentPrivacy = "everyone" | "nobody";

interface Props {
  audience?: Audience;
  commentPrivacy?: CommentPrivacy;
  allowShare?: boolean;
  allowDownload?: boolean;
  notifyTaggedPeople?: boolean;
  allowLikes?: boolean;

  onAudienceChange?: (value: Audience) => void;
  onCommentPrivacyChange?: (value: CommentPrivacy) => void;
  onAllowShareChange?: (value: boolean) => void;
  onAllowDownloadChange?: (value: boolean) => void;
  onNotifyTaggedPeopleChange?: (value: boolean) => void;
  onAllowLikesChange?: (value: boolean) => void;
}

export default function PrivacySection({
  audience: propAudience,
  commentPrivacy: propCommentPrivacy,
  // allowShare: propAllowShare,
  // allowDownload: propAllowDownload,
  // notifyTaggedPeople: propNotifyTaggedPeople,
  // allowLikes: propAllowLikes,

  onAudienceChange,
  onCommentPrivacyChange,
  // onAllowShareChange,
  // onAllowDownloadChange,
  // onNotifyTaggedPeopleChange,
  // onAllowLikesChange,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [internalAudience, setInternalAudience] = useState<Audience>("public");
  const [internalCommentPrivacy, setInternalCommentPrivacy] = useState<CommentPrivacy>("everyone");

  const audience = propAudience !== undefined ? propAudience : internalAudience;
  const commentPrivacy = propCommentPrivacy !== undefined ? propCommentPrivacy : internalCommentPrivacy;

  const [audienceModal, setAudienceModal] = useState(false);
  const [commentModal, setCommentModal] = useState(false);

  const audienceOptions: Audience[] = ["public", "friends", "school_only"];
  const commentOptions: CommentPrivacy[] = ["everyone", "nobody"];

  // Mapping lookup objects for beautiful text presentation
  const audienceLabels: Record<Audience, string> = {
    public: t("explore.public"),
    friends: t("explore.followers"),
    school_only: t("explore.schoolOnly"),
  };

  const commentLabels: Record<CommentPrivacy, string> = {
    everyone: t("explore.everyone"),
    nobody: t("explore.nobody"),
  };

  return (
    <>
      <View style={styles.container}>
        {/* Audience Selection Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => setAudienceModal(true)}
        >
          <View style={styles.left}>
            <View style={styles.iconContainer}>
              <Ionicons name="earth-outline" size={22} color="#3B82F6" />
            </View>
            <ThemedText style={styles.label}>{t("post.audienceLabel")}</ThemedText>
          </View>
          <View style={styles.right}>
            <ThemedText style={styles.value}>{audienceLabels[audience]}</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Comment Privacy Selection Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => setCommentModal(true)}
        >
          <View style={styles.left}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={21} color="#10B981" />
            </View>
            <ThemedText style={styles.label}>{t("post.whoCanCommentLabel")}</ThemedText>
          </View>
          <View style={styles.right}>
            <ThemedText style={styles.value}>{commentLabels[commentPrivacy]}</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Audience Picker */}
      <PickerModal
        visible={audienceModal}
        title={t("post.chooseAudience")}
        data={audienceOptions}
        labelsMap={audienceLabels}
        selected={audience}
        onClose={() => setAudienceModal(false)}
        onSelect={(item: Audience) => {
          setInternalAudience(item);
          onAudienceChange?.(item);
          setAudienceModal(false);
        }}
      />

      {/* Comment Picker */}
      <PickerModal
        visible={commentModal}
        title={t("post.whoCanComment")}
        data={commentOptions}
        labelsMap={commentLabels}
        selected={commentPrivacy}
        onClose={() => setCommentModal(false)}
        onSelect={(item: CommentPrivacy) => {
          setInternalCommentPrivacy(item);
          onCommentPrivacyChange?.(item);
          setCommentModal(false);
        }}
      />
    </>
  );
}

function PickerModal({ visible, title, data, labelsMap, selected, onSelect, onClose }: any) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {data.map((item: string) => {
              const isSelected = selected === item;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  style={[
                    styles.option,
                    isSelected && {
                      backgroundColor: "#7C3AED15",
                      borderColor: "#7C3AED",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      isSelected && { color: "#7C3AED" },
                    ]}
                  >
                    {labelsMap[item]}
                  </ThemedText>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: { width: 30, alignItems: "flex-start" },
  right: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "500" },
  value: { color: "#9CA3AF", fontSize: 15, marginRight: 6 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.35)" },
  sheet: { height: "55%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: "700" },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 14, marginVertical: 4, borderRadius: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  optionText: { fontSize: 17, fontWeight: "600" },
});