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
        {children}
      </body>
    </html>
  );
}