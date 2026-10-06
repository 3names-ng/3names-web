import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf";

const MaterialCommunityIcons = createIconSet(glyphMap as Record<string, number>, "MaterialCommunityIcons", font as unknown as string);
export default MaterialCommunityIcons;
