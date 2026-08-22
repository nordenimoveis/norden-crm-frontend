'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Loader2,
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
} from 'lucide-react';
import {
  useTemplates,
  useSincronizarTemplatesMeta,
} from '@/hooks/use-templates';
import {
  usePreviewPublico,
  useCriarCampanha,
  useMarcarCampanhaComoPronta,
  useIniciarEnvioCampanha,
  useAgendarCampanha,
  useEnviarTesteCampanha,
} from '@/hooks/use-campanhas';
import { useQuickReplies } from '@/hooks/use-quick-replies';
import { uploadMidiaCampanha } from '@/lib/campanhas-api';
import {
  FiltroPublico,
  LeadOrigem,
  LeadStatus,
  LeadTemperatura,
  TemplateMensagem,
  ROTULO_MIDIA_TIPO,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const ORIGENS: { valor: LeadOrigem; rotulo: string }[] = [
  { valor: 'meta_ads', rotulo: 'Meta Ads' },
  { valor: 'site_imobzi', rotulo: 'Site' },
  { valor: 'manual', rotulo: 'Manual' },
  { valor: 'importacao_planilha', rotulo: 'Planilha' },
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'messenger', rotulo: 'Messenger' },
];
const STATUSES: LeadStatus[] = ['novo', 'respondeu', 'em_atendimento', 'visita_agendada', 'proposta'];
const TEMPERATURAS: LeadTemperatura[] = ['quente', 'morno', 'frio', 'nao_avaliado'];

/**
 * Substitui as variáveis (nomeadas {{nome_cliente}} ou posicionais {{1}}) pelos
 * valores preenchidos, na ordem de `nomes`. Mantém o marcador quando vazio.
 */
function montarPreview(texto: string, nomes: string[], valores: string[]): string {
  return texto.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (original, id) => {
    const i = nomes.indexOf(id);
    const valor = i >= 0 ? valores[i] : undefined;
    return valor?.trim() ? valor : original;
  });
}

export function CampanhaComposer({ onFechar }: { onFechar: () => void }) {
  const { data: templates, isLoading: carregandoTemplates } = useTemplates();
  const sincronizar = useSincronizarTemplatesMeta();
  const criar = useCriarCampanha();
  const marcarPronta = useMarcarCampanhaComoPronta();
  const iniciar = useIniciarEnvioCampanha();
  const agendar = useAgendarCampanha();
  const enviarTeste = useEnviarTesteCampanha();
  const { data: quickReplies } = useQuickReplies('', true);

  const [buscaTemplate, setBuscaTemplate] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [midiaUrl, setMidiaUrl] = useState<string | null>(null);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPublico>({});
  const [telefoneTeste, setTelefoneTeste] = useState('');
  const [quandoAgendar, setQuandoAgendar] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const varFocadaRef = useRef(0);

  const templatesAprovados = useMemo(
    () => (templates ?? []).filter((t) => t.aprovadoMeta && t.metaTemplateName),
    [templates]
  );
  const templatesFiltrados = useMemo(() => {
    if (!buscaTemplate) return templatesAprovados;
    const termo = buscaTemplate.toLowerCase();
    return templatesAprovados.filter(
      (t) => t.nome.toLowerCase().includes(termo) || t.conteudo.toLowerCase().includes(termo)
    );
  }, [templatesAprovados, buscaTemplate]);

  const template = templatesAprovados.find((t) => t.id === templateId) ?? null;

  // Mantém a quantidade de campos de variável em dia com o template — cobre o
  // caso de re-sincronizar os templates com o compositor já aberto (os campos
  // passam a aparecer sozinhos, sem precisar reselecionar).
  const qtdVars = template ? (template.variaveis?.length ?? template.numVariaveis) : 0;
  useEffect(() => {
    setVariaveis((atual) => (atual.length === qtdVars ? atual : Array(qtdVars).fill('')));
  }, [templateId, qtdVars]);

  // Template com {{...}} no texto mas sem variáveis carregadas = registro
  // antigo (sincronizado antes do suporte a variáveis nomeadas).
  const variaveisNaoCarregadas = Boolean(
    template && /\{\{/.test(template.conteudo) && qtdVars === 0
  );

  const { data: preview } = usePreviewPublico(filtro, Boolean(template));
  const totalPublico = preview?.total ?? 0;

  function selecionarTemplate(t: TemplateMensagem) {
    setTemplateId(t.id);
    const qtd = t.variaveis?.length ?? t.numVariaveis;
    setVariaveis(Array(qtd).fill(''));
    setMidiaUrl(null);
    if (!nome) setNome(t.nome);
    setFeedback(null);
  }

  async function aoSoltarArquivo(arquivo: File) {
    if (!template?.midiaTipo) return;
    setEnviandoMidia(true);
    setFeedback(null);
    try {
      const { url } = await uploadMidiaCampanha(arquivo);
      setMidiaUrl(url);
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: (e as Error).message });
    } finally {
      setEnviandoMidia(false);
    }
  }

  function inserirQuickReply(texto: string) {
    setVariaveis((atual) => {
      const copia = [...atual];
      const i = Math.min(varFocadaRef.current, Math.max(0, copia.length - 1));
      if (copia.length === 0) return copia;
      copia[i] = (copia[i] ? copia[i] + ' ' : '') + texto;
      return copia;
    });
  }

  // Validação comum antes de disparar/agendar.
  function validar(): string | null {
    if (!template) return 'Selecione um template aprovado.';
    if (variaveisNaoCarregadas) return 'Sincronize os templates da Meta para carregar as variáveis deste template.';
    if (!nome.trim()) return 'Dê um nome à campanha.';
    if (template.midiaTipo && !midiaUrl) return 'Esse template tem mídia — anexe o arquivo do cabeçalho.';
    if (variaveis.some((v) => !v.trim())) return 'Preencha todas as variáveis do template.';
    if (totalPublico === 0) return 'Nenhum destinatário com esse filtro.';
    return null;
  }

  const parametros = variaveis.length > 0 ? variaveis : undefined;
  const ocupado =
    criar.isPending || marcarPronta.isPending || iniciar.isPending || agendar.isPending;

  async function salvarRascunho() {
    if (!template) return;
    setFeedback(null);
    try {
      await criar.mutateAsync({
        nome: nome.trim() || template.nome,
        templateMensagemId: template.id,
        filtroPublico: filtro,
        midiaUrl: midiaUrl ?? undefined,
        parametros,
      });
      setFeedback({ tipo: 'ok', texto: 'Rascunho salvo.' });
      onFechar();
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: (e as Error).message });
    }
  }

  async function dispararOuAgendar(modo: 'agora' | 'agendar') {
    const erro = validar();
    if (erro) return setFeedback({ tipo: 'erro', texto: erro });
    if (modo === 'agendar' && !quandoAgendar) {
      return setFeedback({ tipo: 'erro', texto: 'Escolha a data e a hora do agendamento.' });
    }
    setFeedback(null);
    try {
      const campanha = await criar.mutateAsync({
        nome: nome.trim(),
        templateMensagemId: template!.id,
        filtroPublico: filtro,
        midiaUrl: midiaUrl ?? undefined,
        parametros,
      });
      await marcarPronta.mutateAsync(campanha.id);
      if (modo === 'agora') {
        await iniciar.mutateAsync(campanha.id);
        setFeedback({ tipo: 'ok', texto: 'Disparo iniciado!' });
      } else {
        await agendar.mutateAsync({
          id: campanha.id,
          agendadoPara: new Date(quandoAgendar).toISOString(),
        });
        setFeedback({ tipo: 'ok', texto: 'Campanha agendada!' });
      }
      onFechar();
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: (e as Error).message });
    }
  }

  async function testar() {
    if (!template) return setFeedback({ tipo: 'erro', texto: 'Selecione um template.' });
    if (variaveisNaoCarregadas)
      return setFeedback({ tipo: 'erro', texto: 'Sincronize os templates da Meta para carregar as variáveis.' });
    if (variaveis.some((v) => !v.trim()))
      return setFeedback({ tipo: 'erro', texto: 'Preencha todas as variáveis antes de testar.' });
    if (!telefoneTeste.trim()) return setFeedback({ tipo: 'erro', texto: 'Informe o número de teste.' });
    if (template.midiaTipo && !midiaUrl)
      return setFeedback({ tipo: 'erro', texto: 'Anexe a mídia antes de testar.' });
    setFeedback(null);
    try {
      await enviarTeste.mutateAsync({
        templateMensagemId: template.id,
        telefone: telefoneTeste.trim(),
        midiaUrl: midiaUrl ?? undefined,
        parametros,
      });
      setFeedback({ tipo: 'ok', texto: 'Teste enviado — confira seu WhatsApp.' });
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: (e as Error).message });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Cabeçalho */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onFechar}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-base font-medium text-foreground">Nova campanha</h2>
        </div>
        <button
          onClick={() => sincronizar.mutate(undefined, {
            onSuccess: (r) =>
              setFeedback({ tipo: 'ok', texto: `${r.total} templates sincronizados da Meta.` }),
            onError: (e) => setFeedback({ tipo: 'erro', texto: (e as Error).message }),
          })}
          disabled={sincronizar.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', sincronizar.isPending && 'animate-spin')} />
          Sincronizar templates da Meta
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs font-medium',
            feedback.tipo === 'ok'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
        >
          {feedback.tipo === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {feedback.texto}
        </div>
      )}

      {/* 3 colunas */}
      <div className="grid flex-1 grid-cols-[280px_1fr_320px] overflow-hidden">
        {/* Coluna 1 — Templates + comandos rápidos */}
        <div className="flex flex-col overflow-hidden border-r border-border">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={buscaTemplate}
                onChange={(e) => setBuscaTemplate(e.target.value)}
                placeholder="Buscar template..."
                className="w-full rounded-md border border-border bg-muted/30 py-1.5 pl-8 pr-3 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Templates aprovados
            </p>
            {carregandoTemplates ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : templatesFiltrados.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Nenhum template aprovado. Clique em “Sincronizar templates da Meta”.
              </p>
            ) : (
              templatesFiltrados.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selecionarTemplate(t)}
                  className={cn(
                    'mb-1 w-full rounded-md border p-2 text-left transition-colors',
                    templateId === t.id
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{t.nome}</span>
                    {t.midiaTipo && <MidiaIcone tipo={t.midiaTipo} />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.conteudo}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="rounded bg-muted px-1 py-0.5">{t.idioma}</span>
                    {t.categoria && <span className="rounded bg-muted px-1 py-0.5">{t.categoria}</span>}
                    {t.numVariaveis > 0 && (
                      <span className="rounded bg-muted px-1 py-0.5">{t.numVariaveis} var.</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Comandos rápidos */}
          {quickReplies && quickReplies.length > 0 && (
            <div className="border-t border-border p-2">
              <p className="flex items-center gap-1 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Zap className="h-3 w-3" /> Comandos rápidos
              </p>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => inserirQuickReply(qr.textoMensagem)}
                    title={qr.textoMensagem}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground transition-colors hover:bg-muted"
                  >
                    {qr.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 2 — Compositor + preview */}
        <div className="flex flex-col overflow-y-auto p-5">
          {!template ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Send className="h-8 w-8 opacity-40" />
              <p className="text-sm">Escolha um template à esquerda para começar.</p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md space-y-4">
              {variaveisNaoCarregadas && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Este template tem variáveis, mas elas ainda não foram carregadas. Clique em{' '}
                    <strong>“Sincronizar templates da Meta”</strong> (no topo) e selecione o template de
                    novo — os campos de preenchimento vão aparecer.
                  </span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome da campanha</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Lançamento Setembro"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
              </div>

              {/* Mídia (drag and drop) */}
              {template.midiaTipo && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Cabeçalho ({ROTULO_MIDIA_TIPO[template.midiaTipo]}) — arraste o arquivo
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastando(true);
                    }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArrastando(false);
                      const arquivo = e.dataTransfer.files?.[0];
                      if (arquivo) aoSoltarArquivo(arquivo);
                    }}
                    className={cn(
                      'relative flex h-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors',
                      arrastando ? 'border-accent bg-accent/5' : 'border-border'
                    )}
                  >
                    {enviandoMidia ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : midiaUrl ? (
                      <div className="flex flex-col items-center gap-1">
                        {template.midiaTipo === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={midiaUrl} alt="mídia" className="h-16 rounded object-cover" />
                        ) : (
                          <MidiaIcone tipo={template.midiaTipo} grande />
                        )}
                        <button
                          onClick={() => setMidiaUrl(null)}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:underline dark:text-red-400"
                        >
                          <X className="h-3 w-3" /> Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <MidiaIcone tipo={template.midiaTipo} grande />
                        <p className="text-[11px] text-muted-foreground">Solte aqui ou</p>
                        <label className="cursor-pointer text-[11px] font-medium text-accent hover:underline">
                          escolher arquivo
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const arquivo = e.target.files?.[0];
                              if (arquivo) aoSoltarArquivo(arquivo);
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Variáveis */}
              {variaveis.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Variáveis do texto
                  </label>
                  {variaveis.map((valor, i) => {
                    const nomeVar = template.variaveis?.[i] ?? `${i + 1}`;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className="max-w-[110px] shrink-0 truncate text-right text-xs font-medium text-muted-foreground"
                          title={`{{${nomeVar}}}`}
                        >
                          {`{{${nomeVar}}}`}
                        </span>
                        <input
                          value={valor}
                          onFocus={() => (varFocadaRef.current = i)}
                          onChange={(e) =>
                            setVariaveis((a) => a.map((v, idx) => (idx === i ? e.target.value : v)))
                          }
                          placeholder={`Valor de ${nomeVar}`}
                          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Prévia</label>
                <div className="rounded-lg bg-[#e5ddd5] p-4 dark:bg-neutral-800">
                  <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2 shadow-sm dark:bg-emerald-900/40">
                    {midiaUrl && template.midiaTipo === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={midiaUrl} alt="mídia" className="mb-2 max-h-40 w-full rounded object-cover" />
                    )}
                    {midiaUrl && template.midiaTipo !== 'image' && (
                      <div className="mb-2 flex items-center gap-2 rounded bg-black/5 p-2 text-xs text-neutral-700 dark:text-neutral-200">
                        <MidiaIcone tipo={template.midiaTipo!} />
                        {ROTULO_MIDIA_TIPO[template.midiaTipo!]} anexado
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-100">
                      {montarPreview(template.conteudo, template.variaveis ?? [], variaveis)}
                    </p>
                    {template.rodape && (
                      <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{template.rodape}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3 — Público + ações */}
        <div className="flex flex-col overflow-y-auto border-l border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Público</p>
          <div className="mt-2 space-y-2">
            <Filtro label="Origem">
              <select
                value={filtro.origem ?? ''}
                onChange={(e) => setFiltro((f) => ({ ...f, origem: (e.target.value || undefined) as LeadOrigem | undefined }))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {ORIGENS.map((o) => (
                  <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                ))}
              </select>
            </Filtro>
            <Filtro label="Status">
              <select
                value={filtro.status ?? ''}
                onChange={(e) => setFiltro((f) => ({ ...f, status: (e.target.value || undefined) as LeadStatus | undefined }))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Todos</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Filtro>
            <Filtro label="Temperatura">
              <select
                value={filtro.temperatura ?? ''}
                onChange={(e) => setFiltro((f) => ({ ...f, temperatura: (e.target.value || undefined) as LeadTemperatura | undefined }))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {TEMPERATURAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Filtro>
          </div>

          <div className="mt-3 rounded-md bg-accent/10 px-3 py-2 text-center">
            <p className="text-2xl font-semibold text-accent">{totalPublico}</p>
            <p className="text-[11px] text-muted-foreground">destinatário(s)</p>
          </div>

          <div className="my-3 h-px bg-border" />

          {/* Envio teste */}
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Envio teste</p>
          <div className="mt-2 flex gap-2">
            <input
              value={telefoneTeste}
              onChange={(e) => setTelefoneTeste(e.target.value)}
              placeholder="5548999998888"
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
            <button
              onClick={testar}
              disabled={enviarTeste.isPending}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {enviarTeste.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Testar
            </button>
          </div>

          <div className="my-3 h-px bg-border" />

          {/* Agendamento */}
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agendar (opcional)</p>
          <input
            type="datetime-local"
            value={quandoAgendar}
            onChange={(e) => setQuandoAgendar(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />

          {/* Ações finais */}
          <div className="mt-4 space-y-2">
            {quandoAgendar ? (
              <button
                onClick={() => dispararOuAgendar('agendar')}
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Agendar disparo
              </button>
            ) : (
              <button
                onClick={() => dispararOuAgendar('agora')}
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar agora
              </button>
            )}
            <button
              onClick={salvarRascunho}
              disabled={ocupado || !template}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Salvar rascunho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Filtro({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MidiaIcone({ tipo, grande }: { tipo: 'image' | 'video' | 'document'; grande?: boolean }) {
  const cls = grande ? 'h-6 w-6 text-muted-foreground' : 'h-3.5 w-3.5 text-muted-foreground';
  if (tipo === 'image') return <ImageIcon className={cls} />;
  if (tipo === 'video') return <Video className={cls} />;
  return <FileText className={cls} />;
}
