import { api } from './api';

export type SoundStatus = 'pending' | 'approved' | 'rejected' | 'taken_down';
export type SoundSource = 'library' | 'artist' | 'original' | 'provider';

export const SOUND_GENRES = [
  'afrobeats',
  'amapiano',
  'afropop',
  'street_pop',
  'highlife',
  'hiphop',
  'rnb',
  'gospel',
  'fuji',
  'other',
] as const;
export type SoundGenre = (typeof SOUND_GENRES)[number];

export const GENRE_LABEL: Record<SoundGenre, string> = {
  afrobeats: 'Afrobeats',
  amapiano: 'Amapiano',
  afropop: 'Afropop',
  street_pop: 'Street pop',
  highlife: 'Highlife',
  hiphop: 'Hip-hop',
  rnb: 'R&B',
  gospel: 'Gospel',
  fuji: 'Fuji',
  other: 'Other',
};

export interface Sound {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  audioUrl: string;
  durationMs: number;
  genre: SoundGenre;
  tags: string[];
  source: SoundSource;
  status: SoundStatus;
  attribution: string | null;
  suggestedStartMs: number;
  usageCount: number;
  approvedAt: string | null;
  createdAt: string;
  /** Only on the artist's own uploads */
  reviewNote?: string | null;
}

/** A sound as attached to a post or story, with how it should play. */
export interface SoundSelection {
  sound: Sound;
  /** Where in the track to start, ms */
  startMs: number;
  /** 0–1 */
  soundVolume: number;
  /** 0–1 — the video's own audio while the sound plays */
  originalVolume: number;
}

/** Fields a post/story carries for its sound (sound is null if it was taken down). */
export interface WithSound {
  sound?: Sound | null;
  soundId?: string | null;
  soundStartMs?: number;
  soundVolume?: number;
  originalVolume?: number;
}

/** How long a sound loops on a post — like a TikTok clip. */
export const SOUND_CLIP_MS = 30_000;

export type SoundReportReason = 'copyright' | 'offensive' | 'wrong_info' | 'other';

export const soundService = {
  list: async (params: { q?: string; genre?: SoundGenre; sort?: 'trending' | 'new'; limit?: number; offset?: number }) =>
    (await api.get('/sounds', { params })).data as { items: Sound[]; hasMore: boolean },

  get: async (id: string) => (await api.get(`/sounds/${id}`)).data as Sound,

  report: async (id: string, reason: SoundReportReason, details?: string) =>
    (await api.post(`/sounds/${id}/report`, { reason, details: details || undefined })).data,

  /** Songs the signed-in artist uploaded, with review status. */
  mine: async () => (await api.get('/sounds/mine')).data as Sound[],

  artistUpload: async (input: {
    audio: { uri: string; name: string; type: string };
    cover?: { uri: string; name: string; type: string } | null;
    title: string;
    artistName: string;
    genre: SoundGenre;
    tags?: string;
    suggestedStartMs?: number;
  }) => {
    const form = new FormData();
    form.append('audio', input.audio as any);
    if (input.cover) form.append('cover', input.cover as any);
    form.append('title', input.title);
    form.append('artistName', input.artistName);
    form.append('genre', input.genre);
    if (input.tags?.trim()) form.append('tags', input.tags.trim());
    if (input.suggestedStartMs) form.append('suggestedStartMs', String(Math.round(input.suggestedStartMs)));
    form.append('acceptTerms', 'true');
    const res = await api.post('/sounds/artist', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    });
    return res.data as Sound;
  },
};

/** Adds a sound choice to a multipart story/post upload (field names match the server DTOs). */
export function appendSound(form: FormData, selection: SoundSelection | null | undefined) {
  if (!selection) return;
  form.append('soundId', selection.sound.id);
  form.append('soundStartMs', String(Math.round(selection.startMs)));
  form.append('soundVolume', String(selection.soundVolume));
  form.append('originalVolume', String(selection.originalVolume));
}

/** The fields a story/post carries for its sound — used for optimistic items. */
export function soundFieldsOf(selection: SoundSelection | null | undefined): WithSound {
  if (!selection) return {};
  return {
    sound: selection.sound,
    soundId: selection.sound.id,
    soundStartMs: selection.startMs,
    soundVolume: selection.soundVolume,
    originalVolume: selection.originalVolume,
  };
}

/** Builds a selection from what a post/story stored, or null if it has no (live) sound. */
export function selectionFrom(item: WithSound): SoundSelection | null {
  if (!item.sound) return null;
  return {
    sound: item.sound,
    startMs: item.soundStartMs ?? 0,
    soundVolume: item.soundVolume ?? 1,
    originalVolume: item.originalVolume ?? 1,
  };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
