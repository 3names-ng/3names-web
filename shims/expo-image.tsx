import React from "react";
import { Image as RNImage } from "react-native";

export type ImageContentFit = "cover" | "contain" | "fill" | "none" | "scale-down";

export interface ImageProps {
  source?: any;
  style?: any;
  contentFit?: ImageContentFit;
  contentPosition?: string;
  transition?: number | { duration?: number };
  placeholder?: any;
  placeholderContentFit?: ImageContentFit;
  recylingKey?: string;
  priority?: string;
  cachePolicy?: string;
  onLoad?: (event: any) => void;
  onError?: (event: any) => void;
  onAnimationFinish?: () => void;
  alt?: string;
  accessible?: boolean;
  [key: string]: any;
}

const resizeModeMap: Record<string, any> = {
  cover: "cover",
  contain: "contain",
  fill: "stretch",
  none: "none",
  "scale-down": "contain",
};

/** Web stand-in for expo-image backed by react-native-web's Image. */
const ImageBase = React.forwardRef<any, ImageProps>(function Image(
  { source, style, contentFit, transition, placeholder, recylingKey, ...rest },
  ref
) {
  const uri =
    typeof source === "string"
      ? source
      : Array.isArray(source)
        ? source?.[0]?.uri ?? source?.[0]
        : source?.uri ?? source;

  const { onLoad: onLoadProp, onError: onErrorProp, ...rnRest } = rest as any;
  delete rnRest.placeholderContentFit;
  delete rnRest.contentPosition;
  delete rnRest.cachePolicy;
  delete rnRest.priority;
  delete rnRest.alt;

  return (
    <RNImage
      ref={ref}
      source={uri ? { uri } : source}
      style={style}
      resizeMode={resizeModeMap[contentFit || "cover"] || "cover"}
      onLoad={onLoadProp}
      onError={onErrorProp}
      {...rnRest}
    />
  );
});

ImageBase.displayName = "ExpoImageShim";
export const Image = ImageBase as typeof ImageBase & typeof ImageStatics;

// expo-image static helpers. The browser HTTP cache can't be cleared from JS.
export const ImageStatics = {
  clearDiskCache: async () => true,
  clearMemoryCache: async () => true,
  prefetch: async (urls: string | string[]) => {
    await Promise.all(
      ([] as string[]).concat(urls).map(
        (u) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = img.onerror = () => resolve();
            img.src = u;
          })
      )
    );
    return true;
  },
};
Object.assign(ImageBase, ImageStatics);

export default Image;
