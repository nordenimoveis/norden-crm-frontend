'use client';

import { useEffect, useState } from 'react';
import { Phone, Pencil, MapPin, CalendarClock, Save, Loader2 } from 'lucide-react';
import { useLeadDetalhado } from '@/hooks/use-lead-detalhado';
import { useAtualizarLead } from '@/hooks/use-atualizar-lead';
import { useAuthStore } from '@/store/auth-store';
import { EditLeadDialog } from '@/components/chat/edit-lead-dialog';
import { OrigemBadge } from '@/components/kanban/origem-badge';
import { TemperaturaBadge } from '@/components/kanban/temperatura-badge';
import { AlertaEstagnadoBadge } from '@/components/kanban/alerta-estagnado-badge';
import { TransferirCorretorSelect } from '@/components/leads-table/transferir-corretor-select';
import { ROTULO_TIPO_AGENDAMENTO } from '@/lib/types';

function iniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function PerfilLeadPanel({ leadId }: { leadId: string }) {
  const { data: lead } = useLeadDetalhado(leadId);
  const atualizar = useAtualizarLead(leadId);
  const usuario = useAuthStore((state) => state.usuario);
  const podeReatribuir = usuario?.papel === 'gestor' || usuario?.papel === 'admin';

  const [editando, setEditando] = useState(false);
  const [notas, setNotas] = useState('');

  // Repopula sempre que troca de lead ou os dados chegam
  useEffect(() => {
    setNotas(lead?.notasInternas ?? '');
  }, [lead?.id, lead?.notasInternas]);

  if (!lead) return <div className="w-[320px] shrink-0 border-l border-border bg-card" />;

  const nomeExibicao = lead.nome || lead.telefone;
  const notasMudaram = notas !== (lead.notasInternas ?? '');

  async function salvarNotas() {
    await atualizar.mutateAsync({ notasInternas: notas.trim() || null });
  }

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
      <div className="flex flex-col items-center border-b border-border p-6">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-xl font-medium text-accent">
          {iniciais(nomeExibicao)}
        </div>
        <p className="text-base font-medium text-foreground">{nomeExibicao}</p>
        <p className="text-sm text-muted-foreground">{lead.telefone}</p>

        <div className="mt-4 flex w-full gap-2">
          <button
            onClick={() => setEditando(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-muted/30 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <a
            href={`tel:${lead.telefone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-muted/30 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </a>
        </div>
      </div>

      <EditLeadDialog lead={lead} aberto={editando} onFechar={() => setEditando(false)} />

      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <TemperaturaBadge temperatura={lead.temperatura} />
            <OrigemBadge origem={lead.origem} />
          </div>
          {lead.alerta && (
            <div className="mt-1.5">
              <AlertaEstagnadoBadge alerta={lead.alerta} horasParado={lead.horasParado} />
            </div>
          )}
        </div>

        {podeReatribuir && (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Corretor responsável
            </p>
            <TransferirCorretorSelect leadId={lead.id} corretorAtualId={lead.corretorId} />
          </div>
        )}

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Contexto
          </p>
          <div className="space-y-2 rounded-lg bg-muted/30 p-3 text-xs">
            {lead.imovel?.bairro && (
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {lead.imovel.bairro}
              </div>
            )}
            {lead.dataAgendamento && lead.tipoAgendamento && (
              <div className="flex items-center gap-2 text-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                {ROTULO_TIPO_AGENDAMENTO[lead.tipoAgendamento]}:{' '}
                {new Date(lead.dataAgendamento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })}{' '}
                às{' '}
                {new Date(lead.dataAgendamento).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
            {!lead.imovel?.bairro && !lead.dataAgendamento && (
              <p className="text-muted-foreground">Nenhum dado de contexto ainda.</p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Notas internas
          </p>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observações sobre o perfil, exigências, histórico..."
            rows={5}
            className="w-full resize-none rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Visível só para a equipe.</p>
            <button
              onClick={salvarNotas}
              disabled={!notasMudaram || atualizar.isPending}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              {atualizar.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
