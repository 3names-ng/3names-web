import { Platform } from "react-native";
import { api } from "./api";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
}

export interface ChatResponse {
  chatId: string;
  reply: string;
  usage?: Record<string, any>;
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
}

export const aiService = {
  async sendMessage(
    prompt: string,
    chatId?: string,
    imageUri?: string,
    audioUri?: string
  ) {
    const formData = new FormData();

    // 1. Always send a non-empty string for ChatPromptDto validation
    formData.append("message", prompt || (audioUri ? "Voice Message" : "Attached Media"));

    if (chatId) {
      formData.append("chatId", chatId);
    }

    // 2. Append Audio file to "files" field
    if (audioUri) {
      const uri = Platform.OS === "android" ? audioUri : audioUri.replace("file://", "");
      const extension = audioUri.split(".").pop() || "m4a";
      
      formData.append("files", {
        uri,
        name: `voice_recording_${Date.now()}.${extension}`,
        type: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
      } as any);
    }

    // 3. Append Image file to "files" field
    if (imageUri) {
      const uri = Platform.OS === "android" ? imageUri : imageUri.replace("file://", "");
      const extension = imageUri.split(".").pop() || "jpg";

      formData.append("files", {
        uri,
        name: `image_attachment_${Date.now()}.${extension}`,
        type: `image/${extension === "png" ? "png" : "jpeg"}`,
      } as any);
    }

    // 4. Send request with multipart/form-data headers
    const response = await api.post("/ai/chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  getHistory: async () => {
    const response = await api.get("/ai/history");
    return response.data;
  },

  deleteHistory: async (chatId: string) => {
    const response = await api.delete(`/ai/history/${chatId}`);
    return response.data;
  },
};
// export const aiService = {
//   /**
//    * Send prompt to AI assistant. Pass chatId to continue an existing thread.
//    */
// sendMessage: async (
//     message: string,
//     chatId?: string,
//     imageUri?: string | null,
//     audioUri?: string | null
//   ): Promise<any> => {
//     const formData = new FormData();

//     // 1. Append message text
//     formData.append("message", message.trim());

//     // 2. Append optional chatId
//     if (chatId) {
//       formData.append("chatId", chatId);
//     }

//     // 3. Append image under the 'files' key matching NestJS FilesInterceptor
//     if (imageUri) {
//       const filename = imageUri.split("/").pop() || "photo.jpg";
//       const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
//       const mimeType = ext === "png" ? "image/png" : "image/jpeg";

//       formData.append("files", {
//         uri: imageUri,
//         name: filename,
//         type: mimeType,
//       } as any);
//     }

//     // 4. Append audio under the same 'files' key
//     if (audioUri) {
//       const filename = audioUri.split("/").pop() || "audio.m4a";
//       formData.append("files", {
//         uri: audioUri,
//         name: filename,
//         type: "audio/m4a",
//       } as any);
//     }

//     const response = await api.post("/ai/chat", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     return response.data;
//   },

//   getHistory: async () => {
//     const response = await api.get("/ai/history");
//     return response.data;
//   },
//   /**
//    * Fetch all past chat sessions for the logged-in user.
//    */
//   getHistory: async (): Promise<ChatSession[]> => {
//     const response = await api.get("/ai/history");
//     return response.data;
//   },

//   /**
//    * Fetch full transcript messages for a specific chat session.
//    */
//   getChatMessages: async (chatId: string): Promise<ChatSession> => {
//     const response = await api.get(`/ai/history/${chatId}`);
//     return response.data;
//   },
// };