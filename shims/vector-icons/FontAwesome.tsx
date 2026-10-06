import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf";

const FontAwesome = createIconSet(glyphMap as Record<string, number>, "FontAwesome", font as unknown as string);
export default FontAwesome;
