import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";

describe("E2E - Multi-User Isolation and Security", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it("should maintain complete data isolation between users", async () => {
    // Create User 1
    const user1Response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user1@example.com",
        password: "password123",
        firstName: "User",
        lastName: "One",
      })
      .expect(201);

    const token1 = user1Response.body.token;
    const user1Id = user1Response.body.user.id;

    // Create User 2
    const user2Response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user2@example.com",
        password: "password123",
        firstName: "User",
        lastName: "Two",
      })
      .expect(201);

    const token2 = user2Response.body.token;

    // User 1 creates tasks and lists
    const user1TaskResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        taskName: "User 1 Private Task",
        priority: "HIGH",
      })
      .expect(201);

    const user1TaskId = user1TaskResponse.body.data.id;

    const user1ListResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "User 1 Private List",
        color: "#FF0000",
      })
      .expect(201);

    const user1ListId = user1ListResponse.body.list.id;

    // User 1 updates settings
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        theme: "DARK",
      })
      .expect(200);

    // User 2 creates tasks and lists
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        taskName: "User 2 Private Task",
        priority: "LOW",
      })
      .expect(201);

    const user2ListResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        title: "User 2 Private List",
        color: "#00FF00",
      })
      .expect(201);

    const user2ListId = user2ListResponse.body.list.id;

    // User 2 updates settings
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        theme: "LIGHT",
      })
      .expect(200);

    // Verify User 1 can only see their own data
    const user1TasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(user1TasksResponse.body.data).toHaveLength(1);
    expect(user1TasksResponse.body.data[0].taskName).toBe(
      "User 1 Private Task",
    );

    const user1ListsResponse = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(user1ListsResponse.body.lists).toHaveLength(1);
    expect(user1ListsResponse.body.lists[0].title).toBe("User 1 Private List");

    const user1SettingsResponse = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(user1SettingsResponse.body.settings.theme).toBe("DARK");

    // Verify User 2 can only see their own data
    const user2TasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    expect(user2TasksResponse.body.data).toHaveLength(1);
    expect(user2TasksResponse.body.data[0].taskName).toBe(
      "User 2 Private Task",
    );

    const user2ListsResponse = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    expect(user2ListsResponse.body.lists).toHaveLength(1);
    expect(user2ListsResponse.body.lists[0].title).toBe("User 2 Private List");

    const user2SettingsResponse = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    expect(user2SettingsResponse.body.settings.theme).toBe("LIGHT");

    // User 2 tries to access User 1's task - should fail
    await request(app)
      .get(`/api/tasks/${user1TaskId}`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    // User 2 tries to update User 1's task - should fail
    await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token2}`)
      .send({
        id: user1TaskId,
        taskName: "Hacked task",
      })
      .expect(404);

    // User 2 tries to delete User 1's task - should fail
    await request(app)
      .delete(`/api/tasks/${user1TaskId}`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    // User 2 tries to access User 1's list - should fail
    await request(app)
      .get(`/api/lists/${user1ListId}`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    // User 2 tries to update User 1's list - should fail
    await request(app)
      .put(`/api/lists/${user1ListId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        title: "Hacked list",
      })
      .expect(404);

    // User 2 tries to delete User 1's list - should fail
    await request(app)
      .delete(`/api/lists/${user1ListId}`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    // User 2 tries to toggle User 1's list favorite - should fail
    await request(app)
      .patch(`/api/lists/${user1ListId}/favorite`)
      .set("Authorization", `Bearer ${token2}`)
      .expect(404);

    // Verify User 1's data is still intact
    const finalUser1TasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    expect(finalUser1TasksResponse.body.data).toHaveLength(1);
    expect(finalUser1TasksResponse.body.data[0].taskName).toBe(
      "User 1 Private Task",
    );
  });

  it("should handle authentication failures gracefully", async () => {
    // Register user
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "auth-test@example.com",
        password: "password123",
        firstName: "Auth",
        lastName: "Test",
      })
      .expect(201);

    const validToken = registerResponse.body.token;

    // Try to access protected routes without token
    await request(app).get("/api/tasks").expect(401);

    await request(app).get("/api/lists").expect(401);

    await request(app).get("/api/settings").expect(401);

    await request(app).get("/api/users/me").expect(401);

    // Try with invalid token
    await request(app)
      .get("/api/tasks")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(401);

    // Try with malformed authorization header
    await request(app)
      .get("/api/tasks")
      .set("Authorization", "InvalidFormat token123")
      .expect(401);

    // Try with valid token after user is deleted
    await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(204);

    await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(404); // User not found
  });

  it("should handle duplicate email registration", async () => {
    const userData = {
      email: "duplicate@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
    };

    // First registration succeeds
    await request(app).post("/api/auth/register").send(userData).expect(201);

    // Second registration with same email fails
    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send(userData)
      .expect(409);

    expect(duplicateResponse.body.message).toBe("Email already registered");
  });

  it("should handle login with wrong credentials", async () => {
    // Register user
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login-test@example.com",
        password: "correctPassword123",
        firstName: "Login",
        lastName: "Test",
      })
      .expect(201);

    // Try login with wrong password
    const wrongPasswordResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login-test@example.com",
        password: "wrongPassword",
      })
      .expect(401);

    expect(wrongPasswordResponse.body.message).toBe("Invalid credentials");

    // Try login with non-existent email
    const wrongEmailResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "password123",
      })
      .expect(401);

    expect(wrongEmailResponse.body.message).toBe("Invalid credentials");
  });
});
