import { google } from 'googleapis';
import { db } from "@db";
import { apiKeys } from "@db/schema";
import { eq } from "drizzle-orm";

interface YoutubePublishParams {
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  channel: string;
}

async function getYoutubeCredentials() {
  const credentials = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.provider, 'Youtube_OAuth'),
  });

  if (!credentials) {
    throw new Error('YouTube credentials not found');
  }

  return JSON.parse(credentials.keyValue);
}

export async function publishToYoutube({ 
  videoUrl, 
  title, 
  description, 
  tags,
  channel 
}: YoutubePublishParams): Promise<string> {
  try {
    const credentials = await getYoutubeCredentials();

    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );

    oauth2Client.setCredentials(credentials.tokens);

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Download video from URL
    const videoBuffer = await fetch(videoUrl).then(res => res.arrayBuffer());

    // Upload to YouTube
    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '22' // People & Blogs category
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: Buffer.from(videoBuffer)
      }
    });

    return uploadResponse.data.id || ''; // Return the YouTube video ID
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to publish to YouTube: ${error.message}`);
    }
    throw new Error('Failed to publish to YouTube: Unknown error');
  }
}