import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "9057gu4d",
  dataset: "production",
  apiVersion: "2025-07-09",
  useCdn: false,
});

// Helper function to create a write client with token
// This should be called per-request in API routes to ensure env vars are loaded
export const createWriteClient = () => {
  const token = process.env.SANITY_WRITE_TOKEN;
  
  if (!token) {
    throw new Error(
      "SANITY_WRITE_TOKEN environment variable is not set. Please add it to your .env.local file."
    );
  }

  return createClient({
    projectId: "9057gu4d",
    dataset: "production",
    apiVersion: "2025-07-09",
    useCdn: false,
    token,
  });
};
