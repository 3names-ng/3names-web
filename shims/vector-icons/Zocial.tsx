import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Zocial.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Zocial.ttf";

const Zocial = createIconSet(glyphMap as Record<string, number>, "Zocial", font as unknown as string);
export default Zocial;
