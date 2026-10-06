import { api } from "./api";

interface LoginPayload {
  email: string;
  password: string;
}

interface CheckUsernameResponse {
  available: boolean;
  suggestions?: string[];
}
interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
}


export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post("/auth/google", { idToken });
    return response.data;
  },

  sendReactivationOtp: async (payload: { email: string }) => {
    const response = await api.post("/auth/reactivate-account/send-otp", payload);
    return response.data;
  },

  reactivateAccount: async (payload: {
    email: string;
    password: string;
    code: string;
  }) => {
    const response = await api.post("/auth/reactivate-account", payload);
    return response.data;
  },

  register: async (payload: {
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/signup", payload);
    return response.data;
  },


completeOnboarding: async (payload: FormData) => {
    const response = await api.post("/auth/onboarding", payload, {
      timeout: 60000, // ⚠️ Increase timeout to 60 seconds (1 minute) for file uploads
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  verifyEmail: async (payload: {
    email: string;
    code: string;
  }) => {
    const response = await api.post("/auth/verify-otp", payload);
    return response.data;
  },


  // 💡 ADD THIS METHOD: Fetches the current logged-in user profile
getMe: async () => {
  const response = await api.get("/users/me"); // Adjust to matches your endpoint (e.g. "/auth/profile" or "/auth/me")
  return response.data;
},

// Two-Factor Authentication (email OTP)
  verify2faLogin: async (payload: { email: string; code: string }) => {
    const response = await api.post("/auth/2fa/login-verify", payload);
    return response.data;
  },

  resend2faLoginOtp: async (payload: { email: string }) => {
    const response = await api.post("/auth/2fa/resend-login-otp", payload);
    return response.data;
  },

  send2faOtp: async (action: "enable" | "disable") => {
    const response = await api.post("/auth/2fa/send-otp", { action });
    return response.data;
  },

  enable2fa: async (code: string) => {
    const response = await api.post("/auth/2fa/enable", { code });
    return response.data;
  },

  disable2fa: async (code: string) => {
    const response = await api.post("/auth/2fa/disable", { code });
    return response.data;
  },

// Privacy settings (persisted on the backend, synced across devices)
getPrivacySettings: async () => {
  const response = await api.get("/users/me/privacy");
  return response.data;
},

updatePrivacySettings: async (payload: {
  privateProfile?: boolean;
  onlineStatus?: boolean;
  readReceipts?: boolean;
  activityStatus?: boolean;
  dataSharing?: boolean;
}) => {
  const response = await api.patch("/users/me/privacy", payload);
  return response.data;
},

 resendOtp: async (payload: {
    email: string;
  }) => {
    const response = await api.post("/auth/resend-otp", payload);
    return response.data;
  },

    // Forgot Password
  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
  },

 // Verify Reset OTP
verifyResetOtp: async (payload: {
  email: string;
  code: string;
}) => {
  const response = await api.post("/auth/verify-reset-otp", payload);
  return response.data;
},


// Reset Password
resetPassword: async (payload: {
  resetToken: string; // Changed from email/code to resetToken
  password: string;
}) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
},

// Change Password (authenticated)
  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.post("/auth/change-password", payload);
    return response.data;
  },

// Deactivate Account (temporary)
  deactivateAccount: async (currentPassword: string) => {
    const response = await api.post("/auth/deactivate-account", {
      currentPassword,
    });
    return response.data;
  },

// Delete Account (permanent)
  deleteAccount: async (currentPassword: string) => {
    const response = await api.post("/auth/delete-account", {
      currentPassword,
    });
    return response.data;
  },

// Submit Student Verification Documents
  submitStudentVerification: async (formData: FormData) => {
    const response = await api.post("/auth/student-verification", formData, {
      timeout: 60000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

// Check Username Availability
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.get("/auth/check-username", {
      params: { username },
    });
    return response.data;
  },

// Check Phone Number Availability
checkPhone: async (phone: string): Promise<{ available: boolean }> => {
  const response = await api.get("/auth/check-phone", {
    params: { phone },
  });
  return response.data;
},

// Submit Student Union proof document (create events)
submitStudentUnionVerification: async (document: {
  uri: string;
  name: string;
  type: string;
}) => {
  const formData = new FormData();
  formData.append("document", document as any);
  const response = await api.post(
    "/auth/student-union/verification",
    formData,
    {
      timeout: 60000,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
},
}