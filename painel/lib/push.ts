'use client';

import { apiFetch } from './api/client';

/**
 * Web Push no navegador: registra o Service Worker, pede permissão e inscreve o
 * dispositivo na API. Retorna o resultado para a UI dar o retorno certo.
 *
 * O fluxo todo depende de HTTPS (ou localhost) e de o navegador suportar Push —
 * no iOS, só funciona com o CRM "instalado" na tela inicial (standalone).
 */

export type PushResult =
  | 'ok'
  | 'unsupported'
  | 'denied'
  | 'disabled' // servidor sem chaves VAPID
  | 'error';

/** Suporte a notificações push neste navegador. */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** No iOS o push só existe quando o app está "instalado" (standalone). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Converte a chave pública VAPID (base64url) para o formato que o navegador exige. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

/**
 * Registra o SW, garante a permissão e inscreve o dispositivo para push.
 * Idempotente: se já houver inscrição, apenas a reenvia para a API.
 */
export async function enablePush(): Promise<PushResult> {
  if (!pushSupported()) return 'unsupported';

  try {
    const { enabled, key } = await apiFetch<{ enabled: boolean; key: string | null }>('push/public-key');
    if (!enabled || !key) return 'disabled';

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const reg = await registerServiceWorker();
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const json = sub.toJSON();
    await apiFetch('push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Cancela a inscrição deste dispositivo (parar de receber push aqui). */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await apiFetch('push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } catch {
    /* ignora */
  }
}

/** Envia uma notificação de teste para os dispositivos do usuário. */
export async function sendPushTest(): Promise<{ delivered: number }> {
  return apiFetch<{ delivered: number }>('push/test', { method: 'POST' });
}
