import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
} from "../../../src/schemas/user.schema";

describe("User Schemas", () => {
  describe("registerSchema", () => {
    const validRegisterData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
    };

    it("should accept valid registration data", () => {
      const result = registerSchema.parse(validRegisterData);

      expect(result).toEqual(validRegisterData);
    });

    it("should accept optional profileImage URL", () => {
      const withImage = {
        ...validRegisterData,
        profileImage: "https://example.com/avatar.jpg",
      };

      const result = registerSchema.parse(withImage);

      expect(result.profileImage).toBe("https://example.com/avatar.jpg");
    });

    it("should reject empty firstName", () => {
      const invalid = { ...validRegisterData, firstName: "" };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it("should reject firstName longer than 50 characters", () => {
      const invalid = {
        ...validRegisterData,
        firstName: "a".repeat(51),
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it("should reject empty lastName", () => {
      const invalid = { ...validRegisterData, lastName: "" };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it("should reject lastName longer than 50 characters", () => {
      const invalid = {
        ...validRegisterData,
        lastName: "b".repeat(51),
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user@.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        expect(() =>
          registerSchema.parse({ ...validRegisterData, email }),
        ).toThrow();
      });
    });

    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "123@test.com",
      ];

      validEmails.forEach((email) => {
        const result = registerSchema.parse({ ...validRegisterData, email });
        expect(result.email).toBe(email);
      });
    });

    it("should reject password shorter than 8 characters", () => {
      const invalid = { ...validRegisterData, password: "short" };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it("should accept password exactly 8 characters", () => {
      const valid = { ...validRegisterData, password: "12345678" };

      const result = registerSchema.parse(valid);

      expect(result.password).toBe("12345678");
    });

    it("should accept long passwords", () => {
      const valid = {
        ...validRegisterData,
        password: "a".repeat(100),
      };

      const result = registerSchema.parse(valid);

      expect(result.password).toBe("a".repeat(100));
    });

    it("should reject missing required fields", () => {
      expect(() =>
        registerSchema.parse({ lastName: "Doe", email: "test@test.com" }),
      ).toThrow();
      expect(() =>
        registerSchema.parse({
          firstName: "John",
          email: "test@test.com",
          password: "password",
        }),
      ).toThrow();
    });
  });

  describe("loginSchema", () => {
    const validLoginData = {
      email: "user@example.com",
      password: "password123",
    };

    it("should accept valid login data", () => {
      const result = loginSchema.parse(validLoginData);

      expect(result).toEqual(validLoginData);
    });

    it("should reject invalid email", () => {
      const invalid = { ...validLoginData, email: "notanemail" };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });

    it("should reject password shorter than 8 characters", () => {
      const invalid = { ...validLoginData, password: "short" };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });

    it("should reject missing email", () => {
      expect(() => loginSchema.parse({ password: "password123" })).toThrow();
    });

    it("should reject missing password", () => {
      expect(() => loginSchema.parse({ email: "user@example.com" })).toThrow();
    });
  });

  describe("updateUserSchema", () => {
    it("should accept partial updates with single field", () => {
      const updates = [
        { firstName: "NewName" },
        { lastName: "NewLastName" },
        { email: "new@example.com" },
        { profileImage: "https://example.com/new.jpg" },
        { phoneNumber: "+1234567890" },
      ];

      updates.forEach((update) => {
        const result = updateUserSchema.parse(update);
        expect(result).toEqual(update);
      });
    });

    it("should accept multiple fields at once", () => {
      const update = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      const result = updateUserSchema.parse(update);

      expect(result).toEqual(update);
    });

    it("should reject empty update object", () => {
      expect(() => updateUserSchema.parse({})).toThrow();
    });

    it("should reject empty firstName", () => {
      expect(() => updateUserSchema.parse({ firstName: "" })).toThrow();
    });

    it("should reject firstName longer than 50 characters", () => {
      expect(() =>
        updateUserSchema.parse({ firstName: "a".repeat(51) }),
      ).toThrow();
    });

    it("should reject empty lastName", () => {
      expect(() => updateUserSchema.parse({ lastName: "" })).toThrow();
    });

    it("should reject lastName longer than 50 characters", () => {
      expect(() =>
        updateUserSchema.parse({ lastName: "b".repeat(51) }),
      ).toThrow();
    });

    it("should reject invalid email format", () => {
      const invalidEmails = ["notanemail", "@invalid", "user@"];

      invalidEmails.forEach((email) => {
        expect(() => updateUserSchema.parse({ email })).toThrow();
      });
    });

    it("should reject invalid profileImage URL", () => {
      expect(() =>
        updateUserSchema.parse({ profileImage: "not-a-url" }),
      ).toThrow();
    });

    it("should reject profileImage longer than 255 characters", () => {
      const longUrl = "https://example.com/" + "a".repeat(250);

      expect(() => updateUserSchema.parse({ profileImage: longUrl })).toThrow();
    });

    it("should reject phoneNumber longer than 30 characters", () => {
      expect(() =>
        updateUserSchema.parse({ phoneNumber: "1".repeat(31) }),
      ).toThrow();
    });

    it("should accept valid phoneNumber", () => {
      const validPhoneNumbers = [
        "+1234567890",
        "123-456-7890",
        "(123) 456-7890",
        "+44 20 1234 5678",
      ];

      validPhoneNumbers.forEach((phoneNumber) => {
        const result = updateUserSchema.parse({ phoneNumber });
        expect(result.phoneNumber).toBe(phoneNumber);
      });
    });

    it("should omit undefined optional fields", () => {
      const update = {
        firstName: "John",
        email: undefined,
      };

      const result = updateUserSchema.parse(update);

      expect(result.firstName).toBe("John");
      expect(result.email).toBeUndefined();
    });
  });
});
