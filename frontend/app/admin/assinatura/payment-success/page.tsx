"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const doProcess = async () => {
      try {
        const collectionId = search.get("collection_id") || "SIMULATED";
        const externalRef = search.get("external_reference") || search.get("subscription_id");
        if (externalRef) {
          // Notifica backend para concluir a assinatura (aprovar)
          await fetch(`/api/subscriptions/payment/success?collection_id=${encodeURIComponent(collectionId)}&external_reference=${encodeURIComponent(externalRef)}`);
        }
      } catch (e) {
        // segue mesmo se falhar, a página principal tenta recarregar dados
      } finally {
        router.replace("/admin/assinatura?payment=success");
      }
    };
    doProcess();
  }, [router, search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto mb-4" />
        <p>Processando pagamento...</p>
      </div>
    </div>
  );
}
