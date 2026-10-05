import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "./providers/authProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const title = "AIDraw — Real-time collaborative whiteboard";
const description =
  "Sketch together in shared rooms: strokes sync live over WebSockets, rooms are shared by ID, and chat sits next to the canvas.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "AIDraw",
  openGraph: {
    type: "website",
    siteName: "AIDraw",
    title,
    description,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const setting = localStorage.getItem('theme') || 'dark';
                if (setting === 'dark' || (setting === 'system' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
