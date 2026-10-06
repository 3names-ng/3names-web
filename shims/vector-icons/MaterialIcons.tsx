import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf";

const MaterialIcons = createIconSet(glyphMap as Record<string, number>, "MaterialIcons", font as unknown as string);
export default MaterialIcons;
