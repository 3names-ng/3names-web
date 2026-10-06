import { View, ViewProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type Props = ViewProps & {
  className?: string;
  background?: keyof ReturnType<typeof useTheme>["colors"];
  border?: keyof ReturnType<typeof useTheme>["colors"];
};

export function ThemedView({
  className,
  background,
  border,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();

  // If a bg-* utility class is present (e.g. bg-transparent, bg-white,
  // dark:bg-neutral-900), let the className control the background — otherwise
  // the forced background below would silently override it (NativeWind gives
  // the `style` prop higher precedence than `className`).
  const hasBackgroundClass = /\bbg-/.test(className ?? "");

  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: background
            ? colors[background]
            : hasBackgroundClass
              ? undefined
              : colors.background,
        },
        border && {
          borderColor: colors[border],
        },
        style,
      ]}
      {...props}
    />
  );
}