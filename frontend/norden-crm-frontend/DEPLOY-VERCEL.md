# Deploy do front-end na Vercel

O projeto Next.js fica na subpasta `frontend/norden-crm-frontend` deste
repositório. Por isso o passo do **Root Directory** é essencial.

## Passos

1. Vercel → **Add New → Project** → selecione o repositório `norden-crm-frontend`.
2. Em **Root Directory**, clique em *Edit* e escolha **`frontend/norden-crm-frontend`**.
3. **Framework Preset:** Next.js (detectado automaticamente; o `vercel.json` já
   confirma isso e adiciona cabeçalhos de segurança).
4. **Environment Variables** (aba Environment):
   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | URL pública da API no Render (ex.: `https://crm-api.onrender.com`) |
   | `NEXT_PUBLIC_PUSHER_KEY` | mesma chave pública do Pusher usada no backend |
   | `NEXT_PUBLIC_PUSHER_CLUSTER` | ex.: `us2` |
5. **Deploy**.

## Depois do deploy
- Copie a URL final da Vercel (ex.: `https://crm.suaempresa.com`) e coloque-a na
  variável **`FRONTEND_URL`** do backend (Render) — isso libera o CORS em produção.
- As duas variáveis `NEXT_PUBLIC_*` são lidas **no build**: se você mudar alguma,
  faça um **Redeploy** na Vercel para valer.
