import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "СИНО — слушаем и не осуждаем",
  description: "Бесплатный сервис бережной эмоциональной поддержки с ИИ и живыми специалистами.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased min-h-screen text-slate-100 selection:bg-blue-500/30 selection:text-blue-100">
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="fixed bottom-3 left-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 rounded-xl border border-amber-300/30 bg-slate-950/95 px-4 py-2 text-center text-xs text-amber-100 shadow-2xl backdrop-blur">
            ДЕМО-ВЕРСИЯ: используйте только вымышленные аккаунты и сообщения. Не вводите настоящие личные сведения.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

