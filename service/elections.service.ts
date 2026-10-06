import { api } from './api';

// Lowercase — must match the server's ElectionStatus enum values exactly.
export type ElectionStatus =
  | 'draft'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'nominations'
  | 'campaign'
  | 'voting'
  | 'closed'
  | 'results_published'
  | 'certified'
  | 'cancelled';

export type PositionScope = 'school' | 'faculty' | 'department';
export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type BallotChoice = 'candidate' | 'yes' | 'no' | 'abstain';

export interface Election {
  id: string;
  schoolId: string;
  createdById: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  challengeHours: number;
  rejectionReason: string | null;
  eligibleVoterCount: number | null;
  resultsPublishedAt: string | null;
  certifiedAt: string | null;
  createdAt: string;
  /** Distinct levels this election's positions are for (list endpoints only) */
  positionScopes?: { scope: PositionScope; scopeId: string | null }[];
}

export interface ElectionCandidate {
  id: string;
  userId: string;
  manifesto: string;
  status: CandidateStatus;
  rejectionReason: string | null;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
}

export interface ElectionPosition {
  id: string;
  title: string;
  description: string | null;
  scope: PositionScope;
  scopeId: string | null;
  sortOrder: number;
  /** Whether the current user may vote (and run) for this position */
  eligible: boolean;
  candidates: ElectionCandidate[];
}

export interface PositionResult {
  positionId: string;
  title: string;
  type: 'no_candidates' | 'uncontested' | 'contested';
  // uncontested
  candidate?: { candidateId: string; userId: string; name: string | null };
  yes?: number;
  no?: number;
  elected?: boolean;
  // contested
  candidates?: Array<{ candidateId: string; userId: string; name: string | null; votes: number }>;
  winnerCandidateIds?: string[];
  tie?: boolean;
  abstain?: number;
}

export interface ElectionResults {
  turnout: { eligible: number; voted: number };
  positions: PositionResult[];
  talliedAt: string;
}

export interface CommitteeEntry {
  userId: string;
  role: 'chair' | 'member';
  addedAt: string;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
}

export interface ElectionDetail extends Election {
  challengeEndsAt: string | null;
  results: ElectionResults | null;
  positions: ElectionPosition[];
  turnout: { eligible: number; voted: number } | null;
  /** Chair first, then members */
  committee: CommitteeEntry[];
  me: {
    /** Chair or member */
    isCommittee: boolean;
    /** The Student Union account running the election */
    isChair: boolean;
    candidacy: {
      id: string;
      positionId: string;
      status: CandidateStatus;
      rejectionReason: string | null;
      manifesto: string;
    } | null;
    onVoterRoll: boolean;
    hasVoted: boolean;
  };
}

export interface CreateElectionPayload {
  title: string;
  description?: string;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  challengeHours?: number;
}

export interface CreatePositionPayload {
  title: string;
  description?: string;
  scope: PositionScope;
  scopeId?: string;
}

export interface BallotSelection {
  positionId: string;
  choice: BallotChoice;
  candidateId?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ReceiptSelection {
  positionId: string;
  positionTitle: string;
  choice: BallotChoice;
  candidateName: string | null;
}

/** Ballot details are only included when the receipt belongs to the signed-in student. */
export interface ReceiptCheck {
  counted: boolean;
  isYours?: boolean;
  /** YYYY-MM-DD — the day only, never the time */
  votedOn?: string | null;
  selections?: ReceiptSelection[];
}

export interface StudentSearchResult {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  matricNumber: string;
  facultyId: string | null;
  departmentId: string | null;
  alreadyCandidate: boolean;
  /** Chair or member of this election's committee */
  onCommittee: boolean;
}

export const electionsService = {
  listForSchool: async () => (await api.get('/elections')).data as Election[],
  listMine: async () => (await api.get('/elections/mine')).data as Election[],
  getDetail: async (id: string) => (await api.get(`/elections/${id}`)).data as ElectionDetail,
  getAuditLog: async (id: string) => (await api.get(`/elections/${id}/audit-log`)).data as AuditLogEntry[],

  // Committee
  create: async (payload: CreateElectionPayload) => (await api.post('/elections', payload)).data as Election,
  update: async (id: string, payload: Partial<CreateElectionPayload>) =>
    (await api.patch(`/elections/${id}`, payload)).data as Election,
  addPosition: async (id: string, payload: CreatePositionPayload) =>
    (await api.post(`/elections/${id}/positions`, payload)).data,
  removePosition: async (id: string, positionId: string) =>
    (await api.delete(`/elections/${id}/positions/${positionId}`)).data,
  submit: async (id: string) => (await api.post(`/elections/${id}/submit`)).data as Election,
  cancel: async (id: string) => (await api.post(`/elections/${id}/cancel`)).data as Election,
  approveCandidate: async (id: string, candidateId: string) =>
    (await api.post(`/elections/${id}/candidates/${candidateId}/approve`)).data,
  rejectCandidate: async (id: string, candidateId: string, reason: string) =>
    (await api.post(`/elections/${id}/candidates/${candidateId}/reject`, { reason })).data,
  publishResults: async (id: string) => (await api.post(`/elections/${id}/publish-results`)).data as Election,
  searchStudents: async (id: string, q: string) =>
    (await api.get(`/elections/${id}/committee/student-search`, { params: { q } })).data as StudentSearchResult[],
  addCommitteeMember: async (id: string, userId: string) =>
    (await api.post(`/elections/${id}/committee/members`, { userId })).data,
  removeCommitteeMember: async (id: string, userId: string) =>
    (await api.delete(`/elections/${id}/committee/members/${userId}`)).data,
  registerCandidate: async (id: string, userId: string, positionId: string, manifesto?: string) =>
    (await api.post(`/elections/${id}/committee/candidates`, { userId, positionId, manifesto })).data,

  // Candidates
  apply: async (id: string, positionId: string, manifesto: string) =>
    (await api.post(`/elections/${id}/candidates`, { positionId, manifesto })).data,
  withdraw: async (id: string) => (await api.post(`/elections/${id}/candidates/withdraw`)).data,
  updateManifesto: async (id: string, manifesto: string) =>
    (await api.patch(`/elections/${id}/candidates/me/manifesto`, { manifesto })).data,

  // Voting
  requestVoteCode: async (id: string) =>
    (await api.post(`/elections/${id}/vote/request-code`)).data as { sent: boolean; email: string },
  castVote: async (id: string, code: string, selections: BallotSelection[]) =>
    (await api.post(`/elections/${id}/vote`, { code, selections })).data as { success: boolean; receiptCode: string },
  checkReceipt: async (id: string, code: string) =>
    (await api.get(`/elections/${id}/receipts/${encodeURIComponent(code)}`)).data as ReceiptCheck,
};

/** Human label for each stage, as students see it. */
export const ELECTION_STATUS_LABEL: Record<ElectionStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Awaiting approval',
  rejected: 'Needs changes',
  approved: 'Scheduled',
  nominations: 'Nominations open',
  campaign: 'Campaign',
  voting: 'Voting open',
  closed: 'Counting',
  results_published: 'Results out',
  certified: 'Certified',
  cancelled: 'Cancelled',
};

export const ELECTION_STATUS_COLOR: Record<ElectionStatus, string> = {
  draft: '#6B7280',
  pending_approval: '#F79009',
  rejected: '#E11D48',
  approved: '#0284C7',
  nominations: '#7C3AED',
  campaign: '#7C3AED',
  voting: '#12B76A',
  closed: '#F79009',
  results_published: '#0284C7',
  certified: '#12B76A',
  cancelled: '#6B7280',
};

/** Same rule as the server: a committee term lasts one year from Student Union verification. */
export const COMMITTEE_TERM_DAYS = 365;

export function committeeTermEndsAt(verifiedAt: string | null | undefined): Date | null {
  if (!verifiedAt) return null;
  return new Date(new Date(verifiedAt).getTime() + COMMITTEE_TERM_DAYS * 24 * 3600 * 1000);
}

/** Year an election belongs to in listings — the year its voting opens. */
export function electionYear(e: Pick<Election, 'votingOpenAt'>): number {
  return new Date(e.votingOpenAt).getFullYear();
}

export function candidateName(c: ElectionCandidate): string {
  const u = c.user;
  if (!u) return 'Candidate';
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Candidate';
}

export function formatElectionDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
