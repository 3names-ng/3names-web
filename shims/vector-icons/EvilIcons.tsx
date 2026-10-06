import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/EvilIcons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/EvilIcons.ttf";

const EvilIcons = createIconSet(glyphMap as Record<string, number>, "EvilIcons", font as unknown as string);
export default EvilIcons;
