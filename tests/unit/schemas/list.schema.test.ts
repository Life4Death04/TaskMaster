import { describe, it, expect } from "vitest";
import {
  createListSchema,
  updateListSchema,
} from "../../../src/schemas/list.schema";

describe("List Schemas", () => {
  describe("createListSchema", () => {
    const validListData = {
      title: "My Todo List",
      description: "Tasks for today",
      color: "#FF5733",
    };

    it("should accept valid list data with all fields", () => {
      const result = createListSchema.parse(validListData);

      expect(result.title).toBe(validListData.title);
      expect(result.description).toBe(validListData.description);
      expect(result.color).toBe(validListData.color);
    });

    it("should accept minimal data (only title)", () => {
      const minimal = { title: "Simple List" };

      const result = createListSchema.parse(minimal);

      expect(result.title).toBe("Simple List");
      expect(result.color).toBe("#000000"); // Default color
    });

    it("should apply default color #000000", () => {
      const result = createListSchema.parse({ title: "Test List" });

      expect(result.color).toBe("#000000");
    });

    it("should accept optional description", () => {
      const withDesc = {
        title: "List",
        description: "My description",
      };

      const result = createListSchema.parse(withDesc);

      expect(result.description).toBe("My description");
    });

    it("should reject empty title", () => {
      expect(() => createListSchema.parse({ title: "" })).toThrow();
    });

    it("should reject title longer than 50 characters", () => {
      const longTitle = "a".repeat(51);

      expect(() => createListSchema.parse({ title: longTitle })).toThrow();
    });

    it("should accept title exactly 50 characters", () => {
      const maxTitle = "a".repeat(50);

      const result = createListSchema.parse({ title: maxTitle });

      expect(result.title).toBe(maxTitle);
    });

    it("should reject description longer than 50 characters", () => {
      const longDesc = "a".repeat(51);

      expect(() =>
        createListSchema.parse({ title: "Test", description: longDesc }),
      ).toThrow();
    });

    it("should accept description exactly 50 characters", () => {
      const maxDesc = "a".repeat(50);

      const result = createListSchema.parse({
        title: "Test",
        description: maxDesc,
      });

      expect(result.description).toBe(maxDesc);
    });

    it("should accept valid 6-digit hex colors", () => {
      const colors = ["#000000", "#FFFFFF", "#FF5733", "#abc123"];

      colors.forEach((color) => {
        const result = createListSchema.parse({ title: "Test", color });
        expect(result.color).toBe(color);
      });
    });

    it("should accept valid 3-digit hex colors", () => {
      const colors = ["#000", "#FFF", "#F5A"];

      colors.forEach((color) => {
        const result = createListSchema.parse({ title: "Test", color });
        expect(result.color).toBe(color);
      });
    });

    it("should reject invalid hex color format", () => {
      const invalidColors = [
        "000000", // Missing #
        "#GGGGGG", // Invalid hex chars
        "#12345", // Wrong length
        "red", // Named color
        "#1234567", // Too long
      ];

      invalidColors.forEach((color) => {
        expect(() =>
          createListSchema.parse({ title: "Test", color }),
        ).toThrow();
      });
    });
  });

  describe("updateListSchema", () => {
    it("should accept partial updates with single field", () => {
      const updates = [
        { title: "Updated Title" },
        { description: "Updated description" },
        { color: "#FF0000" },
      ];

      updates.forEach((update) => {
        const result = updateListSchema.parse(update);
        expect(result).toEqual(update);
      });
    });

    it("should accept multiple fields at once", () => {
      const update = {
        title: "New Title",
        description: "New description",
        color: "#00FF00",
      };

      const result = updateListSchema.parse(update);

      expect(result).toEqual(update);
    });

    it("should reject empty update object", () => {
      expect(() => updateListSchema.parse({})).toThrow();
    });

    it("should reject empty title", () => {
      expect(() => updateListSchema.parse({ title: "" })).toThrow();
    });

    it("should reject title longer than 50 characters", () => {
      const longTitle = "a".repeat(51);

      expect(() => updateListSchema.parse({ title: longTitle })).toThrow();
    });

    it("should accept title exactly 50 characters", () => {
      const maxTitle = "a".repeat(50);

      const result = updateListSchema.parse({ title: maxTitle });

      expect(result.title).toBe(maxTitle);
    });

    it("should reject description longer than 50 characters", () => {
      const longDesc = "a".repeat(51);

      expect(() => updateListSchema.parse({ description: longDesc })).toThrow();
    });

    it("should accept description exactly 50 characters", () => {
      const maxDesc = "a".repeat(50);

      const result = updateListSchema.parse({ description: maxDesc });

      expect(result.description).toBe(maxDesc);
    });

    it("should accept valid hex colors", () => {
      const colors = ["#FF5733", "#abc", "#123456"];

      colors.forEach((color) => {
        const result = updateListSchema.parse({ color });
        expect(result.color).toBe(color);
      });
    });

    it("should reject invalid hex colors", () => {
      const invalidColors = ["#GGGGGG", "FF5733", "#12345", "blue"];

      invalidColors.forEach((color) => {
        expect(() => updateListSchema.parse({ color })).toThrow();
      });
    });

    it("should omit undefined optional fields", () => {
      const update = {
        title: "Updated",
        description: undefined,
      };

      const result = updateListSchema.parse(update);

      expect(result.title).toBe("Updated");
      expect(result.description).toBeUndefined();
    });
  });
});
