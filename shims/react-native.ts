// `react-native` on web: react-native-web plus quiet stand-ins for the
// platform-only APIs the screens reference behind Platform checks
// (react-native-web omits ActionSheetIOS, logs an error for BackHandler, and
// its Alert.alert does nothing).
import React, { forwardRef } from "react";
import { ScrollView as RNWScrollView } from "react-native-web";

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

// react-native-web's Alert.alert is a no-op; this one shows a real dialog.
export { Alert } from "./alert";

// In React Native, children of a ScrollView keep at least their content size
// even with `flex: 1`. react-native-web gives every View `min-height: 0`, so
// such children get squeezed and their contents overlap (e.g. the profile
// menu sections). The data attribute lets global.css restore `min-height:
// auto` for the scroll content's direct children.
export const ScrollView = forwardRef<RNWScrollView, React.ComponentProps<typeof RNWScrollView>>(
  function ScrollView(props, ref) {
    const dataSet = { ...(props as { dataSet?: Record<string, string> }).dataSet, rnScroll: props.horizontal ? "h" : "v" };
    return React.createElement(RNWScrollView, { ...props, dataSet, ref } as React.ComponentProps<typeof RNWScrollView>);
  }
) as unknown as typeof RNWScrollView;
