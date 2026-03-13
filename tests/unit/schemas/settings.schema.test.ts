import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "../../../src/schemas/settings.schema";

describe("Settings Schema", () => {
  describe("updateSettingsSchema", () => {
    it("should accept partial updates with single field", () => {
      const updates = [
        { theme: "LIGHT" as const },
        { theme: "DARK" as const },
        { dateFormat: "MM_DD_YYYY" as const },
        { dateFormat: "DD_MM_YYYY" as const },
        { dateFormat: "YYYY_MM_DD" as const },
        { language: "EN" as const },
        { language: "ES" as const },
        { defaultPriority: "LOW" as const },
        { defaultPriority: "MEDIUM" as const },
        { defaultPriority: "HIGH" as const },
        { defaultStatus: "TODO" as const },
        { defaultStatus: "IN_PROGRESS" as const },
        { defaultStatus: "DONE" as const },
      ];

      updates.forEach((update) => {
        const result = updateSettingsSchema.parse(update);
        expect(result).toEqual(update);
      });
    });

    it("should accept multiple fields at once", () => {
      const update = {
        theme: "DARK" as const,
        language: "ES" as const,
        defaultPriority: "HIGH" as const,
      };

      const result = updateSettingsSchema.parse(update);

      expect(result).toEqual(update);
    });

    it("should accept all fields together", () => {
      const update = {
        theme: "LIGHT" as const,
        dateFormat: "DD_MM_YYYY" as const,
        language: "EN" as const,
        defaultPriority: "MEDIUM" as const,
        defaultStatus: "IN_PROGRESS" as const,
      };

      const result = updateSettingsSchema.parse(update);

      expect(result).toEqual(update);
    });

    it("should reject empty update object", () => {
      expect(() => updateSettingsSchema.parse({})).toThrow();
    });

    it("should reject invalid theme value", () => {
      expect(() =>
        updateSettingsSchema.parse({ theme: "AUTO" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ theme: "light" as any }),
      ).toThrow();
    });

    it("should reject invalid dateFormat value", () => {
      expect(() =>
        updateSettingsSchema.parse({ dateFormat: "MM/DD/YYYY" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ dateFormat: "INVALID" as any }),
      ).toThrow();
    });

    it("should reject invalid language value", () => {
      expect(() =>
        updateSettingsSchema.parse({ language: "FR" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ language: "en" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ language: "English" as any }),
      ).toThrow();
    });

    it("should reject invalid defaultPriority value", () => {
      expect(() =>
        updateSettingsSchema.parse({ defaultPriority: "URGENT" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ defaultPriority: "low" as any }),
      ).toThrow();
    });

    it("should reject invalid defaultStatus value", () => {
      expect(() =>
        updateSettingsSchema.parse({ defaultStatus: "COMPLETED" as any }),
      ).toThrow();
      expect(() =>
        updateSettingsSchema.parse({ defaultStatus: "todo" as any }),
      ).toThrow();
    });

    it("should omit undefined optional fields", () => {
      const update = {
        theme: "DARK" as const,
        language: undefined,
      };

      const result = updateSettingsSchema.parse(update);

      expect(result.theme).toBe("DARK");
      expect(result.language).toBeUndefined();
    });

    it("should validate all enum values are uppercase", () => {
      // This test ensures the schema enforces uppercase enum values
      const lowercaseAttempts = [
        { theme: "dark" },
        { language: "en" },
        { defaultPriority: "high" },
        { defaultStatus: "done" },
      ];

      lowercaseAttempts.forEach((attempt) => {
        expect(() => updateSettingsSchema.parse(attempt)).toThrow();
      });
    });
  });
});
