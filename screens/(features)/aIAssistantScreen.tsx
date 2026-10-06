import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import Header from "@/components/header";
import { aiService, ChatSession } from "@/service/ai.service";
import AuthHeader from "@/components/auth/authHeader";
import { useAIChatCacheStore } from "@/store/aiChatCacheStore";
import { AIConsentModal, useAIConsent } from "@/components/ai/aiConsentModal";
import { supportService } from "@/service/support.service";
import { showError, showSuccess } from "@/components/ui/toast";

export interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUri?: string;
  audioUri?: string;
  createdAt?: string | Date;
}

const QUICK_ACTIONS = [
  {
    id: "1",
    title: "Explain a complex topic",
    subtitle: "in simple terms",
    prompt: "Explain quantum computing in simple terms.",
    iconName: "graduation-cap",
    iconColor: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.15)",
  },
  {
    id: "2",
    title: "Help me write",
    subtitle: "emails, essays and more",
    prompt: "Help me write a professional follow-up email.",
    iconName: "edit-3",
    iconColor: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
  {
    id: "3",
    title: "Give me study tips",
    subtitle: "and improve productivity",
    prompt: "Give me 5 effective study tips to stay focused.",
    iconName: "lightbulb-on",
    iconColor: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "4",
    title: "Analyze and insights",
    subtitle: "data, trends and more",
    prompt: "What are the latest key trends in tech?",
    iconName: "bar-chart-2",
    iconColor: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
  },
];

// Renders `#`/`##`/`###` heading lines as bold text instead of showing the
// literal hashes — AI replies are plain-text but commonly use markdown
// headings, so this keeps the chat bubble readable without pulling in a
// full markdown renderer.
function renderMessageContent(content: string, color: string) {
  const lines = content.split("\n");
  return (
    <Text style={[styles.messageText, { color }]}>
      {lines.map((line, index) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
        const lineBreak = index < lines.length - 1 ? "\n" : "";

        if (headingMatch) {
          const level = headingMatch[1].length;
          return (
            <Text
              key={index}
              style={[
                styles.messageHeading,
                level <= 2 && styles.messageHeadingLarge,
              ]}
            >
              {headingMatch[2]}
              {lineBreak}
            </Text>
          );
        }

        return (
          <Text key={index}>
            {line}
            {lineBreak}
          </Text>
        );
      })}
    </Text>
  );
}

export default function AIAssistantScreen() {
  const [inputText, setInputText] = useState("");
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  // Attachment & Voice Recording States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const {
    chats: cachedChats,
    rehydrated,
    setCachedChats,
    upsertCachedChat,
    removeCachedChat,
  } = useAIChatCacheStore();
  const hasSeededCache = useRef(false);
  const { status: consentStatus, grant: grantConsent } = useAIConsent();

  // Google Play's AI-generated content policy: users must be able to flag
  // offensive or harmful AI replies from inside the app.
  const reportAIReply = (message: Message) => {
    Alert.alert(
      "Report this reply?",
      "Our team will review it. Use this for replies that are harmful, offensive or inappropriate.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              await supportService.reportProblem({
                category: "AI Response",
                subject: "Reported AI Assistant reply",
                message: `Chat: ${activeChatId ?? "new"}
Message: ${message.id ?? "unknown"}

${(message.content || "").slice(0, 1800)}`,
              });
              showSuccess("Thanks — we'll review this reply.", "Reported");
            } catch {
              showError("Couldn't send the report. Please try again.");
            }
          },
        },
      ],
    );
  };

  // Show the persisted chat history as soon as it loads from AsyncStorage,
  // so past chats appear instantly and also when offline.
  useEffect(() => {
    if (rehydrated && !hasSeededCache.current) {
      hasSeededCache.current = true;
      setRecentChats(cachedChats);
    }
  }, [rehydrated, cachedChats]);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (isRecordingRef.current) {
        audioRecorder.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, sending]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await aiService.getHistory();
      const chats = data || [];
      setRecentChats(chats);
      setCachedChats(chats);
    } catch (error) {
      // Offline: keep showing the cached history already seeded above.
      console.error("Failed to fetch chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectChat = (chat: ChatSession) => {
    setActiveChatId(chat.id);
    const sortedMessages = [...(chat.messages || [])].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
    setMessages(sortedMessages);
  };

  const handleStartNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInputText("");
    setSelectedImage(null);
  };

  // Long press handler for deleting chat history
  const handleLongPressChat = (chat: ChatSession) => {
    Alert.alert(
      t("ai.deleteChat"),
      `${t("ai.deleteChatConfirm")} "${chat.title || t("ai.untitledChat")}"?`,
      [
        { text: t("action.cancel"), style: "cancel" },
        {
          text: t("action.delete"),
          style: "destructive",
          onPress: () => confirmDeleteChat(chat.id),
        },
      ]
    );
  };

  const confirmDeleteChat = async (chatId: string) => {
    try {
      // Optimistic UI update
      setRecentChats((prev) => prev.filter((c) => c.id !== chatId));
      removeCachedChat(chatId);

      if (activeChatId === chatId) {
        handleStartNewChat();
      }

      // Call backend service (adjust endpoint method name if needed e.g. deleteChat/deleteHistory)
      if (typeof aiService.deleteHistory === "function") {
        await aiService.deleteHistory(chatId);
      } else if (typeof (aiService as any).deleteChat === "function") {
        await (aiService as any).deleteChat(chatId);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      Alert.alert(t("error.error"), t("ai.couldNotDelete"));
      fetchHistory(); // Revert state on error
    }
  };

  // Image Attachment Picker
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        t("error.permissionDenied"),
        t("ai.permissionCamera"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Voice Recording Toggle & Unload Logic
  const handleToggleRecording = async () => {
    try {
      if (isRecordingRef.current) {
        await stopAndSendRecording();
        return;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("error.permissionDenied"), t("ai.permissionMic"));
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (err) {
      console.error("Recording toggle failed:", err);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const stopAndSendRecording = async () => {
    if (!isRecordingRef.current) return;

    try {
      isRecordingRef.current = false;
      setIsRecording(false);
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri;

      if (uri) {
        await handleSendPrompt("", undefined, uri);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  // Main Prompt Sender
  const handleSendPrompt = async (
    textToSend?: string,
    imageOverride?: string,
    audioUriToSend?: string,
  ) => {
    const rawPrompt = (
      textToSend !== undefined ? textToSend : inputText
    ).trim();
    const imageToSend = imageOverride || selectedImage;

    const prompt =
      rawPrompt ||
      (audioUriToSend ? "Voice Message" : imageToSend ? "Attached Image" : "");

    if (!prompt && !imageToSend && !audioUriToSend) return;
    if (sending) return;
    // Nothing is sent to the AI provider until the user has agreed.
    if (consentStatus !== "granted") return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content:
        rawPrompt ||
        (audioUriToSend ? "🎤 Voice Message" : "📷 Attached Image"),
      imageUri: imageToSend || undefined,
      audioUri: audioUriToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSelectedImage(null);
    setSending(true);

    try {
      const response = await aiService.sendMessage(
        prompt,
        activeChatId || undefined,
        imageToSend as string | undefined,
        audioUriToSend,
      );

      // The API returns `chatId`; reading only `sessionId` (never set) meant
      // the conversation was never remembered, so every question started a
      // brand-new chat with no context.
      const chatId: string | undefined = response?.chatId ?? response?.sessionId;
      if (chatId && !activeChatId) {
        setActiveChatId(chatId);
      }

      const aiMsgText =
        response?.reply ||
        response?.message ||
        response?.content ||
        t("ai.noResponse");

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiMsgText,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      // Unlock the input as soon as the answer is on screen; the history list
      // refreshes in the background instead of holding up the next question.
      setSending(false);
      fetchHistory();

      // Keep the cache in sync with the active conversation even if the
      // follow-up history fetch fails (e.g. no network).
      if (chatId) {
        upsertCachedChat({
          id: chatId,
          title: rawPrompt.slice(0, 50) || t("ai.untitledChat"),
          createdAt: new Date().toISOString(),
          messages: [...messages, userMsg, aiMsg].map((m) => ({
            id: m.id || `${Date.now()}`, 
            role: m.role === "system" ? "assistant" : m.role,
            content: m.content,
            createdAt: m.createdAt ? String(m.createdAt) : new Date().toISOString(),
          })),
        });
      }
    } catch (error: any) {
      console.log("AI Request Error:", error?.response?.data || error?.message);

      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
// showError()
      Alert.alert(
        t("ai.errorSending"),
        error?.response?.data?.message?.[0] ||
          error?.response?.data?.message ||
          t("ai.failedProcess"),
      );
    } finally {
      setSending(false);
    }
  };

  const themeColors = {
    background: colors?.background || (isDark ? "#070510" : "#F8FAFC"),
    cardBg: colors?.card || (isDark ? "#130F22" : "#FFFFFF"),
    inputBg: isDark ? "#110D1F" : "#F1F5F9",
    border: colors?.border || (isDark ? "#231B38" : "#E2E8F0"),
    textPrimary: colors?.text || (isDark ? "#FFFFFF" : "#0F172A"),
    textSecondary: colors?.muted || (isDark ? "#9CA3AF" : "#64748B"),
    placeholder: isDark ? "#8B85A1" : "#94A3B8",
    iconBg: isDark ? "#1D1633" : "#E2E8F0",
    userBubble: "#A855F7",
    aiBubble: isDark ? "#1A142D" : "#F1F5F9",
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <AIConsentModal visible={consentStatus === "needed"} onAgree={grantConsent} />
   <AuthHeader 
  title={t("ai.title")}
  subtitle={t("ai.subtitle")} 
/>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length > 0 && (
            <View style={styles.activeChatHeader}>
              <TouchableOpacity
                style={[
                  styles.newChatBtn,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={handleStartNewChat}
              >
                <Feather name="plus" size={16} color="#C084FC" />
                <Text
                  style={[
                    styles.newChatText,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  {t("ai.newChat")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {messages.length === 0 ? (
            <>
              <View style={styles.heroSection}>
                <View style={styles.heroTextContainer}>
                  <Text
                    style={[
                      styles.heroTitle,
                      { color: themeColors.textPrimary },
                    ]}
                  >
                    <Text style={{ color: "#C084FC" }}>{t("ai.heroTitle")}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.heroSubtitle,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {t("ai.heroSubtitle")}
                  </Text>
                  <Text style={styles.heroHandwriting}>
                    {t("ai.heroGreeting")}
                  </Text>
                </View>

                <View style={styles.heroImageContainer}>
                  <Image
                    source={{uri:"https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946858/ai-robot2_cz9ouu.png"}}
                    style={styles.robotImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickActionsScroll}
                contentContainerStyle={styles.quickActionsContainer}
                keyboardShouldPersistTaps="handled"
              >
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => handleSendPrompt(action.prompt)}
                    style={[
                      styles.actionCard,
                      {
                        backgroundColor: themeColors.cardBg,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.actionIconCircle,
                        { backgroundColor: action.bgColor },
                      ]}
                    >
                      {action.iconName === "graduation-cap" ||
                      action.iconName === "lightbulb" ? (
                        <FontAwesome5
                          name={action.iconName as any}
                          size={18}
                          color={action.iconColor}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={action.iconName as any}
                          size={18}
                          color={action.iconColor}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.actionTitle,
                        { color: themeColors.textPrimary },
                      ]}
                    >
                      {action.title}
                    </Text>
                    <Text
                      style={[
                        styles.actionSubtitle,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      {action.subtitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((item, index) => {
                const isUser = item.role === "user";
                return (
                  <View
                    key={item.id || index.toString()}
                    style={[
                      styles.messageWrapper,
                      isUser ? styles.userWrapper : styles.aiWrapper,
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#C084FC" />
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isUser
                          ? [
                              styles.userBubble,
                              { backgroundColor: themeColors.userBubble },
                            ]
                          : [
                              styles.aiBubble,
                              {
                                backgroundColor: themeColors.aiBubble,
                                borderColor: themeColors.border,
                              },
                            ],
                      ]}
                    >
                      {item.imageUri && (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.attachedMsgImage}
                        />
                      )}
                      {Boolean(item.content) &&
                        renderMessageContent(
                          item.content,
                          isUser ? "#FFFFFF" : themeColors.textPrimary,
                        )}
                      {!isUser && Boolean(item.content) && (
                        <TouchableOpacity
                          onPress={() => reportAIReply(item)}
                          style={styles.reportButton}
                          accessibilityRole="button"
                          accessibilityLabel="Report this reply"
                          hitSlop={8}
                        >
                          <Ionicons name="flag-outline" size={12} color={themeColors.textSecondary} />
                          <Text style={[styles.reportText, { color: themeColors.textSecondary }]}>
                            Report
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {sending && (
                <View style={[styles.messageWrapper, styles.aiWrapper]}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color="#C084FC" />
                  </View>
                  <View
                    style={[
                      styles.messageBubble,
                      styles.aiBubble,
                      {
                        backgroundColor: themeColors.aiBubble,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <ActivityIndicator size="small" color="#C084FC" />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Input Box */}
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: themeColors.inputBg,
                borderColor: isRecording
                  ? "#EF4444"
                  : isDark
                    ? "#7C3AED"
                    : "#A855F7",
              },
            ]}
          >
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Feather name="x" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              placeholder={
                isRecording
                  ? t("ai.listening")
                  : t("ai.askAnything")
              }
              placeholderTextColor={
                isRecording ? "#EF4444" : themeColors.placeholder
              }
              style={[styles.textInput, { color: themeColors.textPrimary }]}
              value={inputText}
              onChangeText={setInputText}
              editable={!sending && !isRecording}
              multiline
            />

            <View style={styles.inputControls}>
              <View style={styles.inputLeftControls}>
                <TouchableOpacity
                  style={[
                    styles.iconCircle,
                    { backgroundColor: themeColors.iconBg },
                  ]}
                  onPress={handlePickImage}
                  disabled={sending || isRecording}
                >
                  <Feather name="paperclip" size={18} color="#A78BFA" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isRecording
                        ? "#EF4444"
                        : themeColors.iconBg,
                    },
                  ]}
                  onPress={handleToggleRecording}
                  disabled={sending}
                >
                  <Feather
                    name={isRecording ? "stop-circle" : "mic"}
                    size={18}
                    color={isRecording ? "#FFFFFF" : "#A78BFA"}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => handleSendPrompt()}
                disabled={sending || (!inputText.trim() && !selectedImage)}
              >
                <LinearGradient
                  colors={
                    inputText.trim() || selectedImage
                      ? ["#A855F7", "#6366F1"]
                      : ["#6B7280", "#4B5563"]
                  }
                  style={styles.sendButton}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Chats Section */}
          {messages.length === 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text
                  style={[
                    styles.recentTitle,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  {t("ai.recentChats")}
                </Text>
              </View>

              <View style={styles.recentList}>
                {loadingHistory && recentChats.length === 0 ? (
                  <ActivityIndicator
                    size="small"
                    color="#C084FC"
                    style={{ marginVertical: 12 }}
                  />
                ) : recentChats.length === 0 ? (
                  <Text
                    style={{ color: themeColors.textSecondary, fontSize: 12 }}
                  >
                    {t("ai.noChats")}
                  </Text>
                ) : (
                  recentChats.map((chat) => (
                    <TouchableOpacity
                      key={chat.id}
                      onPress={() => handleSelectChat(chat)}
                      onLongPress={() => handleLongPressChat(chat)}
                      delayLongPress={300}
                      style={[
                        styles.chatCard,
                        {
                          backgroundColor: themeColors.cardBg,
                          borderColor: themeColors.border,
                        },
                      ]}
                    >
                      <View style={styles.chatContent}>
                        <Text
                          style={[
                            styles.chatTitle,
                            { color: themeColors.textPrimary },
                          ]}
                        >
                          {chat.title || t("ai.untitledChat")}
                        </Text>
                        <Text
                          style={[
                            styles.chatSnippet,
                            { color: themeColors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {chat.messages && chat.messages.length > 0
                            ? chat.messages[chat.messages.length - 1].content
                            : t("ai.tapToContinue")}
                        </Text>
                      </View>
                      <View style={styles.chatMeta}>
                        <Text
                          style={[
                            styles.chatTime,
                            { color: themeColors.placeholder },
                          ]}
                        >
                          {chat.createdAt
                            ? new Date(chat.createdAt).toLocaleDateString()
                            : ""}
                        </Text>
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={themeColors.placeholder}
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 8,
  },
  reportText: {
    fontSize: 11,
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop:20
  },
  activeChatHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    marginTop: 15,
  },
  newChatText: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroHandwriting: {
    fontSize: 18,
    color: "#C084FC",
    fontStyle: "italic",
    lineHeight: 22,
  },
  heroImageContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  robotImage: {
    width: "100%",
    height: "100%",
  },
  quickActionsScroll: {
    marginHorizontal: -16,
    marginBottom: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: 130,
    height: 145,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 10,
    lineHeight: 13,
  },
  messagesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  aiWrapper: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(192, 132, 252, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageHeading: {
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 21,
  },
  messageHeadingLarge: {
    fontSize: 17,
    lineHeight: 23,
  },
  attachedMsgImage: {
    width: 180,
    height: 120,
    borderRadius: 12,
    marginBottom: 6,
  },
  inputCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    fontSize: 14,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  inputControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  inputLeftControls: {
    flexDirection: "row",
    gap: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  recentList: {
    gap: 10,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  chatContent: {
    flex: 1,
    marginRight: 8,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  chatSnippet: {
    fontSize: 11,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatTime: {
    fontSize: 10,
  },
});