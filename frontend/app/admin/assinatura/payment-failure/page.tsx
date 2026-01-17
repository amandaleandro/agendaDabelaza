"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailurePage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/admin/assinatura?payment=failure");
    }, 1000);
    return () => clearTimeout(timer);
  }, [router, search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <p>Pagamento não aprovado. Redirecionando...</p>
      </div>
    </div>
  );
}
