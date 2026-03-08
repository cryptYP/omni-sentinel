/**
 * thirdweb Client Configuration
 *
 * Creates the thirdweb client instance using NEXT_PUBLIC_THIRDWEB_CLIENT_ID.
 * Used throughout the app for wallet connection and contract interactions.
 *
 * Sponsors: thirdweb SDK
 */
import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});
