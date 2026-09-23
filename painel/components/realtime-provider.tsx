'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

interface DraftState {
  drafts: Record<string, string>;
  clear: (leadId: string) => void;
}

const DraftContext = createContext<DraftState>({ drafts: {}, clear: () => {} });

type NotifStatus = 'unsupported' | 'default' | 'granted' | 'denied';

interface UnreadState {
  /** Não lidas por lead (mensagens do cliente ainda não abertas). */
  unread: Record<string, number>;
  totalUnread: number;
  markRead: (leadId: string) => void;
  notifStatus: NotifStatus;
  enableNotifications: () => void;
  soundOn: boolean;
  toggleSound: () => void;
}

const UnreadContext = createContext<UnreadState>({
  unread: {},
  totalUnread: 0,
  markRead: () => {},
  notifStatus: 'unsupported',
  enableNotifications: () => {},
  soundOn: true,
  toggleSound: () => {},
});

/** Lead aberto agora (via ?lead= na URL) — lido na hora do evento, sem closure velho. */
function openLeadId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('lead');
  } catch {
    return null;
  }
}

/** Procura o nome do lead no cache do React Query (para o texto da notificação). */
function findLeadName(qc: QueryClient, leadId: string): string | null {
  try {
    for (const [, data] of qc.getQueriesData<unknown>({ queryKey: ['leads'] })) {
      if (Array.isArray(data)) {
        const hit = data.find((l) => l && typeof l === 'object' && (l as { id?: string }).id === leadId);
        if (hit && (hit as { name?: string }).name) return (hit as { name: string }).name;
      }
    }
    const detail = qc.getQueryData<{ lead?: { name?: string } }>(['lead', leadId]);
    if (detail?.lead?.name) return detail.lead.name;
  } catch {
    /* cache indisponível — segue com nome genérico */
  }
  return null;
}

/** Bipe curto e discreto via Web Audio (sem precisar de arquivo de áudio). */
function makeBeeper() {
  let ctx: AudioContext | null = null;
  const ensure = () => {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };
  // Alguns navegadores só liberam áudio após um gesto do usuário.
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', () => ensure(), { once: true });
  }
  return () => {
    const c = ensure();
    if (!c) return;
    try {
      const now = c.currentTime;
      const notes = [880, 1175];
      notes.forEach((freq, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(c.destination);
        const t = now + i * 0.16;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.start(t);
        o.stop(t + 0.3);
      });
    } catch {
      /* ignora falhas de áudio */
    }
  };
}

/**
 * Tempo real via SSE. Escuta /api/events (proxy) e invalida as consultas do
 * React Query quando algo muda no servidor, deixando Kanban, painel e chat
 * "ao vivo". Também guarda o rascunho sugerido pela IA por lead e avisa o
 * corretor quando um cliente responde (contador, som e notificação).
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('unsupported');
  const [soundOn, setSoundOn] = useState(true);
  const beep = useRef<() => void>(() => {});

  useEffect(() => {
    beep.current = makeBeeper();
    // Preferências salvas (por navegador) — falham em silêncio se bloqueadas.
    try {
      const s = localStorage.getItem('norden_sound');
      if (s !== null) setSoundOn(s === '1');
    } catch {
      /* localStorage indisponível */
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifStatus(Notification.permission as NotifStatus);
    }
  }, []);

  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  useEffect(() => {
    const es = new EventSource('/api/events');
    const parse = (e: MessageEvent): Record<string, unknown> => {
      try {
        return JSON.parse(e.data);
      } catch {
        return {};
      }
    };
    const invalidate = (leadId?: unknown) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      if (typeof leadId === 'string') qc.invalidateQueries({ queryKey: ['lead', leadId] });
    };

    for (const type of ['lead.created', 'lead.updated', 'lead.assigned']) {
      es.addEventListener(type, (e) => invalidate(parse(e as MessageEvent).leadId));
    }

    es.addEventListener('message.created', (e) => {
      const d = parse(e as MessageEvent);
      const leadId = typeof d.leadId === 'string' ? d.leadId : undefined;
      invalidate(leadId);
      // Só avisa quando é o CLIENTE que escreveu e o lead não está aberto na tela.
      if (leadId && d.inbound === true && openLeadId() !== leadId) {
        setUnread((m) => ({ ...m, [leadId]: (m[leadId] ?? 0) + 1 }));
        if (soundOnRef.current) beep.current();
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            const name = findLeadName(qc, leadId);
            const n = new Notification('Nova mensagem no CRM', {
              body: name ? `${name} respondeu — clique para abrir.` : 'Um cliente respondeu — clique para abrir.',
              tag: `lead-${leadId}`,
              icon: '/icon.svg',
            });
            n.onclick = () => {
              window.focus();
              window.location.href = `/kanban?lead=${leadId}`;
            };
          }
        } catch {
          /* notificação indisponível */
        }
      }
    });

    // Tarefas (ligações da régua): atualiza a lista e o contador do topo ao vivo.
    for (const type of ['task.created', 'task.updated']) {
      es.addEventListener(type, () => qc.invalidateQueries({ queryKey: ['tasks'] }));
    }

    es.addEventListener('ai.suggestion', (e) => {
      const d = parse(e as MessageEvent);
      if (typeof d.leadId === 'string') {
        if (typeof d.draftReply === 'string') {
          setDrafts((m) => ({ ...m, [d.leadId as string]: d.draftReply as string }));
        }
        invalidate(d.leadId);
      }
    });

    // O EventSource reconecta sozinho quando o fluxo cai.
    return () => es.close();
  }, [qc]);

  const clear = useCallback((leadId: string) => {
    setDrafts((m) => {
      if (!(leadId in m)) return m;
      const next = { ...m };
      delete next[leadId];
      return next;
    });
  }, []);

  const markRead = useCallback((leadId: string) => {
    setUnread((m) => {
      if (!m[leadId]) return m;
      const next = { ...m };
      delete next[leadId];
      return next;
    });
  }, []);

  const enableNotifications = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    void Notification.requestPermission().then((p) => setNotifStatus(p as NotifStatus));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      try {
        localStorage.setItem('norden_sound', next ? '1' : '0');
      } catch {
        /* ignora */
      }
      if (next) beep.current(); // toca um preview ao ligar
      return next;
    });
  }, []);

  const totalUnread = useMemo(() => Object.values(unread).reduce((a, b) => a + b, 0), [unread]);

  const draftValue = useMemo(() => ({ drafts, clear }), [drafts, clear]);
  const unreadValue = useMemo<UnreadState>(
    () => ({ unread, totalUnread, markRead, notifStatus, enableNotifications, soundOn, toggleSound }),
    [unread, totalUnread, markRead, notifStatus, enableNotifications, soundOn, toggleSound],
  );

  return (
    <DraftContext.Provider value={draftValue}>
      <UnreadContext.Provider value={unreadValue}>{children}</UnreadContext.Provider>
    </DraftContext.Provider>
  );
}

/** Rascunho sugerido pela IA para um lead (chega por SSE). */
export function useDraft(leadId: string) {
  const { drafts, clear } = useContext(DraftContext);
  return { draft: drafts[leadId] ?? null, clearDraft: () => clear(leadId) };
}

/** Estado de não lidas + controles de aviso (som/notificação). */
export function useUnread() {
  return useContext(UnreadContext);
}
