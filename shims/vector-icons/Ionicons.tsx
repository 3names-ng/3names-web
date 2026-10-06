import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf";

const Ionicons = createIconSet(glyphMap as Record<string, number>, "Ionicons", font as unknown as string);
export default Ionicons;
