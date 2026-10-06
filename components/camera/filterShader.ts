import { Skia } from '@shopify/react-native-skia';

import type { FilterParams } from '@/constants/cameraFilters';

/**
 * One shader for every camera filter (see constants/cameraFilters.ts).
 * Order of operations roughly follows how Cloudinary applies the video-safe
 * part (gamma → brightness → contrast → saturation) so videos filtered on the
 * server look close to the live preview.
 *
 * Uniforms are tightly packed, in declaration order — keep filterUniforms()
 * in sync.
 */
export const FILTER_SKSL = `
uniform shader image;
uniform float brightness;
uniform float contrast;
uniform float saturation;
uniform float gammaValue;
uniform float3 gain;
uniform float sepia;
uniform float fade;
uniform float vignette;
uniform float2 size;

half4 main(float2 xy) {
  half4 color = image.eval(xy);
  float3 rgb = color.rgb;

  rgb = pow(max(rgb, float3(0.0)), float3(1.0 / gammaValue));
  rgb = rgb + brightness;
  rgb = (rgb - 0.5) * contrast + 0.5;
  float luma = dot(rgb, float3(0.2126, 0.7152, 0.0722));
  rgb = mix(float3(luma), rgb, saturation);

  float3 sepiaRgb = float3(
    dot(rgb, float3(0.393, 0.769, 0.189)),
    dot(rgb, float3(0.349, 0.686, 0.168)),
    dot(rgb, float3(0.272, 0.534, 0.131)));
  rgb = mix(rgb, sepiaRgb, sepia);

  rgb = rgb * gain;
  rgb = rgb * (1.0 - fade) + fade;

  if (vignette > 0.0 && size.x > 0.0) {
    float d = distance(xy / size, float2(0.5));
    rgb = rgb * (1.0 - vignette * smoothstep(0.35, 0.85, d));
  }

  return half4(half3(clamp(rgb, 0.0, 1.0)), color.a);
}
`;

/** Compiled once at startup and shared by the camera worklet, thumbnails and previews. */
export const filterEffect = Skia.RuntimeEffect.Make(FILTER_SKSL)!;

/** Flat uniform array for makeShaderWithChildren (imperative / worklet use). */
export function filterUniforms(p: FilterParams, width: number, height: number): number[] {
  'worklet';
  return [
    p.brightness,
    p.contrast,
    p.saturation,
    p.gamma,
    p.gain[0],
    p.gain[1],
    p.gain[2],
    p.sepia,
    p.fade,
    p.vignette,
    width,
    height,
  ];
}

/** Named uniforms for the declarative <Shader uniforms={...}> API. */
export function filterUniformsObject(p: FilterParams, width: number, height: number) {
  return {
    brightness: p.brightness,
    contrast: p.contrast,
    saturation: p.saturation,
    gammaValue: p.gamma,
    gain: p.gain,
    sepia: p.sepia,
    fade: p.fade,
    vignette: p.vignette,
    size: [width, height],
  };
}
