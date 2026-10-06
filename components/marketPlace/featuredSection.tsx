import React from "react";
import { FlatList } from "react-native";

import ProductCard from "./productCard";
import { products } from "@/data/marketPlace";

export default function FeaturedSection() {
  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 10,
      }}
      ItemSeparatorComponent={() => <></>}
      renderItem={({ item }) => (
        <ProductCard
          title={item.title}
          price={item.price}
          image={item.image}
          seller={item.seller}
          sellerAvatar={item.sellerAvatar}
          location={item.location}
          featured={item.featured}
          appLevel={item.appLevel}
        />
      )}
    />
  );
}