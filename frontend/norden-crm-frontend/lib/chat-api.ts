import { apiFetch } from './api-client';
import { Canal, LeadDetalhado, Mensagem, QuickReply } from './types';

export async function buscarLeadDetalhado(leadId: string): Promise<LeadDetalhado> {
  return apiFetch<LeadDetalhado>(`/api/leads/${leadId}`);
}

/**
 * Envia texto livre roteando pelo canal do lead:
 *  - WhatsApp  → /api/whatsapp/leads/:id/texto (usa o telefone)
 *  - Instagram / Messenger → /api/mensageria/leads/:id/:canal/texto
 * O `telefone` só é usado no ramo WhatsApp.
 */
export async function enviarMensagemTexto(
  leadId: string,
  telefone: string | null,
  texto: string,
  canal: Canal = 'whatsapp'
): Promise<Mensagem> {
  if (canal === 'whatsapp') {
    return apiFetch<Mensagem>(`/api/whatsapp/leads/${leadId}/texto`, {
      method: 'POST',
      body: { telefone, texto },
    });
  }

  return apiFetch<Mensagem>(`/api/mensageria/leads/${leadId}/${canal}/texto`, {
    method: 'POST',
    body: { texto },
  });
}

export async function buscarQuickReplies(busca?: string): Promise<QuickReply[]> {
  const params = new URLSearchParams();
  if (busca) params.set('busca', busca);
  const query = params.toString();
  return apiFetch<QuickReply[]>(`/api/quick-replies${query ? `?${query}` : ''}`);
}
