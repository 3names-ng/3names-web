import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Flame,
  Coins,
  Gift,
  Star,
  ChevronRight,
} from "lucide-react-native";
import { Profile } from "@/types/profile";


interface Props {
  profile: Profile;
  onPress?: () => void;
}

export default function AchievementCard({
  profile,
  onPress,
}: Props) {
  const progress =
    (profile.xp / profile.nextLevelXp) * 100;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
    >
      <LinearGradient
        colors={[
          "#FE2C55",
          "#A855F7",
          "#3B82F6",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.levelRow}>
          <View>
            <Text style={styles.levelTitle}>
              {profile.currentLevel}
            </Text>

            <Text style={styles.levelSubtitle}>
              Keep earning XP to unlock rewards
            </Text>
          </View>

          <Trophy
            color="#FFD54F"
            size={34}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* XP */}


        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
        </View>

        {/* Stats */}

        <View style={styles.statsRow}>
          <View style={styles.item}>
            <Gift
              size={20}
              color="#FFD54F"
            />
            <Text style={styles.number}>
              {profile.gifts}
            </Text>
            <Text style={styles.small}>
              Gifts
            </Text>
          </View>

          <View style={styles.item}>
            <Coins
              size={20}
              color="#FFD54F"
            />
            <Text style={styles.number}>
              {profile.coins}
            </Text>
            <Text style={styles.small}>
              Coins
            </Text>
          </View>

          <View style={styles.item}>
            <Flame
              size={20}
              color="#FF7A00"
            />
            <Text style={styles.number}>
              {profile.streak}
            </Text>
            <Text style={styles.small}>
              Streak
            </Text>
          </View>
        </View>

        {/* Footer */}

        <View style={styles.footer}>
          <View style={styles.rankRow}>
            <Star
              size={18}
              color="#FFD54F"
            />

            <Text style={styles.rank}>
              Campus Rank #28
            </Text>
          </View>

          <ChevronRight
            color="#AAA"
            size={18}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({

  card:{
    marginHorizontal:18,
    marginTop:20,
    backgroundColor:"#18181D",
    borderRadius:22,
    overflow:"hidden",
    borderWidth:1,
    borderColor:"#2A2A32",
  },

  header:{
    padding:18,
  },

  levelRow:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
  },

  levelTitle:{
    color:"#FFF",
    fontSize:22,
    fontWeight:"700",
  },

  levelSubtitle:{
    color:"#EEE",
    marginTop:6,
  },

  content:{
    padding:18,
  },

  row:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginBottom:10,
  },

  label:{
    color:"#AAA",
    fontSize:14,
  },

  value:{
    color:"#FFF",
    fontWeight:"700",
  },

  progressTrack:{
    height:10,
    backgroundColor:"#2A2A32",
    borderRadius:20,
    overflow:"hidden",
  },

  progressFill:{
    height:"100%",
    backgroundColor:"#FFD54F",
    borderRadius:20,
  },

  statsRow:{
    flexDirection:"row",
    justifyContent:"space-around",
    marginTop:25,
  },

  item:{
    alignItems:"center",
  },

  number:{
    color:"#FFF",
    fontWeight:"700",
    fontSize:18,
    marginTop:8,
  },

  small:{
    color:"#999",
    marginTop:4,
    fontSize:12,
  },

  footer:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    marginTop:25,
    paddingTop:15,
    borderTopWidth:1,
    borderTopColor:"#2A2A32",
  },

  rankRow:{
    flexDirection:"row",
    alignItems:"center",
  },

  rank:{
    color:"#FFF",
    marginLeft:8,
    fontWeight:"600",
  },

});