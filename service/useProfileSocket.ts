import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { acquireNamespace, releaseNamespace } from "./socketManager";

export interface ProfileUpdateEvent {
  userId: string;
  profileFrame?: string | null;
  profilePictureUrl?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Global profile-update socket.
 * Uses the shared socketManager to connect to /users namespace.
 * Mount once in the root layout.
 */
export const useProfileSocket = () => {
  useEffect(() => {
    const socket = acquireNamespace("/users");

    const handleProfileUpdated = (data: ProfileUpdateEvent) => {
      console.log("[ProfileSocket] Profile updated:", data?.userId);
      DeviceEventEmitter.emit("PROFILE_FRAME_UPDATED", data);
    };

    const handleProfileChanged = (data: ProfileUpdateEvent) => {
      console.log("[ProfileSocket] Profile changed:", data?.userId);
      DeviceEventEmitter.emit("PROFILE_FRAME_UPDATED", data);
    };

    socket.on("user:profile_updated", handleProfileUpdated);
    socket.on("user:profile_changed", handleProfileChanged);
    socket.on("profile:updated", handleProfileUpdated);

    return () => {
      socket.off("user:profile_updated", handleProfileUpdated);
      socket.off("user:profile_changed", handleProfileChanged);
      socket.off("profile:updated", handleProfileUpdated);
      releaseNamespace("/users");
    };
  }, []);
};
