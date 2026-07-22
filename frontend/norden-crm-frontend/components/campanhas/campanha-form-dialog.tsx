'use client';

import { useState } from 'react';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplates } from '@/hooks/use-templates';
import { useCriarCampanha, usePreviewPublico } from '@/hooks/use-campanhas';
import { FiltroPublico } from '@/lib/types';

const ROTULO_ORIGEM: Record<string, string> = {
  meta_ads: 'Meta Ads',
  site_imobzi: 'Site',
  legado_imobzi: 'Base Antiga',
  importacao_planilha: 'Planilha',
};

const ROTULO_TEMPERATURA: Record<string, string> = {
  nao_avaliado: 'Não avaliado',
  frio: 'Frio',
  morno: 'Morno',
  quente: 'Quente',
};

export function CampanhaFormDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [nome, setNome] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [filtro, setFiltro] = useState<FiltroPublico>({});
  const [erro, setErro] = useState<string | null>(null);

  const { data: templates, isLoading: carregandoTemplates } = useTemplates();
  const templatesAprovados = templates?.filter((t) => t.aprovadoMeta) ?? [];

  const { data: preview, isFetching: contandoPublico } = usePreviewPublico(filtro, aberto);
  const criar = useCriarCampanha();

  function limparEfechar() {
    setNome('');
    setTemplateId('');
    setFiltro({});
    setErro(null);
    onFechar();
  }

  async function salvar() {
    setErro(null);
    try {
      await criar.mutateAsync({ nome, templateMensagemId: templateId, filtroPublico: filtro });
      limparEfechar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const formularioValido = nome.trim() && templateId && (preview?.total ?? 0) > 0;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && limparEfechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>
            O público é definido agora e fica congelado — leads que passarem a bater com esse
            filtro depois não entram sozinhos na campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome-campanha">Nome da campanha</Label>
            <Input
              id="nome-campanha"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reativação base antiga - Julho"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Template aprovado</Label>
            {carregandoTemplates ? (
              <p className="text-xs text-muted-foreground">Carregando templates...</p>
            ) : templatesAprovados.length === 0 ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Nenhum template aprovado pela Meta ainda. Cadastre um na aba "Templates" (e marque
                "Aprovado pela Meta" só depois que ele realmente for aprovado lá).
              </p>
            ) : (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesAprovados.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Filtrar público
            </Label>

            <div className="grid grid-cols-2 gap-2">
              <SeletorFiltro
                placeholder="Origem"
                valor={filtro.origem}
                opcoes={ROTULO_ORIGEM}
                onMudar={(v) => setFiltro((f) => ({ ...f, origem: v as FiltroPublico['origem'] }))}
              />
              <SeletorFiltro
                placeholder="Temperatura"
                valor={filtro.temperatura}
                opcoes={ROTULO_TEMPERATURA}
                onMudar={(v) => setFiltro((f) => ({ ...f, temperatura: v as FiltroPublico['temperatura'] }))}
              />
            </div>

            <div className="flex items-center gap-2 pt-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {contandoPublico ? (
                <span className="text-muted-foreground">Contando...</span>
              ) : (
                <span className={preview?.total ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {preview?.total ?? 0} destinatário{(preview?.total ?? 0) !== 1 ? 's' : ''} encontrado
                  {(preview?.total ?? 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Envie campanhas de disparo em massa só para contatos com relação prévia (base
            antiga/morna). Leads frios sem interação anterior devem vir por anúncio
            (Click-to-WhatsApp), não por disparo ativo — risco real de banimento do número.
          </div>

          {erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {erro}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={limparEfechar} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={salvar} disabled={!formularioValido || criar.isPending}>
            {criar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeletorFiltro({
  placeholder,
  valor,
  opcoes,
  onMudar,
}: {
  placeholder: string;
  valor: string | undefined;
  opcoes: Record<string, string>;
  onMudar: (valor: string | undefined) => void;
}) {
  return (
    <Select value={valor ?? 'todos'} onValueChange={(v) => onMudar(v === 'todos' ? undefined : v)}>
      <SelectTrigger className="text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">{placeholder}: todos</SelectItem>
        {Object.entries(opcoes).map(([v, rotulo]) => (
          <SelectItem key={v} value={v}>
            {rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
