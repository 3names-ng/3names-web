import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome5Free.json";
import meta from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome5Free_meta.json";
import solid from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf";
import regular from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf";
import brands from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf";

const brandSet = new Set<string>((meta as Record<string, string[]>).brands ?? []);

const FontAwesome5 = createIconSet(
  glyphMap as Record<string, number>,
  "FontAwesome5_Solid",
  solid as unknown as string,
  ({ name, brand, regular: wantsRegular }) => {
    if (brand || brandSet.has(name)) return { family: "FontAwesome5_Brands", source: brands as unknown as string };
    if (wantsRegular) return { family: "FontAwesome5_Regular", source: regular as unknown as string };
    return { family: "FontAwesome5_Solid", source: solid as unknown as string };
  }
);
export default FontAwesome5;
