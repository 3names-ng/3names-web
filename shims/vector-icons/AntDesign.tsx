import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/AntDesign.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf";

const AntDesign = createIconSet(glyphMap as Record<string, number>, "AntDesign", font as unknown as string);
export default AntDesign;
