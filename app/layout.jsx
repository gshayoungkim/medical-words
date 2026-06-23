import "./globals.css";

export const metadata = {
  title: {
    default: "Medical Word Lab",
    template: "%s | Medical Word Lab"
  },
  description: "접두사, 어근, 접미사를 레고처럼 조립하며 배우는 의학용어 학습 웹앱"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
