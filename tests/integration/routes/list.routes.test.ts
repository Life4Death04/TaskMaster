import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";
import {
  createTestUser,
  generateAuthToken,
} from "../../helpers/test-helpers.js";
import {
  createTestList,
  createTestTask,
} from "../../helpers/test-factories.js";
import { prisma } from "../../../src/config/database.js";

describe("List Routes - Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("POST /api/lists", () => {
    it("should create a new list successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "New List",
        description: "List description",
        color: "#FF5733",
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("List created successfully");
      expect(response.body.list.title).toBe(listData.title);
      expect(response.body.list.description).toBe(listData.description);
      expect(response.body.list.color).toBe(listData.color);
      expect(response.body.list.authorId).toBe(user.id);
      expect(response.body.list.isFavorite).toBe(false);
    });

    it("should create list without optional description", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "List without description",
        color: "#00FF00",
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(201);

      expect(response.body.list.title).toBe(listData.title);
      expect(response.body.list.description).toBeNull();
    });

    it("should use default color if not provided", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "List with default color",
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(201);

      expect(response.body.list.color).toBe("#000000"); // Default color
    });

    it("should return 401 when not authenticated", async () => {
      const listData = {
        title: "Unauthorized list",
      };

      const response = await request(app)
        .post("/api/lists")
        .send(listData)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for missing title", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for empty title", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "",
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for title exceeding max length", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "a".repeat(51), // Max is 50
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid color format", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "List with invalid color",
        color: "not-a-color",
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for description exceeding max length", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "Valid title",
        description: "a".repeat(51), // Max is 50
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/lists", () => {
    it("should fetch all lists for authenticated user", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Create multiple lists
      await createTestList(user.id, { title: "List 1" });
      await createTestList(user.id, { title: "List 2" });
      await createTestList(user.id, { title: "List 3" });

      const response = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Lists retrieved successfully");
      expect(response.body.lists).toHaveLength(3);
      expect(response.body.lists[0].title).toBe("List 3");
      expect(response.body.lists[1].title).toBe("List 2");
      expect(response.body.lists[2].title).toBe("List 1");
    });

    it("should return empty array when user has no lists", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lists).toHaveLength(0);
    });

    it("should only return lists for authenticated user", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token = generateAuthToken(user1.id, user1.email);

      await createTestList(user1.id, { title: "User 1 List" });
      await createTestList(user2.id, { title: "User 2 List" });

      const response = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.lists).toHaveLength(1);
      expect(response.body.lists[0].title).toBe("User 1 List");
      expect(response.body.lists[0].authorId).toBe(user1.id);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/lists").expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("GET /api/lists/:id", () => {
    it("should get a specific list by ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id, { title: "Specific List" });

      const response = await request(app)
        .get(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("List retrieved successfully");
      expect(response.body.list.id).toBe(list.id);
      expect(response.body.list.title).toBe("Specific List");
    });

    it("should include tasks when getting a list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      // Create tasks in the list
      await createTestTask(user.id, { listId: list.id, taskName: "Task 1" });
      await createTestTask(user.id, { listId: list.id, taskName: "Task 2" });

      const response = await request(app)
        .get(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.list.tasks).toHaveLength(2);
      expect(response.body.list.tasks[0].taskName).toBe("Task 1");
      expect(response.body.list.tasks[1].taskName).toBe("Task 2");
    });

    it("should return 404 for non-existent list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/lists/99999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when accessing another user's list", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const list = await createTestList(user2.id);

      const response = await request(app)
        .get(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const response = await request(app)
        .get(`/api/lists/${list.id}`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for invalid list ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/lists/invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/lists/:id", () => {
    it("should update list title", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id, { title: "Original Title" });

      const updateData = {
        title: "Updated Title",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("List updated successfully");
      expect(response.body.list.title).toBe("Updated Title");
    });

    it("should update list description", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const updateData = {
        description: "New description",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.list.description).toBe("New description");
    });

    it("should update list color", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id, { color: "#FF0000" });

      const updateData = {
        color: "#00FF00",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.list.color).toBe("#00FF00");
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const updateData = {
        title: "Multi Update",
        description: "Updated description",
        color: "#123456",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.list.title).toBe("Multi Update");
      expect(response.body.list.description).toBe("Updated description");
      expect(response.body.list.color).toBe("#123456");
    });

    it("should return 404 when updating non-existent list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        title: "Non-existent list",
      };

      const response = await request(app)
        .put("/api/lists/99999")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when updating another user's list", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const list = await createTestList(user2.id);

      const updateData = {
        title: "Hacked list",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const updateData = {
        title: "Unauthorized update",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 when no fields provided", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for invalid color format", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const updateData = {
        color: "invalid-color",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid list ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        title: "Valid title",
      };

      const response = await request(app)
        .put("/api/lists/invalid")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/lists/:id", () => {
    it("should delete list successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const response = await request(app)
        .delete(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("List deleted successfully");

      // Verify list is deleted
      const deletedList = await prisma.list.findUnique({
        where: { id: list.id },
      });
      expect(deletedList).toBeNull();
    });

    it("should cascade delete list's tasks", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      // Create tasks in the list
      await createTestTask(user.id, { listId: list.id });
      await createTestTask(user.id, { listId: list.id });

      await request(app)
        .delete(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Verify tasks are deleted
      const tasks = await prisma.task.findMany({
        where: { listId: list.id },
      });
      expect(tasks).toHaveLength(0);
    });

    it("should not delete tasks without listId when deleting a list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      // Create task with listId
      await createTestTask(user.id, { listId: list.id });

      // Create task without listId
      const taskWithoutList = await createTestTask(user.id, { listId: null });

      await request(app)
        .delete(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Verify task without listId still exists
      const task = await prisma.task.findUnique({
        where: { id: taskWithoutList.id },
      });
      expect(task).not.toBeNull();
    });

    it("should return 404 when deleting non-existent list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .delete("/api/lists/99999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when deleting another user's list", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const list = await createTestList(user2.id);

      const response = await request(app)
        .delete(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const response = await request(app)
        .delete(`/api/lists/${list.id}`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for invalid list ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .delete("/api/lists/invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/lists/:id/favorite", () => {
    it("should toggle list from not favorite to favorite", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id, { isFavorite: false });

      const response = await request(app)
        .patch(`/api/lists/${list.id}/favorite`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "List favorite status toggled successfully",
      );
      expect(response.body.list.isFavorite).toBe(true);
    });

    it("should toggle list from favorite to not favorite", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id, { isFavorite: true });

      const response = await request(app)
        .patch(`/api/lists/${list.id}/favorite`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.list.isFavorite).toBe(false);
    });

    it("should return 404 for non-existent list", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .patch("/api/lists/99999/favorite")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when toggling another user's list", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const list = await createTestList(user2.id);

      const response = await request(app)
        .patch(`/api/lists/${list.id}/favorite`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const response = await request(app)
        .patch(`/api/lists/${list.id}/favorite`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for invalid list ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .patch("/api/lists/invalid/favorite")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("List Isolation & Authorization", () => {
    it("should not allow user to access another user's lists", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      // User 2 creates lists
      await createTestList(user2.id, { title: "User 2 List 1" });
      await createTestList(user2.id, { title: "User 2 List 2" });

      // User 1 tries to fetch all lists
      const response = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // Should not see user 2's lists
      expect(response.body.lists).toHaveLength(0);
    });

    it("should ensure list authorId matches authenticated user", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const listData = {
        title: "New List",
        // Not providing authorId - should be set automatically
      };

      const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send(listData)
        .expect(201);

      // Verify authorId is set to authenticated user
      expect(response.body.list.authorId).toBe(user.id);
    });

    it("should maintain list ownership across updates", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const updateData = {
        title: "Updated Title",
      };

      const response = await request(app)
        .put(`/api/lists/${list.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      // Verify authorId hasn't changed
      expect(response.body.list.authorId).toBe(user.id);
    });
  });
});
