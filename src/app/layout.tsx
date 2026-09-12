import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "What People Think",
  description:
    "See what people think about a subject: one clear statement drawn from a sample of online discussion.",
  /* Private until the version-one flow has been tested. */
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#367e86",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ground" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
