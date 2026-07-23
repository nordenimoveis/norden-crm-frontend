'use client';

import { useRouter } from 'next/navigation';
import { Loader2, MapPin, User, Clock } from 'lucide-react';
import { useVisitasAgendadas } from '@/hooks/use-visitas-agendadas';
import { useAuthStore } from '@/store/auth-store';
import { Lead } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatarDataHora(iso: string) {
  const data = new Date(iso);
  return {
    dia: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function agruparPorUrgencia(visitas: Lead[]) {
  const agora = new Date();
  const hojeFim = new Date(agora);
  hojeFim.setHours(23, 59, 59, 999);
  const amanhaFim = new Date(hojeFim);
  amanhaFim.setDate(amanhaFim.getDate() + 1);
  const semanaFim = new Date(hojeFim);
  semanaFim.setDate(semanaFim.getDate() + 7);

  const grupos = {
    atrasadas: [] as Lead[],
    hoje: [] as Lead[],
    amanha: [] as Lead[],
    semana: [] as Lead[],
    depois: [] as Lead[],
  };

  for (const lead of visitas) {
    if (!lead.dataVisita) continue;
    const data = new Date(lead.dataVisita);

    if (data < agora) grupos.atrasadas.push(lead);
    else if (data <= hojeFim) grupos.hoje.push(lead);
    else if (data <= amanhaFim) grupos.amanha.push(lead);
    else if (data <= semanaFim) grupos.semana.push(lead);
    else grupos.depois.push(lead);
  }

  return grupos;
}

export function VisitasList() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const ehGestorOuAdmin = usuario?.papel === 'gestor' || usuario?.papel === 'admin';
  const { data: visitas, isLoading } = useVisitasAgendadas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando visitas...
      </div>
    );
  }

  if (!visitas || visitas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Nenhuma visita agendada ainda. Marque a data/hora ao editar um lead (ícone de lápis no
        chat) para ela aparecer aqui.
      </div>
    );
  }

  const grupos = agruparPorUrgencia(visitas);

  return (
    <div className="space-y-6">
      <GrupoVisitas
        titulo="Atrasadas"
        visitas={grupos.atrasadas}
        tom="urgente"
        ehGestorOuAdmin={ehGestorOuAdmin}
        onAbrir={(id) => router.push(`/kanban?leadId=${id}`)}
      />
      <GrupoVisitas
        titulo="Hoje"
        visitas={grupos.hoje}
        tom="hoje"
        ehGestorOuAdmin={ehGestorOuAdmin}
        onAbrir={(id) => router.push(`/kanban?leadId=${id}`)}
      />
      <GrupoVisitas
        titulo="Amanhã"
        visitas={grupos.amanha}
        ehGestorOuAdmin={ehGestorOuAdmin}
        onAbrir={(id) => router.push(`/kanban?leadId=${id}`)}
      />
      <GrupoVisitas
        titulo="Esta semana"
        visitas={grupos.semana}
        ehGestorOuAdmin={ehGestorOuAdmin}
        onAbrir={(id) => router.push(`/kanban?leadId=${id}`)}
      />
      <GrupoVisitas
        titulo="Mais adiante"
        visitas={grupos.depois}
        ehGestorOuAdmin={ehGestorOuAdmin}
        onAbrir={(id) => router.push(`/kanban?leadId=${id}`)}
      />
    </div>
  );
}

function GrupoVisitas({
  titulo,
  visitas,
  tom,
  ehGestorOuAdmin,
  onAbrir,
}: {
  titulo: string;
  visitas: Lead[];
  tom?: 'urgente' | 'hoje';
  ehGestorOuAdmin: boolean;
  onAbrir: (leadId: string) => void;
}) {
  if (visitas.length === 0) return null;

  return (
    <div>
      <h2
        className={cn(
          'mb-2 text-sm font-medium',
          tom === 'urgente' ? 'text-red-700' : tom === 'hoje' ? 'text-accent' : 'text-foreground'
        )}
      >
        {titulo} ({visitas.length})
      </h2>
      <div className="divide-y divide-border rounded-lg border border-border">
        {visitas.map((lead) => {
          const { dia, hora } = formatarDataHora(lead.dataVisita!);
          return (
            <button
              key={lead.id}
              onClick={() => onAbrir(lead.id)}
              className="flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex w-20 shrink-0 flex-col items-center rounded-md bg-muted/50 py-1.5">
                <span className="text-[11px] uppercase text-muted-foreground">{dia}</span>
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Clock className="h-3 w-3" />
                  {hora}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {lead.nome || lead.telefone}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {lead.imovel?.bairro && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lead.imovel.bairro}
                    </span>
                  )}
                  {ehGestorOuAdmin && lead.corretor && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {lead.corretor.nome}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
