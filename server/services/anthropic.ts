import Anthropic from '@anthropic-ai/sdk';
import { db } from "@db";
import { apiKeys, promptTemplates } from "@db/schema";
import { eq } from "drizzle-orm";

let anthropicClient: Anthropic | null = null;

async function getActiveAnthropicKey() {
  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.provider, 'Anthropic'),
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
  });

  if (!key) {
    throw new Error('No active Anthropic API key found');
  }

  return key.keyValue;
}

async function getPromptTemplate(name: string) {
  const template = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.name, name),
  });

  if (!template) {
    throw new Error(`Prompt template ${name} not found`);
  }

  return template.prompt;
}

export async function generateContent(theme: string, description: string, prompt?: string): Promise<string> {
  try {
    // Get the latest Anthropic key from the database
    const apiKey = await getActiveAnthropicKey();
    
    // Initialize or update the client if the key changes
    if (!anthropicClient || anthropicClient.apiKey !== apiKey) {
      anthropicClient = new Anthropic({ apiKey });
    }

    // If no custom prompt is provided, use the system default from the database
    const systemPrompt = prompt || await getPromptTemplate('default_content_generator');
    
    const userPrompt = `Create content for: ${description}`;

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (!('text' in content)) {
      throw new Error('Unexpected response format from Claude');
    }
    return content.text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error('Failed to generate content: Unknown error');
  }
}

export async function analyzeSEO(content: string): Promise<{
  score: number;
  suggestions: string[];
}> {
  try {
    // Get the latest Anthropic key from the database
    const apiKey = await getActiveAnthropicKey();
    
    // Initialize or update the client if the key changes
    if (!anthropicClient || anthropicClient.apiKey !== apiKey) {
      anthropicClient = new Anthropic({ apiKey });
    }

    // Get the SEO analysis prompt template from the database
    const systemPrompt = await getPromptTemplate('seo_analyzer');

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    });

    const contentBlock = response.content[0];
    if (!('text' in contentBlock)) {
      throw new Error('Unexpected response format from Claude');
    }

    const result = JSON.parse(contentBlock.text);
    return {
      score: Math.min(100, Math.max(0, result.score)),
      suggestions: result.suggestions,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze SEO: ${error.message}`);
    }
    throw new Error('Failed to analyze SEO: Unknown error');
  }
}
