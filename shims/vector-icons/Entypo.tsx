import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Entypo.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf";

const Entypo = createIconSet(glyphMap as Record<string, number>, "Entypo", font as unknown as string);
export default Entypo;
