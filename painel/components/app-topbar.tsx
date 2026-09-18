'use client';

import Link from 'next/link';
import { LayoutGrid, LogOut, Settings } from 'lucide-react';
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
import { logout } from '@/lib/api/client';
import { initials, firstName } from '@/lib/utils';
import { isManager } from '@/lib/types';

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
