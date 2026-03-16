import { describe, it, expect } from "vitest";
import * as SettingsService from "../../../src/services/settings.service";
import {
  createTestUser,
  createTestSettings,
} from "../../helpers/test-factories";
import { prisma } from "../../../src/config/database";

describe("SettingsService", () => {
  describe("getUserSettings", () => {
    it("should return existing settings for user", async () => {
      const user = await createTestUser();
      const settings = await createTestSettings(user.id, {
        theme: "DARK",
        language: "ES",
      });

      const found = await SettingsService.getUserSettings(user.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(settings.id);
      expect(found.userId).toBe(user.id);
      expect(found.theme).toBe("DARK");
      expect(found.language).toBe("ES");
    });

    it("should create default settings if they don't exist", async () => {
      const user = await createTestUser();

      const settings = await SettingsService.getUserSettings(user.id);

      expect(settings).toBeDefined();
      expect(settings.userId).toBe(user.id);
      expect(settings.theme).toBe("LIGHT");
      expect(settings.dateFormat).toBe("MM_DD_YYYY");
      expect(settings.language).toBe("EN");
      expect(settings.defaultPriority).toBe("MEDIUM");
      expect(settings.defaultStatus).toBe("TODO");
    });

    it("should persist created default settings", async () => {
      const user = await createTestUser();

      // First call creates settings
      const settings1 = await SettingsService.getUserSettings(user.id);

      // Second call should return the same settings (not create new ones)
      const settings2 = await SettingsService.getUserSettings(user.id);

      expect(settings1.id).toBe(settings2.id);
      expect(settings1.userId).toBe(settings2.userId);
    });

    it("should return settings with all default values", async () => {
      const user = await createTestUser();

      const settings = await SettingsService.getUserSettings(user.id);

      expect(settings).toHaveProperty("id");
      expect(settings).toHaveProperty("userId");
      expect(settings).toHaveProperty("theme");
      expect(settings).toHaveProperty("dateFormat");
      expect(settings).toHaveProperty("language");
      expect(settings).toHaveProperty("defaultPriority");
      expect(settings).toHaveProperty("defaultStatus");
    });

    it("should throw error for non-existent user", async () => {
      await expect(SettingsService.getUserSettings(99999)).rejects.toThrow(
        "User not found",
      );
    });

    it("should create settings only once", async () => {
      const user = await createTestUser();

      await SettingsService.getUserSettings(user.id);
      await SettingsService.getUserSettings(user.id);
      await SettingsService.getUserSettings(user.id);

      const allSettings = await prisma.userSettings.findMany({
        where: { userId: user.id },
      });

      expect(allSettings).toHaveLength(1);
    });
  });

  describe("updateUserSettings", () => {
    it("should update theme", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { theme: "LIGHT" });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
      });

      expect(updated.theme).toBe("DARK");
    });

    it("should update dateFormat", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { dateFormat: "MM_DD_YYYY" });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        dateFormat: "DD_MM_YYYY",
      });

      expect(updated.dateFormat).toBe("DD_MM_YYYY");
    });

    it("should update language", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { language: "EN" });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        language: "ES",
      });

      expect(updated.language).toBe("ES");
    });

    it("should update defaultPriority", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { defaultPriority: "LOW" });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultPriority: "HIGH",
      });

      expect(updated.defaultPriority).toBe("HIGH");
    });

    it("should update defaultStatus", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { defaultStatus: "TODO" });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultStatus: "IN_PROGRESS",
      });

      expect(updated.defaultStatus).toBe("IN_PROGRESS");
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
        language: "ES",
        defaultPriority: "HIGH",
      });

      expect(updated.theme).toBe("DARK");
      expect(updated.language).toBe("ES");
      expect(updated.defaultPriority).toBe("HIGH");
    });

    it("should only update provided fields", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, {
        theme: "LIGHT",
        language: "EN",
        defaultPriority: "MEDIUM",
      });

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK", // Only update theme
      });

      expect(updated.theme).toBe("DARK"); // Updated
      expect(updated.language).toBe("EN"); // Unchanged
      expect(updated.defaultPriority).toBe("MEDIUM"); // Unchanged
    });

    it("should create settings with provided values if they don't exist", async () => {
      const user = await createTestUser();

      const settings = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
        language: "ES",
      });

      expect(settings.theme).toBe("DARK");
      expect(settings.language).toBe("ES");
      expect(settings.dateFormat).toBe("MM_DD_YYYY"); // Default
      expect(settings.defaultPriority).toBe("MEDIUM"); // Default
      expect(settings.defaultStatus).toBe("TODO"); // Default
    });

    it("should create settings with defaults if no values provided", async () => {
      const user = await createTestUser();

      const settings = await SettingsService.updateUserSettings({
        userId: user.id,
      });

      expect(settings.theme).toBe("LIGHT");
      expect(settings.dateFormat).toBe("MM_DD_YYYY");
      expect(settings.language).toBe("EN");
      expect(settings.defaultPriority).toBe("MEDIUM");
      expect(settings.defaultStatus).toBe("TODO");
    });

    it("should persist updates across calls", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, { theme: "LIGHT" });

      await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
      });

      const found = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });

      expect(found?.theme).toBe("DARK");
    });

    it("should handle all theme values", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const light = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "LIGHT",
      });
      expect(light.theme).toBe("LIGHT");

      const dark = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
      });
      expect(dark.theme).toBe("DARK");
    });

    it("should handle all dateFormat values", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const format1 = await SettingsService.updateUserSettings({
        userId: user.id,
        dateFormat: "MM_DD_YYYY",
      });
      expect(format1.dateFormat).toBe("MM_DD_YYYY");

      const format2 = await SettingsService.updateUserSettings({
        userId: user.id,
        dateFormat: "DD_MM_YYYY",
      });
      expect(format2.dateFormat).toBe("DD_MM_YYYY");

      const format3 = await SettingsService.updateUserSettings({
        userId: user.id,
        dateFormat: "YYYY_MM_DD",
      });
      expect(format3.dateFormat).toBe("YYYY_MM_DD");
    });

    it("should handle all language values", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const en = await SettingsService.updateUserSettings({
        userId: user.id,
        language: "EN",
      });
      expect(en.language).toBe("EN");

      const es = await SettingsService.updateUserSettings({
        userId: user.id,
        language: "ES",
      });
      expect(es.language).toBe("ES");
    });

    it("should handle all priority values", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const low = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultPriority: "LOW",
      });
      expect(low.defaultPriority).toBe("LOW");

      const medium = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultPriority: "MEDIUM",
      });
      expect(medium.defaultPriority).toBe("MEDIUM");

      const high = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultPriority: "HIGH",
      });
      expect(high.defaultPriority).toBe("HIGH");
    });

    it("should handle all status values", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const todo = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultStatus: "TODO",
      });
      expect(todo.defaultStatus).toBe("TODO");

      const inProgress = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultStatus: "IN_PROGRESS",
      });
      expect(inProgress.defaultStatus).toBe("IN_PROGRESS");

      const done = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultStatus: "DONE",
      });
      expect(done.defaultStatus).toBe("DONE");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        SettingsService.updateUserSettings({
          userId: 99999,
          theme: "DARK",
        }),
      ).rejects.toThrow("User not found");
    });

    it("should return updated settings with correct userId", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id);

      const updated = await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
      });

      expect(updated.userId).toBe(user.id);
    });

    it("should handle sequential updates correctly", async () => {
      const user = await createTestUser();
      await createTestSettings(user.id, {
        theme: "LIGHT",
        language: "EN",
        defaultPriority: "LOW",
      });

      // First update
      await SettingsService.updateUserSettings({
        userId: user.id,
        theme: "DARK",
      });

      // Second update
      await SettingsService.updateUserSettings({
        userId: user.id,
        language: "ES",
      });

      // Third update
      const final = await SettingsService.updateUserSettings({
        userId: user.id,
        defaultPriority: "HIGH",
      });

      expect(final.theme).toBe("DARK"); // From first update
      expect(final.language).toBe("ES"); // From second update
      expect(final.defaultPriority).toBe("HIGH"); // From third update
    });
  });
});
