import React from "react";
import { FlatList } from "react-native";
import LeaderCard from "./leaderCard";

type LeaderListProps = {
  leaders?: any[];
};



export default function LeaderList({ leaders = [] }: LeaderListProps) {

  return (
    <FlatList
      data={leaders}
      keyExtractor={(item, index) => item.id || String(index)}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
      renderItem={({ item, index }) => {
        const avatar =
          item.user?.profilePictureUrl ||
          item.user?.avatar ||
          item.avatar ||
          "https://via.placeholder.com/150";

        const name =
        
          item?.user?.username ||
        
          "Student";

        return (
          <LeaderCard
            rank={item.rank || index + 1}
            avatar={avatar}
            name={name}
            level={item.currentLevel || item.level || 1}
            appLevel={item.appLevel}
            xp={item.giftsGiven || item.totalXp || item.xp || 0}
            verified={item.verified}
            profileFrame={item.user?.profileFrame}
            onPress={() => {}}
          />
        );
      }}
    />
  );
}