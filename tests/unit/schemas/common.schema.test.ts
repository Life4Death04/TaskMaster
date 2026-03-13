import { describe, it, expect } from "vitest";
import {
  statusEnum,
  priorityEnum,
  themeEnum,
  dateFormatEnum,
  languageEnum,
  idSchema,
  idParamsSchema,
  colorHexSchema,
  isoDateString,
} from "../../../src/schemas/common";

describe("Common Schemas", () => {
  describe("statusEnum", () => {
    it("should accept valid status values", () => {
      expect(statusEnum.parse("TODO")).toBe("TODO");
      expect(statusEnum.parse("IN_PROGRESS")).toBe("IN_PROGRESS");
      expect(statusEnum.parse("DONE")).toBe("DONE");
    });

    it("should reject invalid status values", () => {
      expect(() => statusEnum.parse("INVALID")).toThrow();
      expect(() => statusEnum.parse("todo")).toThrow(); // Case sensitive
      expect(() => statusEnum.parse("")).toThrow();
      expect(() => statusEnum.parse(null)).toThrow();
    });
  });

  describe("priorityEnum", () => {
    it("should accept valid priority values", () => {
      expect(priorityEnum.parse("LOW")).toBe("LOW");
      expect(priorityEnum.parse("MEDIUM")).toBe("MEDIUM");
      expect(priorityEnum.parse("HIGH")).toBe("HIGH");
    });

    it("should reject invalid priority values", () => {
      expect(() => priorityEnum.parse("URGENT")).toThrow();
      expect(() => priorityEnum.parse("low")).toThrow();
      expect(() => priorityEnum.parse("")).toThrow();
    });
  });

  describe("themeEnum", () => {
    it("should accept valid theme values", () => {
      expect(themeEnum.parse("LIGHT")).toBe("LIGHT");
      expect(themeEnum.parse("DARK")).toBe("DARK");
    });

    it("should reject invalid theme values", () => {
      expect(() => themeEnum.parse("AUTO")).toThrow();
      expect(() => themeEnum.parse("light")).toThrow();
      expect(() => themeEnum.parse("")).toThrow();
    });
  });

  describe("dateFormatEnum", () => {
    it("should accept valid date format values", () => {
      expect(dateFormatEnum.parse("MM_DD_YYYY")).toBe("MM_DD_YYYY");
      expect(dateFormatEnum.parse("DD_MM_YYYY")).toBe("DD_MM_YYYY");
      expect(dateFormatEnum.parse("YYYY_MM_DD")).toBe("YYYY_MM_DD");
    });

    it("should reject invalid date format values", () => {
      expect(() => dateFormatEnum.parse("MM-DD-YYYY")).toThrow();
      expect(() => dateFormatEnum.parse("YYYY/MM/DD")).toThrow();
      expect(() => dateFormatEnum.parse("")).toThrow();
    });
  });

  describe("languageEnum", () => {
    it("should accept valid language values", () => {
      expect(languageEnum.parse("EN")).toBe("EN");
      expect(languageEnum.parse("ES")).toBe("ES");
    });

    it("should reject invalid language values", () => {
      expect(() => languageEnum.parse("FR")).toThrow();
      expect(() => languageEnum.parse("en")).toThrow();
      expect(() => languageEnum.parse("")).toThrow();
    });
  });

  describe("idSchema", () => {
    it("should accept positive integers", () => {
      expect(idSchema.parse(1)).toBe(1);
      expect(idSchema.parse(100)).toBe(100);
      expect(idSchema.parse(999999)).toBe(999999);
    });

    it("should reject zero", () => {
      expect(() => idSchema.parse(0)).toThrow();
    });

    it("should reject negative numbers", () => {
      expect(() => idSchema.parse(-1)).toThrow();
      expect(() => idSchema.parse(-100)).toThrow();
    });

    it("should reject decimals", () => {
      expect(() => idSchema.parse(1.5)).toThrow();
      expect(() => idSchema.parse(10.99)).toThrow();
    });

    it("should reject non-numbers", () => {
      expect(() => idSchema.parse("1")).toThrow();
      expect(() => idSchema.parse(null)).toThrow();
      expect(() => idSchema.parse(undefined)).toThrow();
    });
  });

  describe("idParamsSchema", () => {
    it("should accept string representations of positive integers", () => {
      const result1 = idParamsSchema.parse({ id: "1" });
      expect(result1.id).toBe(1);

      const result2 = idParamsSchema.parse({ id: "12345" });
      expect(result2.id).toBe(12345);
    });

    it("should reject zero", () => {
      expect(() => idParamsSchema.parse({ id: "0" })).toThrow();
    });

    it("should reject negative numbers", () => {
      expect(() => idParamsSchema.parse({ id: "-1" })).toThrow();
      expect(() => idParamsSchema.parse({ id: "-100" })).toThrow();
    });

    it("should reject non-numeric strings", () => {
      expect(() => idParamsSchema.parse({ id: "abc" })).toThrow();
      expect(() => idParamsSchema.parse({ id: "1.5" })).toThrow();
      expect(() => idParamsSchema.parse({ id: "" })).toThrow();
    });

    it("should accept strings with leading/trailing spaces (coerced)", () => {
      // z.coerce.number() handles whitespace automatically
      const result = idParamsSchema.parse({ id: " 123 " });
      expect(result.id).toBe(123);
    });
  });

  describe("colorHexSchema", () => {
    it("should accept valid 6-digit hex colors", () => {
      expect(colorHexSchema.parse("#000000")).toBe("#000000");
      expect(colorHexSchema.parse("#FFFFFF")).toBe("#FFFFFF");
      expect(colorHexSchema.parse("#ff5733")).toBe("#ff5733");
      expect(colorHexSchema.parse("#ABC123")).toBe("#ABC123");
    });

    it("should accept valid 3-digit hex colors", () => {
      expect(colorHexSchema.parse("#000")).toBe("#000");
      expect(colorHexSchema.parse("#FFF")).toBe("#FFF");
      expect(colorHexSchema.parse("#f5a")).toBe("#f5a");
      expect(colorHexSchema.parse("#A3C")).toBe("#A3C");
    });

    it("should reject colors without #", () => {
      expect(() => colorHexSchema.parse("000000")).toThrow();
      expect(() => colorHexSchema.parse("FFF")).toThrow();
    });

    it("should reject invalid hex length", () => {
      expect(() => colorHexSchema.parse("#00")).toThrow();
      expect(() => colorHexSchema.parse("#0000")).toThrow();
      expect(() => colorHexSchema.parse("#00000")).toThrow();
      expect(() => colorHexSchema.parse("#0000000")).toThrow();
    });

    it("should reject invalid hex characters", () => {
      expect(() => colorHexSchema.parse("#GGGGGG")).toThrow();
      expect(() => colorHexSchema.parse("#xyz")).toThrow();
      expect(() => colorHexSchema.parse("#12345g")).toThrow();
    });

    it("should reject empty or invalid strings", () => {
      expect(() => colorHexSchema.parse("")).toThrow();
      expect(() => colorHexSchema.parse("#")).toThrow();
      expect(() => colorHexSchema.parse("red")).toThrow();
    });
  });

  describe("isoDateString", () => {
    it("should accept valid ISO datetime strings", () => {
      const date1 = "2024-01-15T10:30:00Z";
      const date2 = "2024-12-31T23:59:59.999Z";
      const date3 = "2024-06-15T14:30:00+02:00";

      expect(isoDateString.parse(date1)).toBe(date1);
      expect(isoDateString.parse(date2)).toBe(date2);
      expect(isoDateString.parse(date3)).toBe(date3);
    });

    it("should accept non-empty strings (flexible parsing)", () => {
      // The schema is flexible for service-level parsing
      expect(isoDateString.parse("2024-01-15")).toBe("2024-01-15");
      expect(isoDateString.parse("some-date-string")).toBe("some-date-string");
    });

    it("should reject empty strings", () => {
      expect(() => isoDateString.parse("")).toThrow();
    });

    it("should reject null and undefined", () => {
      expect(() => isoDateString.parse(null)).toThrow();
      expect(() => isoDateString.parse(undefined)).toThrow();
    });
  });
});
