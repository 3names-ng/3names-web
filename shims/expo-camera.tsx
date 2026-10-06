// Web implementation of the expo-camera API used by the app, on getUserMedia
// (as expo-camera's own web build does): live preview in a <video>,
// takePictureAsync via a canvas snapshot, recordAsync via MediaRecorder.
// Results are blob: URLs, which utils/uploadFile.ts already handles on web.
"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

export type PermissionResponse = {
  granted: boolean;
  status: "granted" | "denied" | "undetermined";
  canAskAgain: boolean;
  expires: "never";
};

function toResponse(state: PermissionState | "unknown"): PermissionResponse {
  const status = state === "granted" ? "granted" : state === "denied" ? "denied" : "undetermined";
  return { granted: status === "granted", status, canAskAgain: status !== "denied", expires: "never" };
}

async function queryPermission(name: "camera" | "microphone"): Promise<PermissionResponse> {
  try {
    const p = await navigator.permissions.query({ name: name as PermissionName });
    return toResponse(p.state);
  } catch {
    return toResponse("unknown");
  }
}

async function requestPermission(kind: "video" | "audio"): Promise<PermissionResponse> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ [kind]: true });
    stream.getTracks().forEach((t) => t.stop());
    return toResponse("granted");
  } catch (e) {
    const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
    return toResponse(denied ? "denied" : "unknown");
  }
}

function usePermission(name: "camera" | "microphone", kind: "video" | "audio") {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);
  useEffect(() => {
    let alive = true;
    queryPermission(name).then((p) => alive && setPermission(p));
    return () => {
      alive = false;
    };
  }, [name]);
  const request = useCallback(async () => {
    const res = await requestPermission(kind);
    setPermission(res);
    return res;
  }, [kind]);
  return [permission, request, request] as [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
}

export const useCameraPermissions = () => usePermission("camera", "video");
export const useMicrophonePermissions = () => usePermission("microphone", "audio");
export const requestCameraPermissionsAsync = () => requestPermission("video");
export const requestMicrophonePermissionsAsync = () => requestPermission("audio");
export const getCameraPermissionsAsync = () => queryPermission("camera");
export const getMicrophonePermissionsAsync = () => queryPermission("microphone");

export type CameraType = "front" | "back";
export type FlashMode = "off" | "on" | "auto";
export type CameraCapturedPicture = { uri: string; width: number; height: number; base64?: string };

export interface CameraViewProps {
  style?: unknown;
  facing?: CameraType;
  active?: boolean;
  mode?: "picture" | "video";
  mute?: boolean;
  zoom?: number;
  flash?: FlashMode;
  enableTorch?: boolean;
  mirror?: boolean;
  videoQuality?: "2160p" | "1080p" | "720p" | "480p" | "4:3";
  videoBitrate?: number;
  onCameraReady?: () => void;
  onMountError?: (event: { message: string }) => void;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface CameraViewRef {
  takePictureAsync(options?: { quality?: number; base64?: boolean }): Promise<CameraCapturedPicture>;
  recordAsync(options?: { maxDuration?: number; [k: string]: unknown }): Promise<{ uri: string } | undefined>;
  stopRecording(): void;
  toggleRecordingAsync(): Promise<void>;
}

const HEIGHTS: Record<string, number> = { "2160p": 2160, "1080p": 1080, "720p": 720, "480p": 480, "4:3": 480 };

const CameraViewImpl = forwardRef<CameraViewRef, CameraViewProps>(function CameraView(
  { style, facing = "back", active = true, mode = "picture", mute = false, videoQuality, videoBitrate, mirror, onCameraReady, onMountError, children },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const callbacks = useRef({ onCameraReady, onMountError });
  callbacks.current = { onCameraReady, onMountError };
  const wantsAudio = mode === "video" && !mute;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const height = videoQuality ? HEIGHTS[videoQuality] : 720;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: facing === "front" ? "user" : "environment", height: { ideal: height } },
        audio: wantsAudio,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => {});
        }
        callbacks.current.onCameraReady?.();
      })
      .catch((e: Error) => callbacks.current.onMountError?.({ message: e.message || "Camera unavailable" }));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active, facing, wantsAudio, videoQuality]);

  useImperativeHandle(
    ref,
    () => ({
      async takePictureAsync(options) {
        const v = videoRef.current;
        if (!v || !v.videoWidth) throw new Error("The camera is not ready yet");
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d")!;
        if (facing === "front" && mirror !== false) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(v, 0, 0);
        const quality = options?.quality ?? 0.92;
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", quality)
        );
        const result: CameraCapturedPicture = { uri: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
        if (options?.base64) result.base64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
        return result;
      },
      recordAsync(options) {
        const stream = streamRef.current;
        if (!stream) return Promise.reject(new Error("The camera is not ready yet"));
        const mimeType = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
        const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: videoBitrate });
        recorderRef.current = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        return new Promise((resolve, reject) => {
          let timer: ReturnType<typeof setTimeout> | null = null;
          rec.onstop = () => {
            if (timer) clearTimeout(timer);
            recorderRef.current = null;
            if (!chunks.length) return resolve(undefined);
            resolve({ uri: URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "video/webm" })) });
          };
          rec.onerror = () => reject(new Error("Recording failed"));
          rec.start(250);
          if (options?.maxDuration) timer = setTimeout(() => rec.state !== "inactive" && rec.stop(), options.maxDuration * 1000);
        });
      },
      stopRecording() {
        const rec = recorderRef.current;
        if (rec && rec.state !== "inactive") rec.stop();
      },
      async toggleRecordingAsync() {
        const rec = recorderRef.current;
        if (!rec) return;
        if (rec.state === "recording") rec.pause();
        else if (rec.state === "paused") rec.resume();
      },
    }),
    [facing, mirror, videoBitrate]
  );

  return (
    <View style={[{ backgroundColor: "#000", overflow: "hidden" }, style as object]}>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: facing === "front" && mirror !== false ? "scaleX(-1)" : undefined,
        }}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
});

// Usable both as a component and as the ref type (`useRef<CameraView>(null)`).
export const CameraView = CameraViewImpl;
export type CameraView = CameraViewRef;

export async function getAvailableCameraTypesAsync(): Promise<CameraType[]> {
  return ["front", "back"];
}
