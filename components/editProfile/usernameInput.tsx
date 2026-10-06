import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";

import {
  AtSign,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";

interface Props {
  username: string;
  onChangeText: (text: string) => void;
}

export default function UsernameInput({
  username,
  onChangeText,
}: Props) {
  const usernameValid = useMemo(() => {
    const value = username.trim();

    if (value.length < 3) return false;

    return /^[a-zA-Z0-9._]+$/.test(value);
  }, [username]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Username
      </Text>

      <Text style={styles.description}>
        Your username is unique and can only contain letters,
        numbers, "." and "_".
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.left}>
          <AtSign
            color="#8A8A94"
            size={20}
          />

          <TextInput
            value={username}
            onChangeText={onChangeText}
            placeholder="username"
            placeholderTextColor="#5F5F67"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={25}
          />
        </View>

        {username.length > 0 && (
          usernameValid ? (
            <CheckCircle2
              size={22}
              color="#22C55E"
            />
          ) : (
            <XCircle
              size={22}
              color="#EF4444"
            />
          )
        )}
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            styles.status,
            {
              color: usernameValid
                ? "#22C55E"
                : "#EF4444",
            },
          ]}
        >
          {username.length === 0
            ? ""
            : usernameValid
            ? "Username looks good"
            : "Minimum 3 characters"}
        </Text>

        <Text style={styles.counter}>
          {username.length}/25
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 24,
  },

  label: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  description: {
    color: "#8A8A94",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  inputContainer: {
    height: 60,

    backgroundColor: "#17171F",

    borderRadius: 18,

    borderWidth: 1,
    borderColor: "#2B2B34",

    paddingHorizontal: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  input: {
    flex: 1,

    marginLeft: 12,

    color: "#FFF",

    fontSize: 17,

    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  status: {
    fontSize: 13,
    fontWeight: "500",
  },

  counter: {
    color: "#8A8A94",
    fontSize: 13,
  },
});