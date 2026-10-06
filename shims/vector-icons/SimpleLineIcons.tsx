import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/SimpleLineIcons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.ttf";

const SimpleLineIcons = createIconSet(glyphMap as Record<string, number>, "SimpleLineIcons", font as unknown as string);
export default SimpleLineIcons;
