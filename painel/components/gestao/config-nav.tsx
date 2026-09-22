'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/configuracoes/funil', label: 'Funil' },
  { href: '/configuracoes/motivos', label: 'Motivos de perda' },
  { href: '/configuracoes/campanhas', label: 'Campanhas' },
  { href: '/configuracoes/respostas', label: 'Respostas rápidas' },
  { href: '/configuracoes/importar', label: 'Importar base' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/relatorio', label: 'Relatório' },
];

export function ConfigNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
      {/* rola no celular quando não couber */}
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-accent text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
