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

export async function generateImage(prompt: string): Promise<string> {
  try {
    // Get the latest OpenAI key from the database
    const apiKey = await getActiveOpenAIKey();
    
    // Initialize or update the client if the key changes
    if (!openaiClient || openaiClient.apiKey !== apiKey) {
      openaiClient = new OpenAI({ apiKey });
    }

    const response = await openaiClient.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    if (!response.data[0]?.url) {
      throw new Error('No image URL in DALL-E response');
    }

    return response.data[0].url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error('Failed to generate image: Unknown error');
  }
}
