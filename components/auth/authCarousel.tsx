import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
// Define the exact width of each item card
const ITEM_WIDTH = width - 48;

const images = [
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946849/welcome_h0lj9f.png" },
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946851/welcome2_lzoluv.png" },
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946853/welcome7_xxwdb4.png" },
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946861/welcome8_dtnkhf.png" },
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946862/welcome9_ez4lcn.png" },
  { uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946851/welcome4_wav1cd.png" },
];

export default function AuthCarousel() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    // Calculate the index using the actual item width instead of screen width
    const index = Math.round(
      event.nativeEvent.contentOffset.x / ITEM_WIDTH
    );
    setCurrentIndex(index);
  };

  return (
    <View className="bg-transparent">
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        // 1. Disable pagingEnabled
        pagingEnabled={false} 
        // 2. Snap precisely to our custom item width
        snapToInterval={ITEM_WIDTH} 
        decelerationRate="fast"
        // 3. Optional: snaps alignment to center or start
        snapToAlignment="center" 
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={onMomentumScrollEnd}
        // 4. Wrap elements in container style to perfectly center the active card
        contentContainerStyle={{
          paddingHorizontal: 16, 
        }}
        renderItem={({ item }) => (
          <Image
            source={item}
            resizeMode="cover"
            style={{
              width: ITEM_WIDTH,
              height: 256,
              borderRadius: 24,
            }}
          />
        )}
      />

      {/* Pagination */}
      <View className="flex-row justify-center mt-3">
        {images.map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-2 rounded-full transition-all duration-300 ${
              currentIndex === i ? "bg-blue-500 w-6" : "bg-gray-300 w-2"
            }`}
          />
        ))}
      </View>
    </View>
  );
}