import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { db } from "@db";
import { contentPlans, apiKeys, promptTemplates } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { generateContent, analyzeSEO } from "./services/anthropic";
import { spawn } from "child_process";
import multer from "multer";
import { Readable } from "stream";
import FormData from "form-data";
import fetch from "node-fetch";
import { processUnpublishedContent } from "./services/contentPublisher";
import { SelectContentPlan } from "@db/schema";

// Start the Flask PDF service
const flaskProcess = spawn('python3', ['server/pdf_service.py']);
flaskProcess.stdout.on('data', (data) => {
  console.log(`PDF Service: ${data}`);
});
flaskProcess.stderr.on('data', (data) => {
  console.error(`PDF Service Error: ${data}`);
});

// Create multer instance for handling file uploads
const upload = multer();

async function migrateContentPlans() {
  try {
    // Get all content plans that don't have channels set
    const plans = await db.query.contentPlans.findMany({
      where: (contentPlans, { isNull }) => isNull(contentPlans.channels)
    });

    console.log(`[INFO] Found ${plans.length} content plans to migrate`);

    for (const plan of plans) {
      if (!plan.medium) {
        console.log(`[WARN] Skipping plan ${plan.id} - no medium defined`);
        continue;
      }

      // Convert old medium and channel format to new structure
      const channels = plan.medium.split(',').map(medium => ({
        medium: medium.trim(),
        channel: plan.channels?.[0]?.channel || 'default'
      }));

      // Update the plan with new channels structure
      await db.update(contentPlans)
        .set({
          channels,
          updatedAt: new Date()
        })
        .where(eq(contentPlans.id, plan.id));

      console.log(`[INFO] Migrated plan ${plan.id}`);
    }

    console.log('[INFO] Content plan migration completed');
  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Call migration on startup
  migrateContentPlans().catch(console.error);

  // API Keys routes
  app.get("/api/api-keys", async (req, res) => {
    try {
      const keys = await db.query.apiKeys.findMany({
        orderBy: desc(apiKeys.createdAt),
      });
      res.json(keys);
    } catch (error) {
      console.error("[ERROR] Failed to fetch API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", async (req, res) => {
    try {
      const key = await db.insert(apiKeys).values({
        ...req.body,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      res.json(key[0]);
    } catch (error) {
      console.error("[ERROR] Failed to create API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      const deleted = await db.delete(apiKeys)
        .where(eq(apiKeys.id, parseInt(req.params.id)))
        .returning();
      res.json(deleted[0]);
    } catch (error) {
      console.error("[ERROR] Failed to delete API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // Prompt Templates routes
  app.get("/api/prompt-templates", async (req, res) => {
    try {
      const templates = await db.query.promptTemplates.findMany({
        orderBy: desc(promptTemplates.createdAt),
      });
      res.json(templates);
    } catch (error) {
      console.error("[ERROR] Failed to fetch prompt templates:", error);
      res.status(500).json({ error: "Failed to fetch prompt templates" });
    }
  });

  app.post("/api/prompt-templates", async (req, res) => {
    try {
      const template = await db.insert(promptTemplates).values({
        ...req.body,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      res.json(template[0]);
    } catch (error) {
      console.error("[ERROR] Failed to create prompt template:", error);
      res.status(500).json({ error: "Failed to create prompt template" });
    }
  });

  app.delete("/api/prompt-templates/:id", async (req, res) => {
    try {
      const deleted = await db.delete(promptTemplates)
        .where(eq(promptTemplates.id, parseInt(req.params.id)))
        .returning();
      res.json(deleted[0]);
    } catch (error) {
      console.error("[ERROR] Failed to delete prompt template:", error);
      res.status(500).json({ error: "Failed to delete prompt template" });
    }
  });

  app.get("/api/content-plans", async (req, res) => {
    try {
      const plans = await db.query.contentPlans.findMany({
        orderBy: desc(contentPlans.targetPublishDate),
      });
      res.json(plans);
    } catch (error) {
      console.error("[ERROR] Failed to fetch content plans:", error);
      res.status(500).json({ error: "Failed to fetch content plans" });
    }
  });

  app.post("/api/content-plans", async (req, res) => {
    try {
      console.log("[DEBUG] Creating content plan with data:", req.body);

      // Format the data according to the schema
      const planData = {
        ...req.body,
        // Ensure dates are properly formatted
        targetPublishDate: new Date(req.body.targetPublishDate),
        actualPublishDate: null,
        // Initialize metadata
        metadata: {
          views: 0,
          likes: 0,
          comments: 0,
          seoScore: null
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("[DEBUG] Formatted plan data:", planData);
      const plan = await db.insert(contentPlans).values(planData).returning();
      console.log("[DEBUG] Created plan:", plan[0]);
      res.json(plan[0]);
    } catch (error) {
      console.error("[ERROR] Failed to create content plan:", error);
      res.status(500).json({ error: "Failed to create content plan" });
    }
  });

  app.patch("/api/content-plans/:id", async (req, res) => {
    try {
      console.log("[DEBUG] Updating content plan:", req.params.id, req.body);

      // Format the data according to the schema
      const updateData = {
        ...req.body,
        // Ensure dates are properly formatted
        targetPublishDate: new Date(req.body.targetPublishDate),
        // Handle medium field - ensure it's an array
        medium: Array.isArray(req.body.medium) ? req.body.medium : [req.body.medium],
        // Update the updatedAt timestamp
        updatedAt: new Date(),
      };

      console.log("[DEBUG] Formatted update data:", updateData);

      const updated = await db.update(contentPlans)
        .set(updateData)
        .where(eq(contentPlans.id, parseInt(req.params.id)))
        .returning();

      if (!updated.length) {
        return res.status(404).json({ error: "Content plan not found" });
      }

      console.log("[DEBUG] Updated plan:", updated[0]);
      res.json(updated[0]);
    } catch (error) {
      console.error("[ERROR] Failed to update content plan:", error);
      res.status(500).json({ error: "Failed to update content plan" });
    }
  });
  
  app.delete("/api/content-plans/:id", async (req, res) => {
    try {
      const deleted = await db.delete(contentPlans)
        .where(eq(contentPlans.id, parseInt(req.params.id)))
        .returning();
      res.json(deleted[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete content plan" });
    }
  });

  // Content Generation API
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { theme, description, prompt } = req.body;
      const content = await generateContent(theme, description, prompt);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // SEO Analysis API
  app.post("/api/analyze-seo", async (req, res) => {
    try {
      const { content } = req.body;
      const analysis = await analyzeSEO(content);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze SEO" });
    }
  });

  // Updated PDF analysis proxy route
  app.post("/api/analyze-pdf", upload.single('pdf'), async (req, res) => {
    try {
      console.log("[DEBUG] Starting PDF analysis request");

      if (!req.file) {
        console.log("[ERROR] No PDF file uploaded");
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      console.log(`[DEBUG] Processing file: ${req.file.originalname}`);

      // Create form data for the Flask service
      const formData = new FormData();

      // Convert buffer to stream
      const fileStream = Readable.from(req.file.buffer);

      formData.append('pdf', fileStream, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      console.log("[DEBUG] Making request to Flask service");

      // Forward the request to Flask service
      const response = await fetch('http://localhost:5001/api/analyze-pdf', {
        method: 'POST',
        // @ts-ignore - FormData type mismatch between node-fetch and form-data
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Flask service error: ${response.status}`, errorText);
        throw new Error(`Flask service returned ${response.status}`);
      }

      console.log("[DEBUG] Received response from Flask service");
      const data = await response.json();
      console.log("[DEBUG] Parsed response data:", JSON.stringify(data, null, 2));

      res.json(data);
    } catch (error: any) {
      console.error("PDF analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze PDF" });
    }
  });

    // Add new route to manually trigger content processing
    app.post("/api/process-content", async (req, res) => {
      try {
        await processUnpublishedContent();
        res.json({ message: "Content processing completed successfully" });
      } catch (error) {
        console.error("[ERROR] Failed to process content:", error);
        res.status(500).json({ error: "Failed to process content" });
      }
    });
  
    // Set up scheduled task to run every hour
    setInterval(async () => {
      try {
        console.log("[INFO] Starting scheduled content processing...");
        await processUnpublishedContent();
        console.log("[INFO] Scheduled content processing completed");
      } catch (error) {
        console.error("[ERROR] Scheduled content processing failed:", error);
      }
    }, 60 * 60 * 1000); // Run every hour
  
  return httpServer;
}