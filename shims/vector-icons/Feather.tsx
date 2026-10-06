import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf";

const Feather = createIconSet(glyphMap as Record<string, number>, "Feather", font as unknown as string);
export default Feather;
