'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CampanhasList } from '@/components/campanhas/campanhas-list';
import { CampanhaComposer } from '@/components/campanhas/campanha-composer';
import { TemplatesList } from '@/components/campanhas/templates-list';
import { useAuthStore } from '@/store/auth-store';

/**
 * RBAC: gestor/admin apenas — mesma régua do backend (disparo em massa e
 * templates são superfícies sensíveis, não é algo que todo corretor deveria
 * poder criar sozinho).
 */
export default function CampanhasPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const router = useRouter();
  const [compondo, setCompondo] = useState(false);

  const temAcesso = usuario?.papel === 'gestor' || usuario?.papel === 'admin';

  useEffect(() => {
    if (usuario && !temAcesso) {
      router.replace('/kanban');
    }
  }, [usuario, temAcesso, router]);

  if (!usuario || !temAcesso) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <ShieldOff className="h-5 w-5" />
          Você não tem acesso a esta área.
        </div>
      </div>
    );
  }

  // Compositor ocupa a tela inteira (experiência "tudo em uma tela").
  if (compondo) {
    return (
      <div className="h-full">
        <CampanhaComposer onFechar={() => setCompondo(false)} />
      </div>
    );
  }

  return (
    <Tabs defaultValue="campanhas">
      <TabsList>
        <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="campanhas">
        <CampanhasList onNova={() => setCompondo(true)} />
      </TabsContent>

      <TabsContent value="templates">
        <TemplatesList />
      </TabsContent>
    </Tabs>
  );
}
