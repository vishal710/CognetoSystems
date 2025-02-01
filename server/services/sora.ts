import OpenAI from 'openai';
import { db } from "@db";
import { apiKeys } from "@db/schema";
import { eq } from "drizzle-orm";

let openaiClient: OpenAI | null = null;

async function getActiveOpenAIKey() {
  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.provider, 'OpenAI'),
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
  });

  if (!key) {
    throw new Error('No active OpenAI API key found');
  }

  return key.keyValue;
}

export async function generateVideo(prompt: string): Promise<string> {
  try {
    // Get the latest OpenAI key from the database
    const apiKey = await getActiveOpenAIKey();

    // Initialize or update the client if the key changes
    if (!openaiClient || openaiClient.apiKey !== apiKey) {
      openaiClient = new OpenAI({ apiKey });
    }

    // Note: This is a placeholder. Replace with actual Sora API call when available
    // For now, we'll simulate a successful video generation
    const videoUrl = "https://example.com/generated-video.mp4";
    console.log("[INFO] Video generation requested:", { prompt });
    console.log("[INFO] Generated video URL:", videoUrl);

    return videoUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate video: ${error.message}`);
    }
    throw new Error('Failed to generate video: Unknown error');
  }
}