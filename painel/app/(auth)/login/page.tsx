'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NordenMark } from '@/components/norden-mark';
import { login } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Sessão criada no cookie httpOnly; segue para o Kanban.
      router.replace('/kanban');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar');
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Lado da marca — some no celular */}
      <section className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 opacity-[0.07] [background:radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <NordenMark className="[&_span]:text-primary-foreground [&_.bg-accent]:bg-accent" />
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-medium leading-tight">
              Atendimento à altura de cada cliente.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Gestão de leads, cadência e conversas em um só lugar — discreto,
              organizado e no seu ritmo.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/50">
            Norden Imóveis · Jurerê Internacional, Florianópolis
          </p>
        </div>
      </section>

      {/* Lado do formulário */}
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <NordenMark />
          </div>

          <h2 className="font-display text-2xl font-medium tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse o painel com seu e-mail Norden.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@nordenimoveis.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Sessão protegida · expira em 12 horas
          </p>
        </div>
      </section>
    </main>
  );
}
