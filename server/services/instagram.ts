import { IgApiClient } from 'instagram-private-api';
import { db } from "@db";
import { apiKeys } from "@db/schema";
import { eq } from "drizzle-orm";

interface InstagramPublishParams {
  imageUrl: string;
  caption: string;
  tags: string[];
  channel: string;
}

async function getInstagramCredentials() {
  const username = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.provider, 'Instagram_Username'),
  });
  
  const password = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.provider, 'Instagram_Password'),
  });

  if (!username || !password) {
    throw new Error('Instagram credentials not found');
  }

  return {
    username: username.keyValue,
    password: password.keyValue
  };
}

export async function publishToInstagram({ 
  imageUrl, 
  caption, 
  tags, 
  channel 
}: InstagramPublishParams): Promise<string> {
  try {
    const { username, password } = await getInstagramCredentials();
    
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    
    await ig.account.login(username, password);
    
    // Download the image from URL and convert to buffer
    const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
    
    // Format caption with hashtags
    const formattedCaption = `${caption}\n\n${tags.map(tag => `#${tag}`).join(' ')}`;
    
    // Publish to Instagram
    const publishResult = await ig.publish.photo({
      file: Buffer.from(imageBuffer),
      caption: formattedCaption
    });

    return publishResult.media.code; // Return the Instagram post code/ID
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to publish to Instagram: ${error.message}`);
    }
    throw new Error('Failed to publish to Instagram: Unknown error');
  }
}
