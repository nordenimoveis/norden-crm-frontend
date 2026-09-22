'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileUp, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { importLeads, type ImportResult, type ImportRow } from '@/lib/api/leads';
import { mapCsvToLeads, parseCsv, type ParsedLead } from '@/lib/csv';

const MAX_ROWS = 5000;
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível importar');

/** Tela de importação em massa da base antiga (Configurações → Importar base). */
export function ImportView() {
  const qc = useQueryClient();
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reprocessa o CSV a cada mudança do texto.
  const parsed = useMemo(() => {
    const text = raw.trim();
    if (!text) return { rows: [] as ParsedLead[], hadHeader: false };
    const { rows, hadHeader } = mapCsvToLeads(parseCsv(text));
    return { rows, hadHeader };
  }, [raw]);

  // Só linhas com nome vão para a API (o nome é obrigatório).
  const withName = useMemo(() => parsed.rows.filter((r) => r.name.trim()), [parsed.rows]);
  const noName = parsed.rows.length - withName.length;
  const noContact = withName.filter((r) => !r.phone && !r.email).length;
  const tooMany = withName.length > MAX_ROWS;

  const importM = useMutation({
    mutationFn: (rows: ImportRow[]) => importLeads(rows),
    onSuccess: (res) => {
      setResult(res);
      setError(null);
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (e) => {
      setError(msg(e));
      setResult(null);
    },
  });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ''));
    reader.readAsText(file, 'utf-8');
  }

  function reset() {
    setRaw('');
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Traga a base antiga do Imobzi (ou de qualquer planilha). Os contatos entram com a etiqueta{' '}
          <span className="font-medium text-foreground">Base Antiga</span> — ficam fora do Kanban e da
          roleta, sem disparar a régua, disponíveis para campanhas futuras.
        </p>
        <p className="text-xs text-muted-foreground">
          Exporte da planilha como CSV. Colunas reconhecidas: <code>nome</code>, <code>telefone</code>,{' '}
          <code>email</code>, <code>interesse</code>, <code>observação</code>. Sem cabeçalho, usamos essa
          ordem. Só o nome + (telefone ou e-mail) são obrigatórios.
        </p>
      </div>

      {result ? (
        <ResultPanel result={result} onReset={reset} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv"
              onChange={onFile}
              className="hidden"
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" /> Escolher arquivo CSV
            </Button>
            {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
            {raw && (
              <Button type="button" variant="ghost" onClick={reset} className="ml-auto">
                Limpar
              </Button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Ou cole o conteúdo do CSV</label>
            <textarea
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setResult(null);
              }}
              rows={7}
              spellCheck={false}
              placeholder={'nome;telefone;email;interesse\nMariana Souza;48 99999-0001;mariana@email.com;Cobertura Jurerê'}
              className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 font-mono text-xs text-foreground shadow-card outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {parsed.rows.length > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-medium">
                  {withName.length} {withName.length === 1 ? 'contato pronto' : 'contatos prontos'}
                </span>
                {!parsed.hadHeader && (
                  <span className="text-xs text-muted-foreground">
                    Sem cabeçalho reconhecido — usando a ordem padrão das colunas.
                  </span>
                )}
                {noName > 0 && (
                  <span className="text-xs text-muted-foreground">{noName} sem nome (ignoradas)</span>
                )}
                {noContact > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-500">
                    {noContact} sem telefone/e-mail (serão recusadas)
                  </span>
                )}
              </div>

              <PreviewTable rows={withName.slice(0, 8)} />
              {withName.length > 8 && (
                <p className="text-xs text-muted-foreground">
                  …e mais {withName.length - 8} linha(s). Prévia das 8 primeiras.
                </p>
              )}

              {tooMany && (
                <p className="text-sm text-destructive">
                  Máximo de {MAX_ROWS.toLocaleString('pt-BR')} por importação. Divida o arquivo em partes.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={withName.length === 0 || tooMany || importM.isPending}
              onClick={() => importM.mutate(withName.map(toImportRow))}
            >
              {importM.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Importando…
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Importar {withName.length > 0 ? withName.length : ''} contato(s)
                </>
              )}
            </Button>
            {importM.isPending && (
              <span className="text-xs text-muted-foreground">Pode levar alguns segundos.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function toImportRow(l: ParsedLead): ImportRow {
  return {
    name: l.name.trim(),
    phone: l.phone,
    email: l.email,
    interest: l.interest,
    notes: l.notes,
  };
}

function PreviewTable({ rows }: { rows: ParsedLead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-1.5 pr-3 font-medium">Nome</th>
            <th className="py-1.5 pr-3 font-medium">Telefone</th>
            <th className="py-1.5 pr-3 font-medium">E-mail</th>
            <th className="py-1.5 font-medium">Interesse</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 pr-3 text-foreground">{r.name || '—'}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{r.phone || '—'}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{r.email || '—'}</td>
              <td className="py-1.5 text-muted-foreground">{r.interest || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Importação concluída</p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{result.created}</span> criado(s),{' '}
            <span className="font-medium text-foreground">{result.duplicate}</span> já existia(m)
            {result.errors.length > 0 && (
              <>
                {' '}
                e <span className="font-medium text-destructive">{result.errors.length}</span> com erro
              </>
            )}
            {' '}de {result.total} linha(s).
          </p>
          <p className="text-xs text-muted-foreground">
            Para ver os contatos, ative o filtro <span className="font-medium">Base Antiga</span> no quadro.
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-2 text-sm font-medium text-destructive">Linhas não importadas</p>
          <ul className="max-h-52 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {result.errors.map((e) => (
              <li key={e.row}>
                Linha {e.row} ({e.name || 'sem nome'}): {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button type="button" variant="secondary" onClick={onReset}>
        Importar outro arquivo
      </Button>
    </div>
  );
}
