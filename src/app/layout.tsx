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
          <div className="relative z-20 flex min-h-5 w-full items-center justify-center bg-amber-300/5 px-2 text-center text-[10px] leading-tight text-amber-100/70">
            Демо: только вымышленные данные, без личных сведений.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

