'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Upload, Download, UserPlus, Trash2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrigemBadge } from '@/components/kanban/origem-badge';
import { TemperaturaBadge } from '@/components/kanban/temperatura-badge';
import { AlertaEstagnadoBadge } from '@/components/kanban/alerta-estagnado-badge';
import { TransferirCorretorSelect } from './transferir-corretor-select';
import { FiltrosTabela } from './filtros-tabela';
import { ImportContactsDialog } from './import-contacts-dialog';
import { NovoLeadDialog } from './novo-lead-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLeadsTabela } from '@/hooks/use-leads-tabela';
import { useDeletarLead } from '@/hooks/use-leads-acoes';
import { useAuthStore } from '@/store/auth-store';
import { FiltrosTabelaLeads } from '@/lib/leads-api';
import { exportarContatos } from '@/lib/contatos-api';
import { ROTULO_STATUS, Lead } from '@/lib/types';

const TAMANHO_PAGINA = 15;

export function LeadsDataTable() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const ehGestorOuAdmin = usuario?.papel === 'gestor' || usuario?.papel === 'admin';

  const [filtros, setFiltros] = useState<FiltrosTabelaLeads>({ page: 1, pageSize: TAMANHO_PAGINA });
  const [importAberto, setImportAberto] = useState(false);
  const [novoLeadAberto, setNovoLeadAberto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [leadParaExcluir, setLeadParaExcluir] = useState<Lead | null>(null);
  const deletar = useDeletarLead();
  const { data, isLoading, isPlaceholderData } = useLeadsTabela(filtros);

  async function confirmarExclusao() {
    if (!leadParaExcluir) return;
    await deletar.mutateAsync(leadParaExcluir.id);
    setLeadParaExcluir(null);
  }

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / TAMANHO_PAGINA)) : 1;

  function atualizarFiltros(novos: Partial<FiltrosTabelaLeads>) {
    setFiltros((atual) => ({ ...atual, ...novos }));
  }

  function abrirChat(leadId: string) {
    router.push(`/mensagens?leadId=${leadId}`);
  }

  async function exportar() {
    setExportando(true);
    try {
      await exportarContatos();
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Barra de ações — importar/exportar só para gestor/admin */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="accent" size="sm" onClick={() => setNovoLeadAberto(true)}>
          <UserPlus className="h-4 w-4" />
          Novo Lead
        </Button>

        {ehGestorOuAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportar} disabled={exportando}>
              {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportAberto(true)}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
          </div>
        )}
      </div>

      <FiltrosTabela filtros={filtros} onMudar={atualizarFiltros} />

      <NovoLeadDialog aberto={novoLeadAberto} onFechar={() => setNovoLeadAberto(false)} />
      <ImportContactsDialog aberto={importAberto} onFechar={() => setImportAberto(false)} />

      <Dialog open={!!leadParaExcluir} onOpenChange={(v) => !v && setLeadParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lead</DialogTitle>
            <DialogDescription>
              Isso apaga em definitivo <strong>{leadParaExcluir?.nome || leadParaExcluir?.telefone}</strong>{' '}
              e todo o histórico (mensagens, notas, agendamentos). Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadParaExcluir(null)} disabled={deletar.isPending}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={confirmarExclusao}
              disabled={deletar.isPending}
            >
              {deletar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando leads...
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Alerta</TableHead>
                {ehGestorOuAdmin && <TableHead>Corretor</TableHead>}
                {ehGestorOuAdmin && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={ehGestorOuAdmin ? 8 : 6} className="text-center text-sm text-muted-foreground">
                    Nenhum lead encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              )}

              {data?.items.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => abrirChat(lead.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium text-foreground">{lead.nome || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.telefone}</TableCell>
                  <TableCell className="text-muted-foreground">{ROTULO_STATUS[lead.status]}</TableCell>
                  <TableCell>
                    <OrigemBadge origem={lead.origem} />
                  </TableCell>
                  <TableCell>
                    <TemperaturaBadge temperatura={lead.temperatura} />
                  </TableCell>
                  <TableCell>
                    <AlertaEstagnadoBadge alerta={lead.alerta} horasParado={lead.horasParado} />
                  </TableCell>
                  {ehGestorOuAdmin && (
                    <TableCell>
                      <TransferirCorretorSelect leadId={lead.id} corretorAtualId={lead.corretorId} />
                    </TableCell>
                  )}
                  {ehGestorOuAdmin && (
                    <TableCell>
                      <button
                        title="Excluir lead"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadParaExcluir(lead);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data?.total ?? 0} lead{(data?.total ?? 0) !== 1 ? 's' : ''} encontrado
              {(data?.total ?? 0) !== 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(filtros.page ?? 1) <= 1}
                onClick={() => atualizarFiltros({ page: (filtros.page ?? 1) - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Página {filtros.page ?? 1} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(filtros.page ?? 1) >= totalPaginas || isPlaceholderData}
                onClick={() => atualizarFiltros({ page: (filtros.page ?? 1) + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
