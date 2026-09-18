import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import { fraunces, inter } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lunora Living — Make Your Space Feel Like You.",
  description:
    "Curated, affordable home décor bundles for young women in Pakistan. Cash on Delivery available nationwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
