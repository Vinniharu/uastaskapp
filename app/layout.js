import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthInitializer } from "@/components/AuthInitializer";
import { NavigationEventsWrapper } from "@/components/navigation-events-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UAS Task Management System",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/logo-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mainlogo.jpg" />
        <link rel="shortcut icon" href="/mainlogo.jpg" />
        <link rel="apple-touch-icon" href="/mainlogo.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AuthInitializer />
          <NavigationEventsWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
