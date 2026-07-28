'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, FileSearch, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSimularPergunta } from '@/hooks/use-ia';
import { FonteSimulador } from '@/lib/ia-api';
import { cn } from '@/lib/utils';

type MensagemSimulador = {
  id: string;
  tipo: 'pergunta' | 'resposta';
  texto: string;
  fontes?: FonteSimulador[];
};

export function SimuladorIA() {
  const [mensagens, setMensagens] = useState<MensagemSimulador[]>([]);
  const [pergunta, setPergunta] = useState('');
  const simular = useSimularPergunta();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function enviar() {
    const texto = pergunta.trim();
    if (!texto || simular.isPending) return;

    setPergunta('');
    setMensagens((atual) => [...atual, { id: crypto.randomUUID(), tipo: 'pergunta', texto }]);

    try {
      const resultado = await simular.mutateAsync(texto);
      setMensagens((atual) => [
        ...atual,
        {
          id: crypto.randomUUID(),
          tipo: 'resposta',
          texto: resultado.resposta,
          fontes: resultado.fontes,
        },
      ]);
    } catch (e) {
      setMensagens((atual) => [
        ...atual,
        {
          id: crypto.randomUUID(),
          tipo: 'resposta',
          texto: `⚠️ Erro ao simular: ${(e as Error).message}`,
        },
      ]);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">Simulador de IA</p>
        <p className="text-xs text-muted-foreground">
          Teste perguntas aqui antes de ativar a IA em leads reais — nada disso é enviado pro
          WhatsApp.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.length === 0 && (
          <p className="pt-8 text-center text-xs text-muted-foreground">
            Digite uma pergunta abaixo pra ver como a IA responderia.
          </p>
        )}

        {mensagens.map((msg) => (
          <MensagemBolha key={msg.id} mensagem={msg} />
        ))}

        {simular.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Buscando contexto e gerando resposta...
          </div>
        )}

        <div ref={fimRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            rows={1}
            placeholder="Ex: Qual o valor do apartamento na Praia de Jurerê?"
            className="max-h-24 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <Button
            variant="accent"
            size="sm"
            onClick={enviar}
            disabled={!pergunta.trim() || simular.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MensagemBolha({ mensagem }: { mensagem: MensagemSimulador }) {
  const [fontesAbertas, setFontesAbertas] = useState(false);

  if (mensagem.tipo === 'pergunta') {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-lg rounded-tr-sm bg-sidebar px-3 py-2 text-sm text-sidebar-foreground">
            {mensagem.texto}
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <Bot className="h-3 w-3 text-accent" />
        </div>
        <div className="space-y-1.5">
          <div className="rounded-lg rounded-tl-sm border border-border bg-background px-3 py-2 text-sm text-foreground">
            {mensagem.texto}
          </div>

          {mensagem.fontes && mensagem.fontes.length > 0 && (
            <div>
              <button
                onClick={() => setFontesAbertas((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <FileSearch className="h-3 w-3" />
                Ver fontes ({mensagem.fontes.length})
                {fontesAbertas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {fontesAbertas && (
                <div className="mt-1.5 space-y-1.5">
                  {mensagem.fontes.map((fonte, i) => (
                    <div key={i} className="rounded-md border border-border bg-muted/20 p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-foreground">
                          {fonte.tituloDocumento}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                            fonte.similaridade >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : fonte.similaridade >= 40
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {fonte.similaridade}% similar
                        </span>
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        {fonte.conteudo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
