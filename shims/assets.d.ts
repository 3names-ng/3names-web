// Static assets resolve to their public URL (webpack asset/resource).
declare module "*.ttf" { const url: string; export default url; }
declare module "*.png" { const url: string; export default url; }
declare module "*.jpg" { const url: string; export default url; }
declare module "*.jpeg" { const url: string; export default url; }
declare module "*.gif" { const url: string; export default url; }
declare module "*.webp" { const url: string; export default url; }
declare module "*.mp3" { const url: string; export default url; }
declare module "*.wav" { const url: string; export default url; }
declare module "*.mp4" { const url: string; export default url; }

declare const __DEV__: boolean;

// react-native-web implements the react-native API (used by shims/react-native.ts).
declare module "react-native-web" {
  export * from "react-native";
}
