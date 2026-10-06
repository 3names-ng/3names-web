import { Text, TextProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type Props = TextProps & {
  className?: string;
  color?: keyof ReturnType<typeof useTheme>["colors"];
};

export function ThemedText({
  className,
  color,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();

  return (
    <Text
      className={className}
      style={[
        {
          color: color ? colors[color] : colors.text,
        },
        style,
      ]}
      {...props}
    />
  );
}