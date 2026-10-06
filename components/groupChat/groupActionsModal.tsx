import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { showError, showSuccess, showInfo } from "@/components/ui/toast";


import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Group, GroupsApi, ImageFile } from '@/service/groupChat.service';

interface GroupActionsModalProps {
  visible: boolean;
  group: Group | null;
  onClose: () => void;
  onGroupUpdated: (updatedGroup: Group) => void;
  onGroupLeft?: () => void;
  isAdmin?: boolean;
}

export const GroupActionsModal: React.FC<GroupActionsModalProps> = ({
  visible,
  group,
  onClose,
  onGroupUpdated,
  onGroupLeft,
  isAdmin = true, // Set based on current user's role
}) => {
  const { colors } = useTheme();

  // Mode: 'menu' (quick actions/toggles) or 'edit' (form fields)
  const [mode, setMode] = useState<'menu' | 'edit'>('menu');

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [isTogglingMute, setIsTogglingMute] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setSelectedImage(null);
      setMode('menu');
    }
  }, [group, visible]);

  if (!group) return null;

  // Pick Image Handler
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Gallery permission is required to update group icon.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  // 1. Toggle Lock State
  const handleToggleLock = async () => {
    const newLockState = !group.isLocked;
    setIsTogglingLock(true);
    try {
      const updated = await GroupsApi.lockGroup(group.id, newLockState);
      onGroupUpdated(updated);
      showSuccess(newLockState ? 'Group Locked' : 'Group Unlocked');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update lock state.');
    } finally {
      setIsTogglingLock(false);
    }
  };

  // 2. Toggle Mute State
  const handleToggleMute = async () => {
    const newMuteState = !group.isMuted;
    setIsTogglingMute(true);
    try {
      const updated = await GroupsApi.muteGroup(group.id, newMuteState);
      onGroupUpdated(updated);
      showInfo(newMuteState ? 'Notifications Muted' : 'Notifications Unmuted');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update mute state.');
    } finally {
      setIsTogglingMute(false);
    }
  };

  // 3. Update Name, Description, or Icon
  const handleSaveUpdate = async () => {
    if (!name.trim()) {
      showError('Group name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    try {
      let iconPayload: ImageFile | undefined;
      if (selectedImage) {
        iconPayload = {
          uri: selectedImage.uri,
          name: selectedImage.fileName || 'group-icon.jpg',
          type: selectedImage.mimeType || 'image/jpeg',
        };
      }

      const updated = await GroupsApi.updateGroup(
        group.id,
        name.trim(),
        description.trim() || undefined,
        iconPayload
      );

      onGroupUpdated(updated);
      showSuccess('Group details updated successfully.');
      setMode('menu');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update group details.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Leave Group Confirmation
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"? You will lose access to the chat history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await GroupsApi.leaveGroup(group.id);
              showSuccess(`You left ${group.name}`);
              onClose();
              if (onGroupLeft) onGroupLeft();
            } catch (err: any) {
              showError(err.response?.data?.message || 'Could not leave group.');
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView
            behavior="padding"
            style={{
              backgroundColor: colors.card || '#18181b',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: '85%',
            }}
            className="p-6"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center pb-4 border-b border-zinc-800">
              <View className="flex-row items-center">
                {mode === 'edit' && (
                  <TouchableOpacity onPress={() => setMode('menu')} className="mr-3 p-1">
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
                <ThemedText className="text-lg font-extrabold">
                  {mode === 'edit' ? 'Edit Group Info' : 'Group Settings'}
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
              {/* ================= MODE: MENU ================= */}
              {mode === 'menu' && (
                <View className="gap-y-4">
                  {/* Group Info Header Preview */}
                  <View className="flex-row items-center p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <Image
                      source={{
                        uri: group.iconUrl || 'https://via.placeholder.com/100',
                      }}
                      className="w-14 h-14 rounded-full mr-3.5"
                    />
                    <View className="flex-1">
                      <ThemedText className="font-bold text-base" numberOfLines={1}>
                        {group.name}
                      </ThemedText>
                      <ThemedText className="text-xs text-zinc-400 mt-0.5" numberOfLines={2}>
                        {group.description || 'No description provided.'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Settings / Controls Block */}
                  <View className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                    {/* Admin: Edit Info Button */}
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => setMode('edit')}
                        className="flex-row items-center justify-between p-4 border-b border-zinc-800/60 active:bg-zinc-800/40"
                      >
                        <View className="flex-row items-center">
                          <View className="w-8 h-8 rounded-xl bg-blue-500/10 items-center justify-center mr-3">
                            <Ionicons name="pencil" size={18} color="#3b82f6" />
                          </View>
                          <ThemedText className="font-semibold text-sm">Edit Details</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#71717a" />
                      </TouchableOpacity>
                    )}

                    {/* Admin: Lock Group Toggle */}
                    {isAdmin && (
                      <View className="flex-row items-center justify-between p-4 border-b border-zinc-800/60">
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="w-8 h-8 rounded-xl bg-amber-500/10 items-center justify-center mr-3">
                            <Ionicons
                              name={group.isLocked ? 'lock-closed' : 'lock-open'}
                              size={18}
                              color="#f59e0b"
                            />
                          </View>
                          <View className="flex-1">
                            <ThemedText className="font-semibold text-sm">Lock Group</ThemedText>
                            <ThemedText className="text-xs text-zinc-400">
                              Only admins can send messages
                            </ThemedText>
                          </View>
                        </View>
                        {isTogglingLock ? (
                          <ActivityIndicator size="small" color="#f59e0b" />
                        ) : (
                          <Switch
                            value={!!group.isLocked}
                            onValueChange={handleToggleLock}
                            trackColor={{ false: '#27272a', true: '#f59e0b' }}
                            thumbColor="#ffffff"
                          />
                        )}
                      </View>
                    )}

                    {/* Mute Notifications Toggle */}
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-8 h-8 rounded-xl bg-purple-500/10 items-center justify-center mr-3">
                          <Ionicons
                            name={group.isMuted ? 'notifications-off' : 'notifications'}
                            size={18}
                            color="#a855f7"
                          />
                        </View>
                        <View className="flex-1">
                          <ThemedText className="font-semibold text-sm">Mute Group</ThemedText>
                          <ThemedText className="text-xs text-zinc-400">
                            Silence notification sounds
                          </ThemedText>
                        </View>
                      </View>
                      {isTogglingMute ? (
                        <ActivityIndicator size="small" color="#a855f7" />
                      ) : (
                        <Switch
                          value={!!group.isMuted}
                          onValueChange={handleToggleMute}
                          trackColor={{ false: '#27272a', true: '#a855f7' }}
                          thumbColor="#ffffff"
                        />
                      )}
                    </View>
                  </View>

                  {/* Leave Group Action */}
                  <TouchableOpacity
                    onPress={handleLeaveGroup}
                    disabled={isLeaving}
                    className="flex-row items-center justify-center p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 active:bg-rose-500/20 mt-2"
                  >
                    {isLeaving ? (
                      <ActivityIndicator size="small" color="#f43f5e" />
                    ) : (
                      <>
                        <Ionicons name="log-out-outline" size={20} color="#f43f5e" className="mr-2" />
                        <ThemedText className="font-bold text-sm text-rose-500">
                          Leave Group
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ================= MODE: EDIT FORM ================= */}
              {mode === 'edit' && (
                <View className="gap-y-4 pt-2">
                  {/* Avatar Picker */}
                  <View className="items-center mb-2">
                    <TouchableOpacity
                      onPress={handlePickImage}
                      className="w-24 h-24 rounded-full bg-zinc-800 justify-center items-center overflow-hidden relative border border-zinc-700"
                    >
                      <Image
                        source={{
                          uri: selectedImage?.uri || group.iconUrl || 'https://via.placeholder.com/100',
                        }}
                        className="w-full h-full"
                      />
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <Ionicons name="camera" size={24} color="#ffffff" />
                      </View>
                    </TouchableOpacity>
                    <ThemedText className="text-xs text-zinc-400 mt-2">
                      Tap to change icon
                    </ThemedText>
                  </View>

                  {/* Name Input */}
                  <View>
                    <ThemedText className="text-xs font-bold mb-1.5 text-zinc-300">
                      Group Name *
                    </ThemedText>
                    <TextInput
                      style={{ color: colors.text }}
                      className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-sm"
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter group name"
                      placeholderTextColor="#71717a"
                    />
                  </View>

                  {/* Description Input */}
                  <View>
                    <ThemedText className="text-xs font-bold mb-1.5 text-zinc-300">
                      Description
                    </ThemedText>
                    <TextInput
                      style={{ color: colors.text, minHeight: 90, textAlignVertical: 'top' }}
                      className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-sm"
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe this group..."
                      placeholderTextColor="#71717a"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Form Action Buttons */}
                  <View className="flex-row gap-3 pt-4">
                    <TouchableOpacity
                      onPress={() => setMode('menu')}
                      disabled={isUpdating}
                      className="flex-1 py-3.5 rounded-xl border border-zinc-800 justify-center items-center"
                    >
                      <ThemedText className="font-semibold text-sm">Cancel</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveUpdate}
                      disabled={isUpdating}
                      className="flex-1 bg-blue-600 py-3.5 rounded-xl justify-center items-center flex-row active:opacity-80"
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <ThemedText className="font-bold text-sm text-white">Save Changes</ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};