'use client';

import Link from 'next/link';
import { Bell, BellRing, LayoutGrid, LogOut, Settings, Volume2, VolumeX } from 'lucide-react';
import { NordenMark } from '@/components/norden-mark';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/components/session-provider';
import { useUnread } from '@/components/realtime-provider';
import { logout } from '@/lib/api/client';
import { initials, firstName } from '@/lib/utils';
import { isManager } from '@/lib/types';

/** Sino de avisos: contador de não lidas + controles de notificação e som. */
function NotificationsBell() {
  const { totalUnread, notifStatus, enableNotifications, soundOn, toggleSound } = useUnread();
  const has = totalUnread > 0;
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
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Notificações do navegador ativas
          </DropdownMenuLabel>
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

/** Barra superior do painel: marca, identidade do usuário e sair. */
export function AppTopbar() {
  const user = useSession();
  const manager = isManager(user.role);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/kanban" aria-label="Ir para o quadro">
          <NordenMark />
        </Link>

        <div className="flex items-center gap-3">
          <NotificationsBell />
          {manager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Configurações" aria-label="Configurações">
                  <Settings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes/funil">
                    <LayoutGrid className="size-4" /> Funil de vendas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes/motivos">
                    <Settings className="size-4" /> Motivos de perda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/kanban">
                    <LayoutGrid className="size-4" /> Voltar ao quadro
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{firstName(user.name)}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {manager ? 'Gestor' : 'Corretor'}
            </p>
          </div>
          <div
            className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
            aria-hidden
          >
            {initials(user.name)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            title="Sair"
            aria-label="Sair"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
