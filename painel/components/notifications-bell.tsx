'use client';

import { useState } from 'react';
import { Bell, BellRing, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnread } from '@/components/realtime-provider';
import { sendPushTest } from '@/lib/push';

/** Sino de avisos: contador de não lidas + controles de notificação e som. */
export function NotificationsBell() {
  const { totalUnread, notifStatus, enableNotifications, soundOn, toggleSound } = useUnread();
  const [testing, setTesting] = useState(false);
  const has = totalUnread > 0;

  async function handleTest() {
    setTesting(true);
    try {
      await sendPushTest();
    } catch {
      /* silencioso: o menu não é lugar de erro técnico */
    } finally {
      setTesting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={has ? `${totalUnread} mensagem(ns) não lida(s)` : 'Avisos'}
          aria-label={has ? `${totalUnread} não lidas` : 'Avisos'}
        >
          {has ? <BellRing className="text-accent" /> : <Bell />}
          {has && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-[18px] text-destructive-foreground">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{has ? `${totalUnread} não lida(s)` : 'Avisos'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifStatus === 'granted' ? (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Notificações ativas neste aparelho
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleTest} disabled={testing} onSelect={(e) => e.preventDefault()}>
              <Send className="size-4" /> {testing ? 'Enviando teste…' : 'Enviar notificação de teste'}
            </DropdownMenuItem>
          </>
        ) : notifStatus === 'denied' ? (
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Notificações bloqueadas no navegador
          </DropdownMenuLabel>
        ) : notifStatus !== 'unsupported' ? (
          <DropdownMenuItem onClick={enableNotifications}>
            <BellRing className="size-4" /> Ativar notificações
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={toggleSound}>
          {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          Som: {soundOn ? 'ligado' : 'desligado'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
