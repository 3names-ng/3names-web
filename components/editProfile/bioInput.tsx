import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";

import { FileText } from "lucide-react-native";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

const MAX_BIO_LENGTH = 160;

export default function BioInput({
  value,
  onChangeText,
}: Props) {
  const remaining = MAX_BIO_LENGTH - value.length;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Bio
      </Text>

      <Text style={styles.description}>
        Tell everyone a little about yourself.
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.header}>
          <FileText
            size={18}
            color="#8A8A94"
          />

          <Text style={styles.headerText}>
            About Me
          </Text>
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Write something interesting about yourself..."
          placeholderTextColor="#5F5F67"
          multiline
          textAlignVertical="top"
          maxLength={MAX_BIO_LENGTH}
          style={styles.input}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.tip}>
          Your bio appears on your profile.
        </Text>

        <Text
          style={[
            styles.counter,
            remaining <= 20 && styles.warning,
            remaining <= 0 && styles.error,
          ]}
        >
          {value.length}/{MAX_BIO_LENGTH}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 30,
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
    marginBottom: 12,
    lineHeight: 18,
  },

  inputContainer: {
    backgroundColor: "#17171F",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2B2B34",
    padding: 16,
    minHeight: 180,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  headerText: {
    color: "#8A8A94",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "600",
  },

  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tip: {
    color: "#6B7280",
    fontSize: 12,
  },

  counter: {
    color: "#8A8A94",
    fontSize: 13,
    fontWeight: "600",
  },

  warning: {
    color: "#F59E0B",
  },

  error: {
    color: "#EF4444",
  },
});