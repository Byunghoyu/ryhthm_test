import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://byunghoyu.github.io/ryhthm_test/'),
  title: "쉐이크를 흔들어주세요! | 수염난 카피바라",
  description: "카피바라는 단백질이 필요해! - 음악에 맞춰 쉐이크를 흔들어주세요!",
  openGraph: {
    title: "쉐이크를 흔들어주세요!",
    description: "카피바라는 단백질이 필요해!",
    url: 'https://byunghoyu.github.io/ryhthm_test/',
    siteName: '수염난 카피바라 리듬게임',
    images: ["/assets/character_idle.png"],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
