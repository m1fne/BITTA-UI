import Script from "next/script";

export const metadata = {
  title: "BittaHub",
  description: "B2B Game Top-Up System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        {/* Подключаем официальный скрипт Telegram WebApp ДО загрузки приложения */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}