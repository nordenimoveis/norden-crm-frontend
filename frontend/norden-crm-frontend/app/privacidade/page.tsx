import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Norden Imóveis',
  description: 'Como a Norden Imóveis coleta, usa e protege os dados dos clientes.',
};

const ATUALIZADO_EM = '25 de agosto de 2026';
const EMAIL_CONTATO = 'imoveisnorden@gmail.com';
const NOME_EMPRESA = 'Norden Imóveis';

export default function PoliticaPrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-neutral-800">
      <h1 className="font-serif text-3xl font-semibold text-neutral-900">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-neutral-500">Última atualização: {ATUALIZADO_EM}</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <p>
          Esta Política de Privacidade descreve como a <strong>{NOME_EMPRESA}</strong> (“nós”)
          coleta, utiliza, armazena e protege as informações das pessoas (“você”) que entram em
          contato conosco pelos nossos canais de atendimento — WhatsApp, Instagram Direct,
          Messenger e comentários em nossas publicações — bem como pelos nossos formulários e
          anúncios. Ao interagir conosco, você concorda com as práticas descritas aqui.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">1. Dados que coletamos</h2>
        <p>Podemos coletar, conforme a sua interação:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Nome, telefone, e-mail e nome de usuário/perfil em redes sociais;</li>
          <li>O conteúdo das mensagens e comentários que você nos envia;</li>
          <li>
            Informações sobre o seu interesse imobiliário (ex.: bairro, faixa de valor, finalidade)
            fornecidas voluntariamente por você;
          </li>
          <li>Dados técnicos básicos necessários ao funcionamento do atendimento.</li>
        </ul>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">2. Como usamos os dados</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Responder e dar continuidade ao seu atendimento;</li>
          <li>Apresentar imóveis e oportunidades compatíveis com o seu interesse;</li>
          <li>Enviar comunicações e campanhas relacionadas aos nossos serviços, quando cabível;</li>
          <li>Melhorar a qualidade do atendimento e organizar o relacionamento com você.</li>
        </ul>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">3. Plataformas da Meta e WhatsApp</h2>
        <p>
          Utilizamos as plataformas da Meta (WhatsApp Business, Instagram e Messenger) para nos
          comunicar com você. O tratamento dos dados nessas plataformas também está sujeito às
          políticas da própria Meta. Não vendemos os seus dados e não os utilizamos para
          finalidades incompatíveis com o atendimento imobiliário.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">4. Compartilhamento</h2>
        <p>
          Os seus dados podem ser compartilhados apenas com prestadores de serviço que viabilizam o
          nosso atendimento (por exemplo, provedores de hospedagem e de mensageria), sempre no
          limite necessário e com obrigações de confidencialidade, ou quando exigido por lei.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">5. Retenção</h2>
        <p>
          Mantemos os seus dados pelo tempo necessário às finalidades acima ou conforme exigido por
          obrigações legais. Você pode solicitar a exclusão a qualquer momento (ver seção 7).
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">6. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais razoáveis para proteger as suas informações
          contra acesso não autorizado, perda ou uso indevido.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">7. Seus direitos (LGPD)</h2>
        <p>
          Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar o
          acesso, a correção, a portabilidade ou a exclusão dos seus dados, bem como retirar o
          consentimento. Para exercer esses direitos, entre em contato pelo e-mail abaixo.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">8. Alterações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. A versão vigente estará sempre
          disponível nesta página, com a data da última atualização no topo.
        </p>

        <h2 className="pt-4 font-serif text-xl font-semibold text-neutral-900">9. Contato</h2>
        <p>
          Em caso de dúvidas ou solicitações relacionadas aos seus dados, fale conosco:{' '}
          <a href={`mailto:${EMAIL_CONTATO}`} className="text-amber-700 underline">
            {EMAIL_CONTATO}
          </a>
          .
        </p>

        <p className="pt-6 text-sm text-neutral-500">© {NOME_EMPRESA}. Todos os direitos reservados.</p>
      </section>
    </main>
  );
}
