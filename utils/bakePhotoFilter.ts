import { FilterMode, ImageFormat, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';

import { FILTER_BY_ID } from '@/constants/cameraFilters';
import { filterEffect, filterUniforms } from '@/components/camera/filterShader';

/**
 * Applies a camera filter to a photo file at full resolution and returns the
 * uri of a new JPEG. Used for photos that weren't filtered live (Expo Go
 * captures and gallery picks) — the filter is chosen after capture and baked
 * in just before upload. Returns the original uri for "original"/unknown ids.
 */
export async function bakePhotoFilter(uri: string, filterId: string | undefined): Promise<string> {
  const filter = filterId ? FILTER_BY_ID[filterId] : undefined;
  if (!filter || filter.id === 'original') return uri;

  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Could not read the photo');

  const width = image.width();
  const height = image.height();
  const surface = Skia.Surface.MakeOffscreen(width, height) ?? Skia.Surface.Make(width, height);
  if (!surface) throw new Error('Could not prepare the photo filter');

  const paint = Skia.Paint();
  paint.setShader(
    filterEffect.makeShaderWithChildren(filterUniforms(filter.params, width, height), [
      image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None),
    ]),
  );
  surface.getCanvas().drawRect(Skia.XYWHRect(0, 0, width, height), paint);
  surface.flush();

  const bytes = surface.makeImageSnapshot().encodeToBytes(ImageFormat.JPEG, 92);
  const file = new File(Paths.cache, `filtered_${Date.now()}.jpg`);
  file.write(bytes);
  return file.uri;
}
