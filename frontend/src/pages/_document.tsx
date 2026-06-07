import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="uz">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="min-h-full flex flex-col antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
