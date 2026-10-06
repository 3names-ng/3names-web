import { useEffect, useRef, useCallback } from 'react';
import { acquireNamespace, releaseNamespace } from './socketManager';
import { useAuthStore } from '@/store/authStore';
import type { Socket } from 'socket.io-client';

// ── Event names ──
export const WarEvents = {
  // Client → Server
  JOIN_ROOM: 'war:join_room',
  LEAVE_ROOM: 'war:leave_room',
  RESUME_BATTLE: 'war:resume',

  // Server → Client
  CHALLENGE_SENT: 'war:challenge_sent',
  CHALLENGE_ACCEPTED: 'war:challenge_accepted',
  CHALLENGE_REJECTED: 'war:challenge_rejected',
  BATTLE_START: 'war:battle_start',
  QUESTION_START: 'war:question_start',
  ANSWER_SUBMITTED: 'war:answer_submitted',
  SCORE_UPDATE: 'war:score_update',
  BATTLE_ENDED: 'war:battle_ended',
  BATTLE_RESUMED: 'war:battle_resumed',
  SCHEDULED_REMINDER: 'war:scheduled_reminder',
  OPPONENT_DISCONNECTED: 'war:opponent_disconnected',
} as const;

// ── Payload types ──
export interface ChallengeSentPayload {
  battleId: string;
  challenger: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
  type: string;
  scheduledAt?: string;
  expiresAt?: string;
  challengerStats?: {
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    currentWinStreak: number;
    bestWinStreak: number;
  };
}

export interface ChallengeAcceptedPayload {
  battleId: string;
  opponent: {
    id: string;
    username: string | null;
    firstName: string | null;
    profilePictureUrl: string | null;
  };
}

export interface ChallengeRejectedPayload {
  battleId: string;
  reason?: 'rejected' | 'expired' | 'cancelled';
  by?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
}

export interface BattleStartPayload {
  battleId: string;
  questions: Array<{ id: string; questionText: string; options: string[] }>;
  totalQuestions: number;
  timePerQuestion: number;
}

export interface QuestionStartPayload {
  battleId: string;
  questionIndex: number;
  player1Score?: number;
  player2Score?: number;
}

export interface AnswerSubmittedPayload {
  battleId: string;
  answeredBy: string;
  player1Score: number;
  player2Score: number;
  questionIndex: number;
}

/** Real-time score broadcast — sent after every answer submission. */
export interface ScoreUpdatePayload {
  battleId: string;
  questionIndex: number;
  totalQuestions: number;
  player1Score: number;
  player2Score: number;
  player1Answered: boolean;
  player2Answered: boolean;
  answeredBy: string;
  pointsEarned: number;
  isCorrect: boolean;
  youAnswered: boolean;
}

export interface BattleEndedPayload {
  battleId: string;
  winnerId: string | null;
  player1Score: number;
  player2Score: number;
  departmentPoints: number;
  stats: {
    player1: { totalBattles: number; wins: number; losses: number };
    player2: { totalBattles: number; wins: number; losses: number };
  };
}

/**
 * Snapshot sent to a player who reconnects mid-battle (war:battle_resumed).
 * Same shape as the GET /war/resume payload.
 */
export type BattleResumedPayload =
  | { status: 'none' }
  | {
      status: 'countdown' | 'active';
      battleId: string;
      questions: Array<{ id: string; questionText: string; options: string[] }>;
      totalQuestions: number;
      timePerQuestion: number;
      questionIndex: number;
      player1Id: string;
      player2Id: string | null;
      player1Score: number;
      player2Score: number;
      player1Answered: boolean;
      player2Answered: boolean;
      timeLeft?: number;
    }
  | {
      status: 'finished';
      battleId: string;
      player1Id: string;
      player2Id: string | null;
      winnerId: string | null;
      player1Score: number;
      player2Score: number;
      departmentPoints: number;
      finishedAt: string | null;
    };

// ── Hook ──
interface UseWarSocketOptions {
  onChallengeSent?: (data: ChallengeSentPayload) => void;
  onChallengeAccepted?: (data: ChallengeAcceptedPayload) => void;
  onBattleStart?: (data: BattleStartPayload) => void;
  onQuestionStart?: (data: QuestionStartPayload) => void;
  onAnswerSubmitted?: (data: AnswerSubmittedPayload) => void;
  onScoreUpdate?: (data: ScoreUpdatePayload) => void;
  onBattleEnded?: (data: BattleEndedPayload) => void;
  onChallengeRejected?: (data: ChallengeRejectedPayload) => void;
  onScheduledReminder?: (data: any) => void;
  /** Called whenever the socket (re)connects — used to detect "connecting back" after a disconnect. */
  onConnect?: () => void;
  /** Snapshot of the user's battle after reconnecting (war:battle_resumed). */
  onBattleResumed?: (data: BattleResumedPayload) => void;
}

export function useWarSocket(options: UseWarSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!token) return;

    const socket = acquireNamespace('/department-war');
    socketRef.current = socket;

    if (socket.connected) {
      console.log('✅ [War Socket] Connected:', socket.id);
    }

    const onConnect = () => {
      console.log('✅ [War Socket] Connected:', socket.id);
      optionsRef.current.onConnect?.();
    };

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ [War Socket] Disconnected:', reason);
    };

    const onChallengeSent = (data: ChallengeSentPayload) => {
      optionsRef.current.onChallengeSent?.(data);
    };

    const onBattleStart = (data: BattleStartPayload) => {
      optionsRef.current.onBattleStart?.(data);
    };

    const onQuestionStart = (data: QuestionStartPayload) => {
      optionsRef.current.onQuestionStart?.(data);
    };

    const onAnswerSubmitted = (data: AnswerSubmittedPayload) => {
      optionsRef.current.onAnswerSubmitted?.(data);
    };

    const onScoreUpdate = (data: ScoreUpdatePayload) => {
      optionsRef.current.onScoreUpdate?.(data);
    };

    const onBattleEnded = (data: BattleEndedPayload) => {
      optionsRef.current.onBattleEnded?.(data);
    };

    const onChallengeAccepted = (data: ChallengeAcceptedPayload) => {
      optionsRef.current.onChallengeAccepted?.(data);
    };

    const onChallengeRejected = (data: ChallengeRejectedPayload) => {
      optionsRef.current.onChallengeRejected?.(data);
    };

    const onScheduledReminder = (data: any) => {
      optionsRef.current.onScheduledReminder?.(data);
    };

    const onBattleResumed = (data: BattleResumedPayload) => {
      optionsRef.current.onBattleResumed?.(data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(WarEvents.CHALLENGE_SENT, onChallengeSent);
    socket.on(WarEvents.BATTLE_START, onBattleStart);
    socket.on(WarEvents.QUESTION_START, onQuestionStart);
    socket.on(WarEvents.ANSWER_SUBMITTED, onAnswerSubmitted);
    socket.on(WarEvents.SCORE_UPDATE, onScoreUpdate);
    socket.on(WarEvents.BATTLE_ENDED, onBattleEnded);
    socket.on(WarEvents.CHALLENGE_ACCEPTED, onChallengeAccepted);
    socket.on(WarEvents.CHALLENGE_REJECTED, onChallengeRejected);
    socket.on(WarEvents.SCHEDULED_REMINDER, onScheduledReminder);
    socket.on(WarEvents.BATTLE_RESUMED, onBattleResumed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(WarEvents.CHALLENGE_SENT, onChallengeSent);
      socket.off(WarEvents.BATTLE_START, onBattleStart);
      socket.off(WarEvents.QUESTION_START, onQuestionStart);
      socket.off(WarEvents.ANSWER_SUBMITTED, onAnswerSubmitted);
      socket.off(WarEvents.SCORE_UPDATE, onScoreUpdate);
      socket.off(WarEvents.BATTLE_ENDED, onBattleEnded);
      socket.off(WarEvents.CHALLENGE_ACCEPTED, onChallengeAccepted);
      socket.off(WarEvents.CHALLENGE_REJECTED, onChallengeRejected);
      socket.off(WarEvents.SCHEDULED_REMINDER, onScheduledReminder);
      socket.off(WarEvents.BATTLE_RESUMED, onBattleResumed);

      releaseNamespace('/department-war');
      socketRef.current = null;
    };
  }, [token]);

  const joinBattleRoom = useCallback((battleId: string) => {
    socketRef.current?.emit(WarEvents.JOIN_ROOM, { battleId });
  }, []);

  const leaveBattleRoom = useCallback((battleId: string) => {
    socketRef.current?.emit(WarEvents.LEAVE_ROOM, { battleId });
  }, []);

  /** Ask the server for a snapshot of our current battle after reconnecting. */
  const resumeBattle = useCallback((battleId?: string) => {
    socketRef.current?.emit(WarEvents.RESUME_BATTLE, { battleId });
  }, []);

  return { joinBattleRoom, leaveBattleRoom, resumeBattle };
}
