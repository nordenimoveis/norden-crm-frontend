import { Canal, Lead } from './types';

/**
 * Metadados de apresentação de cada canal da caixa de entrada omnichannel.
 * Um único ponto para rótulo, cor e emoji — usado nos badges da lista de
 * conversas, no cabeçalho do chat e na aba de comentários.
 */
export const CANAL_META: Record<
  Canal,
  { rotulo: string; emoji: string; cor: string; corBg: string }
> = {
  whatsapp: {
    rotulo: 'WhatsApp',
    emoji: '💬',
    cor: 'text-emerald-600 dark:text-emerald-400',
    corBg: 'bg-emerald-500',
  },
  instagram: {
    rotulo: 'Instagram',
    emoji: '📸',
    cor: 'text-pink-600 dark:text-pink-400',
    corBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600',
  },
  messenger: {
    rotulo: 'Messenger',
    emoji: '💠',
    cor: 'text-sky-600 dark:text-sky-400',
    corBg: 'bg-sky-500',
  },
};

export const CANAIS: Canal[] = ['whatsapp', 'instagram', 'messenger'];

/** Rótulo curto para exibir sob o nome do contato: telefone (WhatsApp) ou
 * @username / nome do canal social. */
export function identificadorLead(lead: Pick<Lead, 'telefone' | 'canalPrincipal'>): string {
  if (lead.telefone) return lead.telefone;
  return CANAL_META[lead.canalPrincipal]?.rotulo ?? 'Contato';
}

/** Nome de exibição robusto quando o lead não tem nome nem telefone. */
export function nomeExibicaoLead(lead: Pick<Lead, 'nome' | 'telefone' | 'canalPrincipal'>): string {
  return lead.nome || lead.telefone || `${CANAL_META[lead.canalPrincipal]?.rotulo ?? 'Contato'}`;
}
