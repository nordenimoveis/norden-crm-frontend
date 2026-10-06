'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Ban,
  Building2,
  Contact,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  SlidersHorizontal,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NordenMark } from '@/components/norden-mark';
import { NotificationsBell } from '@/components/notifications-bell';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/session-provider';
import { useTasks } from '@/hooks/use-tasks';
import { useInboxCount } from '@/hooks/use-leads';
import { logout } from '@/lib/api/client';
import { isManager } from '@/lib/types';
import { cn, firstName, initials } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  managerOnly?: boolean;
  /** 'tasks' = tarefas pendentes; 'inbox' = leads de campanha que responderam. */
  badge?: 'tasks' | 'inbox';
}

const PRINCIPAL: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, managerOnly: true },
  { href: '/kanban', label: 'Funil de vendas', icon: KanbanSquare },
  { href: '/responderam', label: 'Responderam', icon: Inbox, managerOnly: true, badge: 'inbox' },
  { href: '/leads', label: 'Leads', icon: Contact },
  { href: '/tarefas', label: 'Tarefas', icon: ListChecks, badge: 'tasks' },
];

const GESTAO: NavItem[] = [
  { href: '/configuracoes/campanhas', label: 'Campanhas', icon: Megaphone, managerOnly: true },
  { href: '/configuracoes/funil', label: 'Etapas do funil', icon: SlidersHorizontal, managerOnly: true },
  { href: '/configuracoes/motivos', label: 'Motivos de perda', icon: Ban, managerOnly: true },
  { href: '/configuracoes/produtos', label: 'Empreendimentos', icon: Building2, managerOnly: true },
  { href: '/configuracoes/respostas', label: 'Respostas rápidas', icon: MessageSquareText, managerOnly: true },
  { href: '/configuracoes/importar', label: 'Importar base', icon: Upload, managerOnly: true },
  { href: '/configuracoes/usuarios', label: 'Usuários', icon: Users, managerOnly: true },
  { href: '/configuracoes/relatorio', label: 'Relatório', icon: BarChart3, managerOnly: true },
];

function useNavState() {
  const user = useSession();
  const manager = isManager(user.role);
  const { data: tasks = [] } = useTasks();
  const { data: inbox } = useInboxCount(manager);
  const visible = (items: NavItem[]) => items.filter((i) => !i.managerOnly || manager);
  const counts = { tasks: tasks.length, inbox: inbox?.count ?? 0 };
  return { user, manager, counts, principal: visible(PRINCIPAL), gestao: visible(GESTAO) };
}

function NavLink({ item, counts, onNavigate }: { item: NavItem; counts: { tasks: number; inbox: number }; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;
  const count = item.badge ? counts[item.badge] : 0;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-accent/[0.12] text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active && 'text-accent')} />
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <span className="grid min-w-[20px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

/** Conteúdo do menu (usado tanto no desktop fixo quanto na gaveta mobile). */
function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, manager, counts, principal, gestao } = useNavState();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href={manager ? '/dashboard' : '/kanban'} onClick={onNavigate} aria-label="Início">
          <NordenMark />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {principal.map((i) => (
            <NavLink key={i.href} item={i} counts={counts} onNavigate={onNavigate} />
          ))}
        </div>

        {gestao.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Gestão
            </p>
            {gestao.map((i) => (
              <NavLink key={i.href} item={i} counts={counts} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden>
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{firstName(user.name)}</p>
            <p className="text-xs leading-tight text-muted-foreground">{manager ? 'Gestor' : 'Corretor'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Sair" aria-label="Sair">
            <LogOut className="size-[18px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shell do painel: menu lateral fixo no desktop, gaveta no celular, e uma barra
 * superior enxuta (abrir menu no mobile + avisos). Todas as funções ficam no
 * menu — não há mais "esconder" telas dentro da engrenagem.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
        <div className="sticky top-0 h-dvh">
          <NavBody />
        </div>
      </aside>

      {/* Gaveta (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[82%] border-r border-border bg-background shadow-panel">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <NavBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Coluna de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              title="Menu"
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
            <span className="lg:hidden">
              <NordenMark />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
