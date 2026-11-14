import '../src/index.css';
import { SITE_ORIGIN } from '../src/lib/eventLinks';
import ClientLayout from './ClientLayout';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || SITE_ORIGIN),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>More Community | Find Your People, Connect in Real Life</title>
        <meta name="description" content="More Community empowers local leaders and brings people together in the real world. Discover clubs, join in-person meetups, and experience the joy of shared passions. 100% free forever for community champions." />
        <meta property="og:site_name" content="More Community" />
        <meta property="og:title" content="More Community | Find Your People, Connect in Real Life" />
        <meta property="og:description" content="Discover local groups, join in-person meetups, and build genuine community where you live. Free tools for community leaders." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.morecommunity.app/images/og-share.png" />
        <meta property="og:image:secure_url" content="https://www.morecommunity.app/images/og-share.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="More Community Logo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="More Community | Find Your People, Connect in Real Life" />
        <meta name="twitter:description" content="Discover local groups, join in-person meetups, and build genuine community where you live. Free tools for community leaders." />
        <meta name="twitter:image" content="https://www.morecommunity.app/images/og-share.png" />
        <meta name="twitter:image:alt" content="More Community Logo" />
        <meta name="theme-color" content="#020617" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="More" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
