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
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
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
      <body className="bg-[#090d16] text-white antialiased">{children}</body>
    </html>
  );
}