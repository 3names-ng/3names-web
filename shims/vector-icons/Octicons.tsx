import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Octicons.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Octicons.ttf";

const Octicons = createIconSet(glyphMap as Record<string, number>, "Octicons", font as unknown as string);
export default Octicons;
