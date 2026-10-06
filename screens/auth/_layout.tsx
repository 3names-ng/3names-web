import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, 
      }}
    >
      <Stack.Screen name="academicInfoScreen" />
      <Stack.Screen name="completeProfileScreen" />
      <Stack.Screen name="createNewpasswordScreen" />
        <Stack.Screen name="forgotpasswordScreen" />
      <Stack.Screen name="loginScreen" />
      <Stack.Screen name="profileCompleteScreen" />
      <Stack.Screen name="reactivateAccountScreen" />
        <Stack.Screen name="restrictedScreen" />
        <Stack.Screen name="profileSuccess" />
      <Stack.Screen name="signUpScreen" />
      <Stack.Screen name="studentVerificationScreen" />
      <Stack.Screen name="suspendedScreen" />
        <Stack.Screen name="sucessPasswordChange" />
      <Stack.Screen name="uploadProfilePictureScreen" />
      <Stack.Screen name="verificationPendingScreen" />
        <Stack.Screen name="verifyEmailScreen" />
      <Stack.Screen name="verifyResetOtpScreen" />
      
    </Stack>
  );
}