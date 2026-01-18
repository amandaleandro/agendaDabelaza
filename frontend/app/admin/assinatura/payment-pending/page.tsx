"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentPendingContent() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/assinatura?payment=pending");
    }, 1000);
    return () => clearTimeout(timer);
  }, [router, search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <p>Pagamento pendente. Redirecionando...</p>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}
