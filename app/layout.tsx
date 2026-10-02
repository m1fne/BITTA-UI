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
        {/* Глобальное удаление синего квадрата при тапе и добавление микро-анимации кнопкам */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                -webkit-tap-highlight-color: transparent !important;
                outline: none !important;
              }
              button, [role="button"], a {
                transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.12s ease !important;
                user-select: none;
              }
              button:active, [role="button"]:active, a:active {
                transform: scale(0.95) !important;
                opacity: 0.85 !important;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}