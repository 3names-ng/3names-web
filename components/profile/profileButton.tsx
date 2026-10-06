import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import {
  Pencil,
  Share2,
  Wallet,
  LayoutDashboard,
} from "lucide-react-native";

interface Props {
  onEdit?: () => void;
  onShare?: () => void;
  onWallet?: () => void;
  onDashboard?: () => void;
}

function Button({
  icon,
  title,
  primary,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.button,
        primary && styles.primaryButton,
      ]}
      onPress={onPress}
    >
      {icon}

      <Text
        style={[
          styles.buttonText,
          primary && styles.primaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default function ProfileButtons({
  onEdit,
  onShare,
  onWallet,
  onDashboard,
}: Props) {
  return (
    <View>

      {/* Main Buttons */}

      <View style={styles.row}>

        <Button
          primary
          title="Edit Profile"
          icon={<Pencil size={18} color="#FFF" />}
          onPress={onEdit}
        />

        <Button
          title="Share"
          icon={<Share2 size={18} color="#FFF" />}
          onPress={onShare}
        />

      </View>

      {/* Secondary Buttons */}

      <View style={styles.row}>

        {/* <Button
          title="Campus Coins"
          icon={<Wallet size={18} color="#FFD54F" />}
          onPress={onWallet}
        /> */}

        {/* <Button
          title="Creator Dashboard"
          icon={<LayoutDashboard size={18} color="#4ADE80" />}
          onPress={onDashboard}
        /> */}

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  row: {

    flexDirection: "row",

    marginHorizontal: 18,

    marginTop: 12,

  },

  button: {

    flex: 1,

    height: 48,

    backgroundColor: "#1A1A20",

    borderRadius: 14,

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    marginHorizontal: 5,

    borderWidth: 1,

    borderColor: "#2A2A32",

  },

  primaryButton: {

    backgroundColor: "#FE2C55",

    borderColor: "#FE2C55",

  },

  buttonText: {

    color: "#FFF",

    marginLeft: 8,

    fontWeight: "600",

    fontSize: 14,

  },

  primaryText: {

    color: "#FFF",

  },

});