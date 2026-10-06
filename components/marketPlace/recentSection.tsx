import React from "react";
import { FlatList } from "react-native";

import SmallProductCard from "./smallProductCard";
import { products } from "@/data/marketPlace";

export default function RecentSection() {
  return (
    <FlatList
      data={products}
      numColumns={2}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={{
        justifyContent: "space-between",
        marginBottom: 18,
      }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
      renderItem={({ item }) => (
        <SmallProductCard
          title={item.title}
          price={item.price}
          image={item.image}
          seller={item.seller}
          sellerAvatar={item.sellerAvatar}
          appLevel={item.appLevel}
          location={item.location}
        />
      )}
    />
  );
}