import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";
import {
  createTestUser,
  generateAuthToken,
} from "../../helpers/test-helpers.js";
import { prisma } from "../../../src/config/database.js";
import jwt from "jsonwebtoken";
import { env } from "../../../src/config/env.js";

describe("User/Auth Routes - Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "newuser@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user).not.toHaveProperty("password");
      expect(typeof response.body.token).toBe("string");
    });

    it("should register user with optional profileImage", async () => {
      const userData = {
        email: "user@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Smith",
        profileImage: "https://example.com/avatar.jpg",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.user.profileImage).toBe(userData.profileImage);
    });

    it("should return 409 if email already exists", async () => {
      await createTestUser({ email: "existing@example.com" });

      const userData = {
        email: "existing@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.message).toBe("Email already registered");
    });

    it("should return 400 for invalid email format", async () => {
      const userData = {
        email: "notanemail",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for password shorter than 8 characters", async () => {
      const userData = {
        email: "test@example.com",
        password: "short",
        firstName: "Test",
        lastName: "User",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for missing required fields", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should hash password before storing", async () => {
      const userData = {
        email: "hashtest@example.com",
        password: "password123",
        firstName: "Hash",
        lastName: "Test",
      };

      await request(app).post("/api/auth/register").send(userData).expect(201);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$.{56}$/); // Bcrypt hash pattern
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const user = await createTestUser({
        email: "login@example.com",
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123", // This is the unhashed password used in createTestUser
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 for non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 401 for incorrect password", async () => {
      await createTestUser({ email: "wrongpass@example.com" });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "wrongpass@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "notanemail",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for missing credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return JWT token on successful login", async () => {
      await createTestUser({ email: "jwt@example.com" });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "jwt@example.com",
          password: "password123",
        })
        .expect(200);

      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.split(".")).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe("GET /api/users/me", () => {
    it("should return current user profile when authenticated", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.firstName).toBe(user.firstName);
      expect(response.body.user.lastName).toBe(user.lastName);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 when no token provided", async () => {
      const response = await request(app).get("/api/users/me").expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);

      expect(response.body.message).toBe("Invalid token");
    });

    it("should return 401 when token format is incorrect", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "InvalidFormat token123")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 404 when user no longer exists", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Delete the user
      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/users/me", () => {
    it("should update user profile successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "UpdatedFirst",
          lastName: "UpdatedLast",
        })
        .expect(200);

      expect(response.body.user.firstName).toBe("UpdatedFirst");
      expect(response.body.user.lastName).toBe("UpdatedLast");
      expect(response.body.user.email).toBe(user.email); // Unchanged
    });

    it("should update email", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "newemail@example.com",
        })
        .expect(200);

      expect(response.body.user.email).toBe("newemail@example.com");
    });

    it("should update profileImage", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          profileImage: "https://example.com/newavatar.jpg",
        })
        .expect(200);

      expect(response.body.user.profileImage).toBe(
        "https://example.com/newavatar.jpg",
      );
    });
    /* 
    In the current implementation, phoneNumber is not included in the user model or update schema. If it were added, we would test it like this:
    it("should update phoneNumber", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          phoneNumber: "+1234567890",
        })
        .expect(200);

      expect(response.body.user.phoneNumber).toBe("+1234567890");
    }); */

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "Multi",
          lastName: "Update",
          email: "multi@example.com",
          // Phone number is not currently supported, but if it were, we would include it here
          /* phoneNumber: "+9876543210", */
        })
        .expect(200);

      expect(response.body.user.firstName).toBe("Multi");
      expect(response.body.user.lastName).toBe("Update");
      expect(response.body.user.email).toBe("multi@example.com");
      // Phone number assertion would go here if it were supported
      /* expect(response.body.user.phoneNumber).toBe("+9876543210"); */
    });

    it("should return 409 if new email is already in use", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      await createTestUser({ email: "user2@example.com" });
      const token = generateAuthToken(user1.id, user1.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "user2@example.com",
        })
        .expect(409);

      expect(response.body.message).toBe("Email already in use");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/api/users/me")
        .send({
          firstName: "Test",
        })
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for invalid email format", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "notanemail",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not include password in response", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "NoPassword",
        })
        .expect(200);

      expect(response.body.user).not.toHaveProperty("password");
    });
  });

  describe("DELETE /api/users/me", () => {
    it("should delete user account successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      await request(app)
        .delete("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it("should cascade delete user's related data", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Create related data
      await prisma.task.create({
        data: {
          taskName: "Test Task",
          authorId: user.id,
          status: "TODO",
        },
      });

      await prisma.list.create({
        data: {
          title: "Test List",
          authorId: user.id,
        },
      });

      await request(app)
        .delete("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      // Verify all data is deleted
      const tasks = await prisma.task.findMany({
        where: { authorId: user.id },
      });
      const lists = await prisma.list.findMany({
        where: { authorId: user.id },
      });

      expect(tasks).toHaveLength(0);
      expect(lists).toHaveLength(0);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).delete("/api/users/me").expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .delete("/api/users/me")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);

      expect(response.body.message).toBe("Invalid token");
    });

    it("should not be able to use deleted account", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Delete account
      await request(app)
        .delete("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      // Try to access with the same token
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("Authentication Token Validation", () => {
    it("should reject expired tokens", async () => {
      const user = await createTestUser();

      const expiredToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        env.JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token");
    });

    it("should reject token with wrong secret", async () => {
      const user = await createTestUser();

      const invalidToken = jwt.sign(
        { sub: user.id, email: user.email },
        "wrong-secret",
      );

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.message).toBe("Invalid token");
    });

    it("should accept valid Bearer token", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
    });
  });
});
