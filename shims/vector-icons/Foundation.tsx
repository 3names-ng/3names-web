import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Foundation.json";
import font from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Foundation.ttf";

const Foundation = createIconSet(glyphMap as Record<string, number>, "Foundation", font as unknown as string);
export default Foundation;
