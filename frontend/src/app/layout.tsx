/**
 * Root Layout — OmniSentinel Frontend
 *
 * Wraps the entire app in ThirdwebProvider for wallet/chain context.
 * Sponsors: thirdweb SDK (provider wrapper)
 */
import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniSentinel — AI-Powered Cross-Chain Risk Intelligence",
  description:
    "AI-driven CRE workflow platform monitoring DeFi protocol health, prediction markets, and automated safeguards — powered by Chainlink CRE.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}
