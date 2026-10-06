import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True inside the Expo Go app. Expo Go only contains Expo's own native
 * modules, so features built on extra native libraries (e.g. VisionCamera
 * live filters) must switch to a fallback there.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Running in a browser (the web build) — no native-only modules, no phone file system. */
export const IS_WEB = Platform.OS === 'web';
