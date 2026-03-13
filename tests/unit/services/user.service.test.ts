import { describe, it, expect, beforeEach } from "vitest";
import * as UserService from "../../../src/services/user.service";
import {
  createTestUser,
  createTestTask,
  createTestList,
} from "../../helpers/test-factories";
import { prisma } from "../../../src/config/database";
import jwt from "jsonwebtoken";
import { env } from "../../../src/config/env";

describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user with hashed password", async () => {
      const userData = {
        email: "john@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      const user = await UserService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // Bcrypt hash pattern
    });

    it("should create user with optional profileImage", async () => {
      const userData = {
        email: "jane@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Smith",
        profileImage: "https://example.com/avatar.jpg",
      };

      const user = await UserService.createUser(userData);

      expect(user.profileImage).toBe(userData.profileImage);
    });

    it("should set profileImage to null when not provided", async () => {
      const userData = {
        email: "bob@example.com",
        password: "password123",
        firstName: "Bob",
        lastName: "Brown",
      };

      const user = await UserService.createUser(userData);

      expect(user.profileImage).toBeNull();
    });

    it("should fail when creating user with duplicate email", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "password123",
        firstName: "User",
        lastName: "One",
      };

      await UserService.createUser(userData);

      // Attempt to create another user with same email
      await expect(UserService.createUser(userData)).rejects.toThrow();
    });
  });

  describe("findUserByEmail", () => {
    it("should find user by email", async () => {
      const createdUser = await createTestUser({
        email: "findme@example.com",
      });

      const foundUser = await UserService.findUserByEmail("findme@example.com");

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe("findme@example.com");
    });

    it("should return null for non-existent email", async () => {
      const user = await UserService.findUserByEmail("nonexistent@example.com");

      expect(user).toBeNull();
    });

    it("should be case-insensitive", async () => {
      const createdUser = await createTestUser({ email: "case@example.com" });

      const user = await UserService.findUserByEmail("CASE@EXAMPLE.COM");

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id); // Email lookup should be case-insensitive
    });
  });

  describe("getUserById", () => {
    it("should find user by ID", async () => {
      const createdUser = await createTestUser();

      const foundUser = await UserService.getUserById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it("should return null for non-existent ID", async () => {
      const user = await UserService.getUserById(99999);

      expect(user).toBeNull();
    });
  });

  describe("updateUserById", () => {
    it("should update user firstName", async () => {
      const user = await createTestUser({ firstName: "Original" });

      const updated = await UserService.updateUserById(user.id, {
        firstName: "Updated",
      });

      expect(updated.firstName).toBe("Updated");
      expect(updated.lastName).toBe(user.lastName); // Other fields unchanged
    });

    it("should update user lastName", async () => {
      const user = await createTestUser({ lastName: "Original" });

      const updated = await UserService.updateUserById(user.id, {
        lastName: "Updated",
      });

      expect(updated.lastName).toBe("Updated");
    });

    it("should update user email", async () => {
      const user = await createTestUser({ email: "old@example.com" });

      const updated = await UserService.updateUserById(user.id, {
        email: "new@example.com",
      });

      expect(updated.email).toBe("new@example.com");
    });

    it("should update profileImage", async () => {
      const user = await createTestUser({ profileImage: null });

      const updated = await UserService.updateUserById(user.id, {
        profileImage: "https://example.com/new-avatar.jpg",
      });

      expect(updated.profileImage).toBe("https://example.com/new-avatar.jpg");
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();

      const updated = await UserService.updateUserById(user.id, {
        firstName: "Multi",
        lastName: "Update",
        email: "multi@example.com",
      });

      expect(updated.firstName).toBe("Multi");
      expect(updated.lastName).toBe("Update");
      expect(updated.email).toBe("multi@example.com");
    });

    it("should hash password when updating", async () => {
      const user = await createTestUser();
      const newPassword = "newPassword123";

      const updated = await UserService.updateUserById(user.id, {
        password: newPassword,
      });

      expect(updated.password).not.toBe(newPassword);
      expect(updated.password).toMatch(/^\$2[aby]\$.{56}$/);

      // Verify the new password works
      const isValid = await UserService.verifyPassword(
        newPassword,
        updated.password || "",
      );
      expect(isValid).toBe(true);
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        UserService.updateUserById(99999, { firstName: "Ghost" }),
      ).rejects.toThrow();
    });
  });

  describe("deleteUserById", () => {
    it("should delete user", async () => {
      const user = await createTestUser();

      await UserService.deleteUserById(user.id);

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it("should cascade delete user's tasks", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await UserService.deleteUserById(user.id);

      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
    });

    it("should cascade delete user's lists", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await UserService.deleteUserById(user.id);

      const deletedList = await prisma.list.findUnique({
        where: { id: list.id },
      });
      expect(deletedList).toBeNull();
    });

    it("should cascade delete user's settings", async () => {
      const user = await createTestUser();
      const settings = await prisma.userSettings.create({
        data: { userId: user.id },
      });

      await UserService.deleteUserById(user.id);

      const deletedSettings = await prisma.userSettings.findUnique({
        where: { id: settings.id },
      });
      expect(deletedSettings).toBeNull();
    });

    it("should delete all user data in a transaction", async () => {
      const user = await createTestUser();
      await createTestTask(user.id);
      await createTestList(user.id);
      await prisma.userSettings.create({ data: { userId: user.id } });

      await UserService.deleteUserById(user.id);

      // Verify all data is deleted
      const [tasks, lists, settings, deletedUser] = await Promise.all([
        prisma.task.findMany({ where: { authorId: user.id } }),
        prisma.list.findMany({ where: { authorId: user.id } }),
        prisma.userSettings.findMany({ where: { userId: user.id } }),
        prisma.user.findUnique({ where: { id: user.id } }),
      ]);

      expect(tasks).toHaveLength(0);
      expect(lists).toHaveLength(0);
      expect(settings).toHaveLength(0);
      expect(deletedUser).toBeNull();
    });

    it("should throw error for non-existent user", async () => {
      await expect(UserService.deleteUserById(99999)).rejects.toThrow();
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const plainPassword = "correctPassword123";
      const user = await UserService.createUser({
        email: "verify@example.com",
        password: plainPassword,
        firstName: "Verify",
        lastName: "Test",
      });

      const isValid = await UserService.verifyPassword(
        plainPassword,
        user.password || "",
      );

      expect(isValid).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const user = await UserService.createUser({
        email: "wrong@example.com",
        password: "correctPassword",
        firstName: "Wrong",
        lastName: "Test",
      });

      const isValid = await UserService.verifyPassword(
        "wrongPassword",
        user.password || "",
      );

      expect(isValid).toBe(false);
    });

    it("should return false for empty password", async () => {
      const user = await UserService.createUser({
        email: "empty@example.com",
        password: "realPassword",
        firstName: "Empty",
        lastName: "Test",
      });

      const isValid = await UserService.verifyPassword("", user.password || "");

      expect(isValid).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const user = await UserService.createUser({
        email: "case@example.com",
        password: "Password123",
        firstName: "Case",
        lastName: "Test",
      });

      const isValid = await UserService.verifyPassword(
        "password123",
        user.password || "",
      );

      expect(isValid).toBe(false);
    });
  });

  describe("signToken", () => {
    it("should generate a valid JWT token", () => {
      const payload = { sub: 123, email: "test@example.com" };

      const token = UserService.signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should include sub in token payload", () => {
      const payload = { sub: 456 };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(decoded.sub).toBe("456"); // Converted to string
    });

    it("should include email in token payload when provided", () => {
      const payload = { sub: 789, email: "jwt@example.com" };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(decoded.email).toBe("jwt@example.com");
    });

    it("should not include email when not provided", () => {
      const payload = { sub: 123 };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(decoded.email).toBeUndefined();
    });

    it("should convert numeric sub to string", () => {
      const payload = { sub: 999 };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(typeof decoded.sub).toBe("string");
      expect(decoded.sub).toBe("999");
    });

    it("should keep string sub as string", () => {
      const payload = { sub: "string-id-123" };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(decoded.sub).toBe("string-id-123");
    });

    it("should set expiration to 7 days", () => {
      const payload = { sub: 111 };

      const token = UserService.signToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      expect(decoded.exp).toBeDefined();
      // Check expiration is approximately 7 days from now
      const sevenDaysFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      expect(decoded.exp).toBeCloseTo(sevenDaysFromNow, -2); // Within ~100 seconds
    });
  });

  describe("toSafeUser", () => {
    it("should return user without password", async () => {
      const user = await createTestUser();

      const safeUser = UserService.toSafeUser(user);

      expect(safeUser).not.toHaveProperty("password");
      expect(safeUser).not.toHaveProperty("emailVerified");
      expect(safeUser).not.toHaveProperty("phoneNumber");
    });

    it("should include only safe fields", async () => {
      const user = await createTestUser({
        firstName: "Safe",
        lastName: "User",
        email: "safe@example.com",
        profileImage: "https://example.com/avatar.jpg",
      });

      const safeUser = UserService.toSafeUser(user);

      expect(safeUser).toHaveProperty("id");
      expect(safeUser).toHaveProperty("email");
      expect(safeUser).toHaveProperty("firstName");
      expect(safeUser).toHaveProperty("lastName");
      expect(safeUser).toHaveProperty("profileImage");
      expect(safeUser).toHaveProperty("createdAt");

      // Should have exactly 6 properties
      expect(Object.keys(safeUser)).toHaveLength(6);
    });

    it("should preserve all safe field values", async () => {
      const user = await createTestUser({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        profileImage: "https://example.com/john.jpg",
      });

      const safeUser = UserService.toSafeUser(user);

      expect(safeUser.id).toBe(user.id);
      expect(safeUser.email).toBe(user.email);
      expect(safeUser.firstName).toBe(user.firstName);
      expect(safeUser.lastName).toBe(user.lastName);
      expect(safeUser.profileImage).toBe(user.profileImage);
      expect(safeUser.createdAt).toEqual(user.createdAt);
    });
  });
});
