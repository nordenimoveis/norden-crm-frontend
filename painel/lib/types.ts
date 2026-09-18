/**
 * Tipos do domínio, espelhando docs/api.md.
 * Fonte da verdade continua sendo a API; aqui só descrevemos o contrato.
 */

export type Role = 'DONO' | 'ADMIN' | 'CORRETOR';

export const MANAGER_ROLES: Role[] = ['DONO', 'ADMIN'];
export function isManager(role?: Role | null): boolean {
  return !!role && MANAGER_ROLES.includes(role);
}

export type Stage =
  | 'NOVO_LEAD'
  | 'AGUARDANDO_RESPOSTA'
  | 'EM_ATENDIMENTO'
  | 'VISITA_AGENDADA'
  | 'PROPOSTA'
  | 'NEGOCIO_FECHADO'
  | 'LEAD_FRIO';

/** Ordem das colunas do Kanban. */
export const STAGES: Stage[] = [
  'NOVO_LEAD',
  'AGUARDANDO_RESPOSTA',
  'EM_ATENDIMENTO',
  'VISITA_AGENDADA',
  'PROPOSTA',
  'NEGOCIO_FECHADO',
  'LEAD_FRIO',
];

export const STAGE_LABELS: Record<Stage, string> = {
  NOVO_LEAD: 'Novo Lead',
  AGUARDANDO_RESPOSTA: 'Aguardando Resposta',
  EM_ATENDIMENTO: 'Em Atendimento',
  VISITA_AGENDADA: 'Visita Agendada',
  PROPOSTA: 'Proposta',
  NEGOCIO_FECHADO: 'Negócio Fechado',
  LEAD_FRIO: 'Lead Frio',
};

export type Temperature = 'NAO_AVALIADO' | 'FRIO' | 'MORNO' | 'QUENTE';

export const TEMPERATURES: Temperature[] = ['NAO_AVALIADO', 'FRIO', 'MORNO', 'QUENTE'];

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  NAO_AVALIADO: 'Não avaliado',
  FRIO: 'Frio',
  MORNO: 'Morno',
  QUENTE: 'Quente',
};

export type Source =
  | 'META_ADS'
  | 'INSTAGRAM'
  | 'SITE'
  | 'WHATSAPP_DIRETO'
  | 'BASE_ANTIGA'
  | 'MANUAL';

export const SOURCE_LABELS: Record<Source, string> = {
  META_ADS: 'Meta Ads',
  INSTAGRAM: 'Instagram',
  SITE: 'Site',
  WHATSAPP_DIRETO: 'WhatsApp direto',
  BASE_ANTIGA: 'Base Antiga',
  MANUAL: 'Manual',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  inRotation?: boolean;
  lastAssignedAt?: string | null;
  chatwootAgentId?: number | null;
  chatwootConfigured?: boolean;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  preview: string;
  paramSources: string[];
  active: boolean;
}

export type CampaignStatus = 'RASCUNHO' | 'AGENDADA' | 'ENVIANDO' | 'CONCLUIDA' | 'CANCELADA';

export interface Campaign {
  id: string;
  name: string;
  templateName: string;
  templatePreview: string;
  status: CampaignStatus;
  scheduledFor: string | null;
  total: number;
  sent: number;
  failed: number;
  createdAt: string;
  pending?: number;
}

export interface CampaignFilters {
  stages?: string[];
  temperatures?: string[];
  sources?: string[];
  brokerId?: string | null;
  includeOld?: boolean;
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  RASCUNHO: 'Rascunho',
  AGENDADA: 'Agendada',
  ENVIANDO: 'Enviando',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export interface ReportSummary {
  periodDays: number;
  byStage: { stage: string; total: number }[];
  bySource: { source: string; total: number }[];
  byBroker: { brokerId: string; broker: string; total: number; responded: number; closed: number }[];
  byTemperature: { temperature: Temperature; total: number }[];
  cadence: { status: string; total: number }[];
}

export interface LeadSummary {
  id: string;
  name: string;
  /** Chave da etapa no funil (definida em pipeline_stages). */
  stage: string;
  temperature: Temperature;
  source: Source;
  brokerId: string | null;
  brokerName?: string | null;
  phone?: string | null;
  interest?: string | null;
  email?: string | null;
  tags: string[];
  campaign?: string | null;
  notes?: string | null;
  hasConversation?: boolean;
  lastInboundAt?: string | null;
  aiSummary?: string | null;
  aiSuggestedTemperature?: Temperature | null;
  aiUpdatedAt?: string | null;
  lostReasonId?: string | null;
  lostAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CadenceStep {
  step: number;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  lastError: string | null;
}

export interface TimelineEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface LeadDetail {
  lead: LeadSummary;
  cadence: CadenceStep[];
  events: TimelineEvent[];
}

/** Etiqueta que marca a base antiga do Imobzi (fora do Kanban por padrão). */
export const BASE_ANTIGA_TAG = 'Base Antiga';

export interface Broker {
  id: string;
  name: string;
}

/** Papéis de sistema das etapas (carregam comportamento; chave fixa). */
export type StageRole = 'NEW' | 'AWAITING' | 'ACTIVE' | 'WON' | 'COLD' | 'LOST' | null;

export interface PipelineStage {
  id: string;
  key: string;
  label: string;
  position: number;
  systemRole: StageRole;
  isSystem: boolean;
}

export interface LossReason {
  id: string;
  label: string;
  position: number;
  active: boolean;
}

export type MessageDirection = 'in' | 'out' | 'system';

export interface ChatAttachment {
  id: number;
  type?: string | null;
  url?: string | null;
  thumb?: string | null;
}

export interface ChatMessage {
  id: number;
  direction: MessageDirection;
  private: boolean;
  text: string;
  at: string;
  senderName?: string | null;
  status?: string | null;
  attachments?: ChatAttachment[];
}

export interface MessagesPage {
  messages: ChatMessage[];
  canSendFreeText: boolean;
  windowExpiresAt: string | null;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  global: boolean;
}

export interface LeadTemplate {
  step: number;
  name: string;
  preview: string;
}
