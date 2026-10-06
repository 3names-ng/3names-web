import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export const categories = [
  {
    id: "1",
    title: "Lecture Notes",
    subtitle: "PDF, DOC & Slides",
    backgroundColor: "#EEF2FF",
    icon: (
      <Ionicons
        name="document-text"
        size={30}
        color="#5B2EFF"
      />
    ),
  },

  {
    id: "2",
    title: "Past Questions",
    subtitle: "1000+ Questions",
    backgroundColor: "#E8FFF3",
    icon: (
      <MaterialCommunityIcons
        name="file-question"
        size={30}
        color="#12B76A"
      />
    ),
  },

  {
    id: "3",
    title: "Textbooks",
    subtitle: "Recommended Books",
    backgroundColor: "#FFF4E6",
    icon: (
      <Ionicons
        name="book"
        size={30}
        color="#F79009"
      />
    ),
  },

  {
    id: "4",
    title: "Project Topics",
    subtitle: "Research Ideas",
    backgroundColor: "#FFEAF2",
    icon: (
      <MaterialCommunityIcons
        name="lightbulb-on"
        size={30}
        color="#E11D48"
      />
    ),
  },

  {
    id: "5",
    title: "Assignments",
    subtitle: "Homework & Tasks",
    backgroundColor: "#E8F7FF",
    icon: (
      <Feather
        name="clipboard"
        size={28}
        color="#0284C7"
      />
    ),
  },

  {
    id: "6",
    title: "Practicals",
    subtitle: "Lab Manuals",
    backgroundColor: "#F4ECFF",
    icon: (
      <FontAwesome5
        name="flask"
        size={26}
        color="#7C3AED"
      />
    ),
  },
];