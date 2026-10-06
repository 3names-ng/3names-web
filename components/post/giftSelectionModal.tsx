import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  category: 'CHIP' | 'HYPE' | 'ELITE' | 'LEGEND';
}

const AVAILABLE_GIFTS: GiftItem[] = [
  // --- LOW TIER / QUICK HITTERS (1 - 19 Coins) ---
  { id: '1', name: 'Rose', icon: '🌹', cost: 1, category: 'CHIP' },
  { id: '2', name: 'Finger Heart', icon: '🫰', cost: 5, category: 'CHIP' },
  { id: '3', name: 'Ice Cream', icon: '🍦', cost: 10, category: 'CHIP' },
  { id: '4', name: 'Good Game', icon: '⚡', cost: 15, category: 'CHIP' },
  { id: '5', name: 'Microphone', icon: '🎤', cost: 19, category: 'CHIP' },
  { id: '6', name: 'Gamepad', icon: '🎮', cost: 25, category: 'CHIP' },
  { id: '7', name: 'Cap', icon: '🧢', cost: 30, category: 'CHIP' },
  { id: '8', name: 'Donut', icon: '🍩', cost: 49, category: 'CHIP' },

  // --- MID TIER / THE HYPE TRAIN (50 - 299 Coins) ---
  { id: '9', name: 'Confetti', icon: '🎉', cost: 50, category: 'HYPE' },
  { id: '10', name: 'Sunglasses', icon: '🕶️', cost: 99, category: 'HYPE' },
  { id: '11', name: 'Pizza Party', icon: '🍕', cost: 120, category: 'HYPE' },
  { id: '12', name: 'Heart Balloon', icon: '🎈', cost: 199, category: 'HYPE' },
  { id: '13', name: 'Magic Wand', icon: '🪄', cost: 250, category: 'HYPE' },
  { id: '14', name: 'Boombox', icon: '📻', cost: 299, category: 'HYPE' },
  { id: '15', name: 'Gold Medal', icon: '🥇', cost: 350, category: 'HYPE' },
  { id: '16', name: 'Firework', icon: '🎆', cost: 450, category: 'HYPE' },

  // --- HIGH TIER / FLEX PACKS (500 - 1999 Coins) ---
  { id: '17', name: 'Crown', icon: '👑', cost: 500, category: 'ELITE' },
  { id: '18', name: 'Diamond', icon: '💎', cost: 888, category: 'ELITE' },
  { id: '19', name: 'Jet Pack', icon: '🚀', cost: 1000, category: 'ELITE' },
  { id: '20', name: 'DJ Mixer', icon: '🎛️', cost: 1200, category: 'ELITE' },
  { id: '21', name: 'Gold Bar', icon: '🪙', cost: 1500, category: 'ELITE' },
  { id: '22', name: 'Meteor', icon: '☄️', cost: 1800, category: 'ELITE' },
  { id: '23', name: 'Sports Car', icon: '🏎️', cost: 2500, category: 'ELITE' },
  { id: '24', name: 'Luxury Yacht', icon: '🛳️', cost: 3500, category: 'ELITE' },

  // --- LEGENDARY TIER / WHALE STATUS (4000+ Coins) ---
  { id: '25', name: 'Castle', icon: '🏰', cost: 4500, category: 'LEGEND' },
  { id: '26', name: 'Pegasus', icon: '🦄', cost: 5500, category: 'LEGEND' },
  { id: '27', name: 'Universe Lion', icon: '🦁', cost: 6999, category: 'LEGEND' },
  { id: '28', name: 'Dragon', icon: '🐉', cost: 7999, category: 'LEGEND' },
  { id: '29', name: 'Phoenix', icon: '🦅', cost: 8999, category: 'LEGEND' },
  { id: '30', name: 'Space Rocket', icon: '🛸', cost: 9999, category: 'LEGEND' },
  { id: '31', name: 'Zeus Bolt', icon: '⚡👑', cost: 12000, category: 'LEGEND' },
  { id: '32', name: 'Golden Planet', icon: '🪐', cost: 15000, category: 'LEGEND' },
];

interface GiftSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSendGift: (gift: GiftItem) => void;
  userBalance?: number;
}

export function GiftSelectionModal({ 
  isVisible, 
  onClose, 
  onSendGift, 
  userBalance = 24500 
}: GiftSelectionModalProps) {
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [activeTab, setActiveTab] = useState<'CHIP' | 'HYPE' | 'ELITE' | 'LEGEND'>('CHIP');

  const filteredGifts = AVAILABLE_GIFTS.filter(g => g.category === activeTab);

  const handleSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift);
      setSelectedGift(null);
      onClose();
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-zinc-950 rounded-t-3xl p-5 pb-8 h-[75%]" onPress={(e) => e.stopPropagation()}>
          <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mb-4" />

          {/* HEADER HEADER BALANCE */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Premium Gifting</Text>
            <View className="bg-zinc-900 px-3 py-1.5 rounded-full flex-row items-center border border-zinc-800">
              <Text className="text-amber-400 mr-1">🪙</Text>
              <Text className="text-zinc-200 text-sm font-semibold">{userBalance}</Text>
            </View>
          </View>

          {/* CATEGORY TABS (TikTok Style navigation) */}
          <View className="flex-row border-b border-zinc-900 mb-4 pb-1">
            {(['CHIP', 'HYPE', 'ELITE', 'LEGEND'] as const).map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                className="flex-1 pb-2 items-center"
              >
                <Text className={`text-xs font-bold ${activeTab === tab ? 'text-purple-500' : 'text-zinc-500'}`}>
                  {tab === 'CHIP' ? 'Classic' : tab === 'HYPE' ? 'Hype' : tab === 'ELITE' ? 'Elite' : 'Legend'}
                </Text>
                {activeTab === tab && <View className="h-0.5 bg-purple-500 w-8 mt-1 rounded-full" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* DYNAMIC GIFT DISPLAY GRID */}
          <FlatList
            data={filteredGifts}
            numColumns={4}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            columnWrapperClassName="justify-start gap-2 mb-4"
            renderItem={({ item }) => {
              const isSelected = selectedGift?.id === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedGift(item)}
                  style={{ width: (Dimensions.get('window').width - 56) / 4 }}
                  className={`p-2.5 rounded-2xl items-center border-2 ${
                    isSelected ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-900 border-zinc-800/40'
                  }`}
                >
                  <Text className="text-3xl mb-1">{item.icon}</Text>
                  <Text className="text-zinc-300 text-[11px] font-medium text-center truncate w-full" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-amber-400 text-[10px] mt-0.5 font-bold">
                    🪙 {item.cost}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* MODAL FOOTER ACTION CONTROLS */}
          <View className="flex-row items-center gap-3 mt-2">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 bg-zinc-900 border border-zinc-800 h-12 rounded-xl justify-center items-center"
            >
              <Text className="text-zinc-400 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              disabled={!selectedGift}
              onPress={handleSend}
              className={`flex-[2] h-12 rounded-xl justify-center items-center ${
                selectedGift ? 'bg-purple-600 active:opacity-90' : 'bg-zinc-800 opacity-40'
              }`}
            >
              <Text className="text-white font-bold text-base">
                {selectedGift ? `Send ${selectedGift.name}` : 'Select a Gift'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}