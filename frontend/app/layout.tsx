import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppointPro Beauty - Sistema de Agendamento",
  description: "Plataforma de agendamento de serviços profissionais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* MUDANÇAS FEITAS:
        1. bg-gray-50 -> bg-[#0f172a]: Define a cor base escura para evitar "piscar" branco ao carregar.
        2. Removido Header e Footer antigos: O novo design da Home já tem eles integrados.
        3. Removido max-w-7xl e paddings: Para permitir o design "Full Width" (tela cheia).
      */}
      <body className="bg-[#0f172a] text-white antialiased selection:bg-indigo-500 selection:text-white">
        <main className="min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  );
}