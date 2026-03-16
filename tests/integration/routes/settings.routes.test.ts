import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";
import {
  createTestUser,
  generateAuthToken,
} from "../../helpers/test-helpers.js";
import { createTestSettings } from "../../helpers/test-factories.js";
import { prisma } from "../../../src/config/database.js";

describe("Settings Routes - Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("GET /api/settings", () => {
    it("should get user settings when they exist", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Create settings
      await createTestSettings(user.id, {
        theme: "DARK",
        dateFormat: "DD_MM_YYYY",
        language: "ES",
        defaultPriority: "HIGH",
        defaultStatus: "IN_PROGRESS",
      });

      const response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.settings.theme).toBe("DARK");
      expect(response.body.settings.dateFormat).toBe("DD_MM_YYYY");
      expect(response.body.settings.language).toBe("ES");
      expect(response.body.settings.defaultPriority).toBe("HIGH");
      expect(response.body.settings.defaultStatus).toBe("IN_PROGRESS");
      expect(response.body.settings.userId).toBe(user.id);
    });

    it("should create default settings if they don't exist", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.settings.theme).toBe("LIGHT");
      expect(response.body.settings.dateFormat).toBe("MM_DD_YYYY");
      expect(response.body.settings.language).toBe("EN");
      expect(response.body.settings.defaultPriority).toBe("MEDIUM");
      expect(response.body.settings.defaultStatus).toBe("TODO");
      expect(response.body.settings.userId).toBe(user.id);

      // Verify settings were created in database
      const settings = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });
      expect(settings).not.toBeNull();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/settings").expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/settings")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);

      expect(response.body.message).toBe("Invalid token");
    });

    it("should not expose other user's settings", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      // Create settings for user 2
      await createTestSettings(user2.id, { theme: "DARK" });

      // User 1 gets their own settings
      const response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // User 1 should get default settings (not user 2's DARK theme)
      expect(response.body.settings.userId).toBe(user1.id);
      expect(response.body.settings.theme).toBe("LIGHT"); // Default
    });
  });

  describe("PUT /api/settings", () => {
    it("should update theme setting", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        theme: "DARK",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Settings updated successfully");
      expect(response.body.settings.theme).toBe("DARK");
    });

    it("should update dateFormat setting", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        dateFormat: "YYYY_MM_DD",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.dateFormat).toBe("YYYY_MM_DD");
    });

    it("should update language setting", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        language: "ES",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.language).toBe("ES");
    });

    it("should update defaultPriority setting", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        defaultPriority: "HIGH",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.defaultPriority).toBe("HIGH");
    });

    it("should update defaultStatus setting", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        defaultStatus: "DONE",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.defaultStatus).toBe("DONE");
    });

    it("should update multiple settings at once", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id);

      const updateData = {
        theme: "DARK",
        dateFormat: "DD_MM_YYYY",
        language: "ES",
        defaultPriority: "LOW",
        defaultStatus: "IN_PROGRESS",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.theme).toBe("DARK");
      expect(response.body.settings.dateFormat).toBe("DD_MM_YYYY");
      expect(response.body.settings.language).toBe("ES");
      expect(response.body.settings.defaultPriority).toBe("LOW");
      expect(response.body.settings.defaultStatus).toBe("IN_PROGRESS");
    });

    it("should create settings if they don't exist", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Don't create settings first
      const updateData = {
        theme: "DARK",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.theme).toBe("DARK");
      // Other fields should have defaults
      expect(response.body.settings.dateFormat).toBe("MM_DD_YYYY");
      expect(response.body.settings.language).toBe("EN");
    });

    it("should preserve unmodified settings", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await createTestSettings(user.id, {
        theme: "DARK",
        dateFormat: "DD_MM_YYYY",
        language: "ES",
      });

      // Only update theme
      const updateData = {
        theme: "LIGHT",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.settings.theme).toBe("LIGHT");
      // Other settings should remain unchanged
      expect(response.body.settings.dateFormat).toBe("DD_MM_YYYY");
      expect(response.body.settings.language).toBe("ES");
    });

    it("should return 401 when not authenticated", async () => {
      const updateData = {
        theme: "DARK",
      };

      const response = await request(app)
        .put("/api/settings")
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for invalid theme value", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        theme: "INVALID_THEME",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid dateFormat value", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        dateFormat: "INVALID_FORMAT",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid language value", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        language: "FR",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid defaultPriority value", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        defaultPriority: "URGENT",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid defaultStatus value", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        defaultStatus: "PENDING",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Settings Isolation & User Context", () => {
    it("should not allow user to update another user's settings", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      // Create settings for user 2
      await createTestSettings(user2.id, { theme: "DARK" });

      // User 1 updates their settings
      const updateData = {
        theme: "LIGHT",
      };

      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token1}`)
        .send(updateData)
        .expect(200);

      // Verify user 2's settings remain unchanged
      const user2Settings = await prisma.userSettings.findUnique({
        where: { userId: user2.id },
      });
      expect(user2Settings?.theme).toBe("DARK");
    });

    it("should maintain settings uniqueness per user", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);
      const token2 = generateAuthToken(user2.id, user2.email);

      // Both users update their theme
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token1}`)
        .send({ theme: "DARK" })
        .expect(200);

      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token2}`)
        .send({ theme: "LIGHT" })
        .expect(200);

      // Verify each user has their own settings
      const user1Response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      const user2Response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token2}`)
        .expect(200);

      expect(user1Response.body.settings.theme).toBe("DARK");
      expect(user2Response.body.settings.theme).toBe("LIGHT");
    });

    it("should ensure userId is set correctly", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        theme: "DARK",
      };

      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      // Verify userId matches authenticated user
      expect(response.body.settings.userId).toBe(user.id);
    });
  });

  describe("Settings Default Values", () => {
    it("should use correct default values when creating settings", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.settings.theme).toBe("LIGHT");
      expect(response.body.settings.dateFormat).toBe("MM_DD_YYYY");
      expect(response.body.settings.language).toBe("EN");
      expect(response.body.settings.defaultPriority).toBe("MEDIUM");
      expect(response.body.settings.defaultStatus).toBe("TODO");
    });

    it("should allow all valid theme values", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Test LIGHT
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "LIGHT" })
        .expect(200);

      // Test DARK
      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ theme: "DARK" })
        .expect(200);

      expect(response.body.settings.theme).toBe("DARK");
    });

    it("should allow all valid dateFormat values", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Test MM_DD_YYYY
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ dateFormat: "MM_DD_YYYY" })
        .expect(200);

      // Test DD_MM_YYYY
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ dateFormat: "DD_MM_YYYY" })
        .expect(200);

      // Test YYYY_MM_DD
      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ dateFormat: "YYYY_MM_DD" })
        .expect(200);

      expect(response.body.settings.dateFormat).toBe("YYYY_MM_DD");
    });

    it("should allow all valid language values", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Test EN
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ language: "EN" })
        .expect(200);

      // Test ES
      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ language: "ES" })
        .expect(200);

      expect(response.body.settings.language).toBe("ES");
    });

    it("should allow all valid priority values", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Test LOW
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultPriority: "LOW" })
        .expect(200);

      // Test MEDIUM
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultPriority: "MEDIUM" })
        .expect(200);

      // Test HIGH
      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultPriority: "HIGH" })
        .expect(200);

      expect(response.body.settings.defaultPriority).toBe("HIGH");
    });

    it("should allow all valid status values", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Test TODO
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultStatus: "TODO" })
        .expect(200);

      // Test IN_PROGRESS
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultStatus: "IN_PROGRESS" })
        .expect(200);

      // Test DONE
      const response = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultStatus: "DONE" })
        .expect(200);

      expect(response.body.settings.defaultStatus).toBe("DONE");
    });
  });
});
