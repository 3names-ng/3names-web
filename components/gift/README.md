# TikTok-style Gift Modal (React Native / Expo)

A bottom-sheet gift picker with four rarity tiers (common, rare, epic,
legendary), each with its own card styling and animation, plus sound
effects on send and a full-screen "flying gift" banner for big gifts.

## Files

```
App.js                        demo screen — open this to try it
components/GiftModal.js       the modal itself (tabs, grid, send button)
components/GiftGridItem.js    animated per-rarity gift card
components/GiftSendOverlay.js full-screen flying-gift banner (epic/legendary)
components/rarityStyles.js    color/animation config per rarity tier
data/giftsData.js             the gift catalog — edit this to add your own
hooks/useGiftSoundPlayer.js   plays sounds via expo-audio
assets/sounds/                put your .mp3 files here
```

## Install

```bash
npx create-expo-app my-app
cd my-app
# copy these files in, overwriting App.js
npx expo install expo-audio expo-linear-gradient
```

`expo-audio` is the current, actively-maintained audio API (`expo-av`
is deprecated and scheduled for removal in Expo SDK 55 — don't start a
new project on it).

## Adding sounds

`data/giftsData.js` has each gift's `sound` field set to `null` so the
project runs immediately without any audio assets. To wire up real
sound effects:

1. Drop short (1–3s) `.mp3`/`.m4a` files into `assets/sounds/`, e.g.
   `pop.mp3`, `chime.mp3`, `whoosh.mp3`, `magic-sparkle.mp3`,
   `drumroll-hit.mp3`, `epic-roar.mp3`, `legendary-fanfare.mp3`.
2. In `giftsData.js`, uncomment the matching `require('../assets/sounds/...')`
   line in the `sounds` object.
3. Cheap/common gifts are usually silent or just a tiny "pop" on
   TikTok — leave `sound: null` for any gift you don't want to make
   noise.

Free, royalty-free effects you can use for this: pixabay.com/sound-effects,
mixkit.co/free-sound-effects, freesound.org (check each clip's license).

## Customizing gifts

Add/remove gifts in `data/giftsData.js`. Each entry needs:

```js
{
  id: 'unique_id',
  name: 'Display Name',
  icon: '🎁',              // emoji, or swap the <Text> for <Image> in GiftGridItem
  coins: 100,
  rarity: RARITY.RARE,     // COMMON | RARE | EPIC | LEGENDARY — drives styling
  sound: sounds.chime,     // or null
}
```

Rarity look-and-feel (colors, glow, which animation runs) lives in
`components/rarityStyles.js` — edit `RARITY_CONFIG` to reskin without
touching component logic.

## Behavior by rarity

| Rarity     | Card                          | Animation                  | Send effect              |
|------------|-------------------------------|-----------------------------|---------------------------|
| Common     | flat, no border glow          | none                        | sound only (optional)     |
| Rare       | colored border                | breathing glow pulse        | sound only                |
| Epic       | gradient background           | gentle wobble                | sound + flying banner     |
| Legendary  | gradient + dashed glow ring   | rotating ring + shimmer sweep | sound + flying banner     |

## Wiring it into your app

```jsx
import GiftModal from './components/GiftModal';

<GiftModal
  visible={showGifts}
  onClose={() => setShowGifts(false)}
  coinBalance={coins}
  onSend={(gift) => {
    setCoins((c) => c - gift.coins);
    // call your backend / socket emit here
  }}
  senderName="YourUsername"
/>
```

`GiftModal` handles playing the sound and triggering the flying-gift
overlay internally — the parent only needs to deduct the balance and
notify your backend.
