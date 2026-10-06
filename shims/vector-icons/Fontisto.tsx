import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Fontisto.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Fontisto.ttf";

const Fontisto = createIconSet(glyphMap as Record<string, number>, "Fontisto", font as unknown as string);
export default Fontisto;
