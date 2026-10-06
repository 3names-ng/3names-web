import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
} from "react-native";

import { Plus } from "lucide-react-native";
import { HIGHLIGHTS } from "@/data/highlight.data";

export default function StoryHighlights() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Story Highlights
      </Text>

      <FlatList
        horizontal
        data={[...HIGHLIGHTS, { id: "add", title: "", cover: "" }]}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.id === "add") {
            return (
              <Pressable style={styles.item}>
                <View style={styles.addCircle}>
                  <Plus
                    color="#FFF"
                    size={28}
                  />
                </View>

                <Text style={styles.label}>
                  New
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable style={styles.item}>
              <Image
                source={{
                  uri: item.cover,
                }}
                style={styles.image}
              />

              <Text
                style={styles.label}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    marginTop:24,
  },

  title:{
    color:"#FFF",
    fontWeight:"700",
    fontSize:18,
    marginHorizontal:18,
    marginBottom:16,
  },

  item:{
    width:82,
    alignItems:"center",
    marginLeft:18,
  },

  image:{
    width:72,
    height:72,
    borderRadius:36,
    borderWidth:3,
    borderColor:"#A855F7",
  },

  addCircle:{
    width:72,
    height:72,
    borderRadius:36,
    borderWidth:2,
    borderStyle:"dashed",
    borderColor:"#555",
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#1A1A20",
  },

  label:{
    color:"#FFF",
    marginTop:8,
    fontSize:13,
    textAlign:"center",
  },

});