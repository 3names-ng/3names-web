// `react-native` on web: react-native-web plus quiet stand-ins for the
// platform-only APIs the screens reference behind Platform checks
// (react-native-web omits ActionSheetIOS and logs an error for BackHandler).
export * from "react-native-web";

type Subscription = { remove: () => void };

export const ActionSheetIOS = {
  showActionSheetWithOptions(_options: unknown, _callback: (buttonIndex: number) => void) {},
  showShareActionSheetWithOptions(_options: unknown, _failure: unknown, _success: unknown) {},
  dismissActionSheet() {},
};

/** Android hardware back button: never fires in a browser. */
export const BackHandler = {
  exitApp() {},
  addEventListener(_event: "hardwareBackPress", _handler: () => boolean | null | undefined): Subscription {
    return { remove() {} };
  },
};
