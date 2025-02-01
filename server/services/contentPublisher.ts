import { db } from "@db";
import { contentPlans } from "@db/schema";
import { eq, lte } from "drizzle-orm";
import { generateContent } from "./anthropic";
import { generateImage } from "./dalle";
import { generateVideo } from "./sora";
import { publishToInstagram } from "./instagram";
import { publishToYoutube } from "./youtube";

interface GeneratedContent {
  caption: string;
  tags: string[];
  title: string;
  imagePrompt?: string;
  videoPrompt?: string;
}

export async function processUnpublishedContent() {
  try {
    // Get all unpublished content plans where target date <= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unpublishedPlans = await db.query.contentPlans.findMany({
      where: (contentPlans, { and }) => and(
        eq(contentPlans.status, "pending"),
        lte(contentPlans.targetPublishDate, today)
      ),
    });

    console.log(`[INFO] Found ${unpublishedPlans.length} unpublished content plans to process`);

    for (const plan of unpublishedPlans) {
      try {
        console.log(`[INFO] Processing content plan ${plan.id}`);

        // Step 1: Generate content details using Claude
        const prompt = `Create content for ${plan.medium} about: ${plan.description}
        Generate a structured response with:
        1. A catchy caption
        2. Relevant hashtags
        3. An engaging title
        4. Detailed prompts for generating both image and video content

        Format response as JSON with fields:
        {
          "caption": "string",
          "tags": ["string"],
          "title": "string",
          "imagePrompt": "string",
          "videoPrompt": "string"
        }`;

        const contentDetails = await generateContent(plan.theme, plan.description, prompt);
        const parsedContent: GeneratedContent = JSON.parse(contentDetails);

        // Update plan with generated content details
        await db.update(contentPlans)
          .set({
            metadata: {
              ...plan.metadata,
              generatedContent: parsedContent
            },
            updatedAt: new Date()
          })
          .where(eq(contentPlans.id, plan.id));

        // Process each channel
        const channels = plan.channels || [];

        for (const channelInfo of channels) {
          if (channelInfo.medium === "instagram") {
            // Generate and publish image content for Instagram
            console.log(`[INFO] Generating image for Instagram channel: ${channelInfo.channel}`);
            const imageUrl = await generateImage(parsedContent.imagePrompt || "");

            await publishToInstagram({
              imageUrl,
              caption: parsedContent.caption,
              tags: parsedContent.tags,
              channel: channelInfo.channel
            });

            // Update plan with image URL and Instagram publishing status
            await db.update(contentPlans)
              .set({
                metadata: {
                  ...plan.metadata,
                  generatedContent: {
                    ...plan.metadata?.generatedContent,
                    imageUrl,
                    publishingStatus: {
                      ...plan.metadata?.generatedContent?.publishingStatus,
                      instagram: true
                    }
                  }
                },
                updatedAt: new Date()
              })
              .where(eq(contentPlans.id, plan.id));
          }

          if (channelInfo.medium === "youtube_shorts") {
            // Generate and publish video content for YouTube
            console.log(`[INFO] Generating video for YouTube channel: ${channelInfo.channel}`);
            const videoUrl = await generateVideo(parsedContent.videoPrompt || "");

            await publishToYoutube({
              videoUrl,
              title: parsedContent.title,
              description: parsedContent.caption,
              tags: parsedContent.tags,
              channel: channelInfo.channel
            });

            // Update plan with video URL and YouTube publishing status
            await db.update(contentPlans)
              .set({
                metadata: {
                  ...plan.metadata,
                  generatedContent: {
                    ...plan.metadata?.generatedContent,
                    videoUrl,
                    publishingStatus: {
                      ...plan.metadata?.generatedContent?.publishingStatus,
                      youtube: true
                    }
                  }
                },
                updatedAt: new Date()
              })
              .where(eq(contentPlans.id, plan.id));
          }
        }

        // Check if all channels are published
        const allPublished = channels.every(channel => {
          if (channel.medium === 'instagram') {
            return plan.metadata?.generatedContent?.publishingStatus?.instagram;
          }
          if (channel.medium === 'youtube_shorts') {
            return plan.metadata?.generatedContent?.publishingStatus?.youtube;
          }
          return false;
        });

        if (allPublished) {
          // Mark content plan as published
          await db.update(contentPlans)
            .set({
              status: "published",
              actualPublishDate: new Date(),
              updatedAt: new Date()
            })
            .where(eq(contentPlans.id, plan.id));

          console.log(`[INFO] Content plan ${plan.id} published successfully`);
        }

      } catch (error) {
        console.error(`[ERROR] Error processing content plan ${plan.id}:`, error);
        // Continue with next plan even if current one fails
      }
    }
  } catch (error) {
    console.error("[ERROR] Error in processUnpublishedContent:", error);
    throw error;
  }
}