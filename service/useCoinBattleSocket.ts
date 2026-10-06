import { useEffect, useRef, useCallback } from 'react';
import { acquireNamespace, releaseNamespace } from './socketManager';
import { useAuthStore } from '@/store/authStore';
import type { Socket } from 'socket.io-client';

// ── Event names ──
export const CoinBattleEvents = {
  // Client → Server
  JOIN_ROOM: 'coin-battle:join_room',
  LEAVE_ROOM: 'coin-battle:leave_room',

  // Server → Client
  QUEUE_JOINED: 'coin-battle:queue_joined',
  QUEUE_LEFT: 'coin-battle:queue_left',
  MATCH_FOUND: 'coin-battle:match_found',
  CHALLENGE_SENT: 'coin-battle:challenge_sent',
  CHALLENGE_ACCEPTED: 'coin-battle:challenge_accepted',
  CHALLENGE_REJECTED: 'coin-battle:challenge_rejected',
  BATTLE_START: 'coin-battle:battle_start',
  QUESTION_START: 'coin-battle:question_start',
  SCORE_UPDATE: 'coin-battle:score_update',
  BATTLE_ENDED: 'coin-battle:battle_ended',
  OPPONENT_DISCONNECTED: 'coin-battle:opponent_disconnected',
  OPPONENT_RECONNECTING: 'coin-battle:opponent_reconnecting',
  OPPONENT_RECONNECTED: 'coin-battle:opponent_reconnected',
} as const;

// ── Payload types ──
export interface QueueJoinedPayload {
  battleId: string;
  stake: number;
  status: string;
}

export interface QueueLeftPayload {
  battleId: string;
  status: string;
  reason?: string;
}

export interface CoinChallengeSentPayload {
  battleId: string;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  challenger: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
  expiresAt: string;
}

export interface CoinChallengeAcceptedPayload {
  battleId: string;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  opponent: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
}

export interface CoinChallengeRejectedPayload {
  battleId: string;
  reason?: 'rejected' | 'cancelled' | 'expired';
}

export interface MatchFoundPayload {
  battleId: string;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  player1Id: string;
  player2Id: string;
  player1: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
  player2: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
}

export interface CoinBattleStartPayload {
  battleId: string;
  questions: Array<{ id: string; questionText: string; options: string[] }>;
  totalQuestions: number;
  timePerQuestion: number;
  stake: number;
  pot: number;
  winnerPrize: number;
}

export interface CoinQuestionStartPayload {
  battleId: string;
  questionIndex: number;
  player1Score: number;
  player2Score: number;
}

export interface CoinScoreUpdatePayload {
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

export interface CoinBattleEndedPayload {
  battleId: string;
  winnerId: string | null;
  player1Score: number;
  player2Score: number;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  isDraw: boolean;
  /** Set when the battle ended because this player didn't reconnect in time */
  forfeitedBy?: string;
}

/** The battle was cancelled before it could be played (everyone refunded). */
export interface OpponentDisconnectedPayload {
  battleId: string;
  reason?: string;
}

/** The opponent dropped mid-battle — they forfeit at `forfeitAt` unless they return. */
export interface OpponentReconnectingPayload {
  battleId: string;
  userId: string;
  forfeitAt: string;
}

export interface OpponentReconnectedPayload {
  battleId: string;
  userId: string;
}

// ── Hook ──
interface UseCoinBattleSocketOptions {
  onQueueJoined?: (data: QueueJoinedPayload) => void;
  onQueueLeft?: (data: QueueLeftPayload) => void;
  onMatchFound?: (data: MatchFoundPayload) => void;
  onChallengeSent?: (data: CoinChallengeSentPayload) => void;
  onChallengeAccepted?: (data: CoinChallengeAcceptedPayload) => void;
  onChallengeRejected?: (data: CoinChallengeRejectedPayload) => void;
  onBattleStart?: (data: CoinBattleStartPayload) => void;
  onQuestionStart?: (data: CoinQuestionStartPayload) => void;
  onScoreUpdate?: (data: CoinScoreUpdatePayload) => void;
  onBattleEnded?: (data: CoinBattleEndedPayload) => void;
  onOpponentDisconnected?: (data: OpponentDisconnectedPayload) => void;
  onOpponentReconnecting?: (data: OpponentReconnectingPayload) => void;
  onOpponentReconnected?: (data: OpponentReconnectedPayload) => void;
}

export function useCoinBattleSocket(options: UseCoinBattleSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!token) return;

    const socket = acquireNamespace('/coin-battle');
    socketRef.current = socket;

    if (socket.connected) {
      console.log('✅ [CoinBattle Socket] Connected:', socket.id);
    }

    const onConnect = () => {
      console.log('✅ [CoinBattle Socket] Connected:', socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ [CoinBattle Socket] Disconnected:', reason);
    };

    const onQueueJoined = (data: QueueJoinedPayload) => {
      optionsRef.current.onQueueJoined?.(data);
    };

    const onQueueLeft = (data: QueueLeftPayload) => {
      optionsRef.current.onQueueLeft?.(data);
    };

    const onMatchFound = (data: MatchFoundPayload) => {
      optionsRef.current.onMatchFound?.(data);
    };

    const onChallengeSent = (data: CoinChallengeSentPayload) => {
      optionsRef.current.onChallengeSent?.(data);
    };

    const onChallengeAccepted = (data: CoinChallengeAcceptedPayload) => {
      optionsRef.current.onChallengeAccepted?.(data);
    };

    const onChallengeRejected = (data: CoinChallengeRejectedPayload) => {
      optionsRef.current.onChallengeRejected?.(data);
    };

    const onBattleStart = (data: CoinBattleStartPayload) => {
      optionsRef.current.onBattleStart?.(data);
    };

    const onQuestionStart = (data: CoinQuestionStartPayload) => {
      optionsRef.current.onQuestionStart?.(data);
    };

    const onScoreUpdate = (data: CoinScoreUpdatePayload) => {
      optionsRef.current.onScoreUpdate?.(data);
    };

    const onBattleEnded = (data: CoinBattleEndedPayload) => {
      optionsRef.current.onBattleEnded?.(data);
    };

    const onOpponentDisconnected = (data: OpponentDisconnectedPayload) => {
      optionsRef.current.onOpponentDisconnected?.(data);
    };

    const onOpponentReconnecting = (data: OpponentReconnectingPayload) => {
      optionsRef.current.onOpponentReconnecting?.(data);
    };

    const onOpponentReconnected = (data: OpponentReconnectedPayload) => {
      optionsRef.current.onOpponentReconnected?.(data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(CoinBattleEvents.QUEUE_JOINED, onQueueJoined);
    socket.on(CoinBattleEvents.QUEUE_LEFT, onQueueLeft);
    socket.on(CoinBattleEvents.MATCH_FOUND, onMatchFound);
    socket.on(CoinBattleEvents.CHALLENGE_SENT, onChallengeSent);
    socket.on(CoinBattleEvents.CHALLENGE_ACCEPTED, onChallengeAccepted);
    socket.on(CoinBattleEvents.CHALLENGE_REJECTED, onChallengeRejected);
    socket.on(CoinBattleEvents.BATTLE_START, onBattleStart);
    socket.on(CoinBattleEvents.QUESTION_START, onQuestionStart);
    socket.on(CoinBattleEvents.SCORE_UPDATE, onScoreUpdate);
    socket.on(CoinBattleEvents.BATTLE_ENDED, onBattleEnded);
    socket.on(CoinBattleEvents.OPPONENT_DISCONNECTED, onOpponentDisconnected);
    socket.on(CoinBattleEvents.OPPONENT_RECONNECTING, onOpponentReconnecting);
    socket.on(CoinBattleEvents.OPPONENT_RECONNECTED, onOpponentReconnected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(CoinBattleEvents.QUEUE_JOINED, onQueueJoined);
      socket.off(CoinBattleEvents.QUEUE_LEFT, onQueueLeft);
      socket.off(CoinBattleEvents.MATCH_FOUND, onMatchFound);
      socket.off(CoinBattleEvents.CHALLENGE_SENT, onChallengeSent);
      socket.off(CoinBattleEvents.CHALLENGE_ACCEPTED, onChallengeAccepted);
      socket.off(CoinBattleEvents.CHALLENGE_REJECTED, onChallengeRejected);
      socket.off(CoinBattleEvents.BATTLE_START, onBattleStart);
      socket.off(CoinBattleEvents.QUESTION_START, onQuestionStart);
      socket.off(CoinBattleEvents.SCORE_UPDATE, onScoreUpdate);
      socket.off(CoinBattleEvents.BATTLE_ENDED, onBattleEnded);
      socket.off(CoinBattleEvents.OPPONENT_DISCONNECTED, onOpponentDisconnected);
      socket.off(CoinBattleEvents.OPPONENT_RECONNECTING, onOpponentReconnecting);
      socket.off(CoinBattleEvents.OPPONENT_RECONNECTED, onOpponentReconnected);

      releaseNamespace('/coin-battle');
      socketRef.current = null;
    };
  }, [token]);

  const joinBattleRoom = useCallback((battleId: string) => {
    socketRef.current?.emit(CoinBattleEvents.JOIN_ROOM, { battleId });
  }, []);

  const leaveBattleRoom = useCallback((battleId: string) => {
    socketRef.current?.emit(CoinBattleEvents.LEAVE_ROOM, { battleId });
  }, []);

  return { joinBattleRoom, leaveBattleRoom };
}
