'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

interface GoogleIdentityButtonProps {
  text: 'signin_with' | 'signup_with' | 'continue_with';
  onCredential: (credential: string) => Promise<void> | void;
  onError?: (message: string) => void;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleIdentityButton({
  text,
  onCredential,
  onError,
}: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !window.google || !containerRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        if (!credential) {
          onError?.('Nao foi possivel autenticar com o Google.');
          return;
        }

        try {
          await callbackRef.current(credential);
        } catch {
          onError?.('Nao foi possivel autenticar com o Google.');
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    containerRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: 360,
      logo_alignment: 'left',
    });
  }, [onError, scriptReady, text]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-500"
      >
        Google indisponivel
      </button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="flex min-h-10 w-full justify-center" />
    </>
  );
}
