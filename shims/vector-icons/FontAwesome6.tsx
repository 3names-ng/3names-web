import createIconSet from "./createIconSet";
import glyphMap from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome6Free.json";
import meta from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome6Free_meta.json";
import solid from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.ttf";
import regular from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Regular.ttf";
import brands from "../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Brands.ttf";

const brandSet = new Set<string>((meta as Record<string, string[]>).brands ?? []);

const FontAwesome6 = createIconSet(
  glyphMap as Record<string, number>,
  "FontAwesome6_Solid",
  solid as unknown as string,
  ({ name, brand, regular: wantsRegular }) => {
    if (brand || brandSet.has(name)) return { family: "FontAwesome6_Brands", source: brands as unknown as string };
    if (wantsRegular) return { family: "FontAwesome6_Regular", source: regular as unknown as string };
    return { family: "FontAwesome6_Solid", source: solid as unknown as string };
  }
);
export default FontAwesome6;
