import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";
import {
  createTestUser,
  generateAuthToken,
} from "../../helpers/test-helpers.js";
import {
  createTestTask,
  createTestList,
} from "../../helpers/test-factories.js";
import { prisma } from "../../../src/config/database.js";

describe("Task Routes - Integration Tests", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("POST /api/tasks", () => {
    it("should create a new task successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "New Task",
        description: "Task description",
        status: "TODO",
        priority: "HIGH",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Task created successfully");
      expect(response.body.data.taskName).toBe(taskData.taskName);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.authorId).toBe(user.id);
    });

    it("should create task with optional dueDate", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const dueDate = new Date("2026-12-31");
      const taskData = {
        taskName: "Task with due date",
        dueDate: dueDate.toISOString(),
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.dueDate).toBe(dueDate.toISOString());
    });

    it("should create task with listId", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const list = await createTestList(user.id);

      const taskData = {
        taskName: "Task in list",
        listId: list.id,
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.listId).toBe(list.id);
    });

    it("should use default values for status and priority", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "Task with defaults",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.status).toBe("TODO");
      expect(response.body.data.priority).toBe("LOW");
    });

    it("should return 401 when not authenticated", async () => {
      const taskData = {
        taskName: "Unauthorized task",
      };

      const response = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for missing taskName", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 400 for taskName exceeding max length", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "a".repeat(101), // Max is 100
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid status", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "Task with invalid status",
        status: "INVALID_STATUS",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid priority", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "Task with invalid priority",
        priority: "INVALID_PRIORITY",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/tasks", () => {
    it("should fetch all tasks for authenticated user", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      // Create multiple tasks
      await createTestTask(user.id, { taskName: "Task 1" });
      await createTestTask(user.id, { taskName: "Task 2" });
      await createTestTask(user.id, { taskName: "Task 3" });

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].taskName).toBe("Task 3");
      expect(response.body.data[1].taskName).toBe("Task 2");
      expect(response.body.data[2].taskName).toBe("Task 1");
    });

    it("should return empty array when user has no tasks", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it("should only return tasks for authenticated user", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token = generateAuthToken(user1.id, user1.email);

      await createTestTask(user1.id, { taskName: "User 1 Task" });
      await createTestTask(user2.id, { taskName: "User 2 Task" });

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].taskName).toBe("User 1 Task");
      expect(response.body.data[0].authorId).toBe(user1.id);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/tasks").expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("GET /api/tasks/:taskId", () => {
    it("should get a specific task by ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { taskName: "Specific Task" });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.taskName).toBe("Specific Task");
    });

    it("should return 404 for non-existent task", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/tasks/99999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe("Task not found");
    });

    it("should return 404 when accessing another user's task", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const task = await createTestTask(user2.id);

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toBe("Task not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for invalid task ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .get("/api/tasks/invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/tasks", () => {
    it("should update task successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { taskName: "Original Name" });

      const updateData = {
        id: task.id,
        taskName: "Updated Name",
        description: "Updated description",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Task updated successfully");
      expect(response.body.data.taskName).toBe("Updated Name");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should update task status", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { status: "TODO" });

      const updateData = {
        id: task.id,
        status: "IN_PROGRESS",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.status).toBe("IN_PROGRESS");
    });

    it("should update task priority", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { priority: "LOW" });

      const updateData = {
        id: task.id,
        priority: "HIGH",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.priority).toBe("HIGH");
    });

    it("should update task dueDate", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id);

      const newDueDate = new Date("2026-12-31");
      const updateData = {
        id: task.id,
        dueDate: newDueDate.toISOString(),
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.dueDate).toBe(newDueDate.toISOString());
    });

    it("should update task listId", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id);
      const list = await createTestList(user.id);

      const updateData = {
        id: task.id,
        listId: list.id,
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.listId).toBe(list.id);
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id);

      const updateData = {
        id: task.id,
        taskName: "Multi Update",
        status: "DONE",
        priority: "HIGH",
        description: "Updated via multiple fields",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.taskName).toBe("Multi Update");
      expect(response.body.data.status).toBe("DONE");
      expect(response.body.data.priority).toBe("HIGH");
      expect(response.body.data.description).toBe(
        "Updated via multiple fields",
      );
    });

    it("should return 404 when updating non-existent task", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        id: 99999,
        taskName: "Non-existent task",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when updating another user's task", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const task = await createTestTask(user2.id);

      const updateData = {
        id: task.id,
        taskName: "Hacked task",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token1}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const updateData = {
        id: 1,
        taskName: "Unauthorized update",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 when no fields provided except id", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id);

      const updateData = {
        id: task.id,
        // No other fields
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for missing id", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const updateData = {
        taskName: "No ID provided",
      };

      const response = await request(app)
        .patch("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/tasks/:taskId", () => {
    it("should delete task successfully", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Task deleted successfully");

      // Verify task is deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
    });

    it("should return 404 when deleting non-existent task", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .delete("/api/tasks/99999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when deleting another user's task", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const task = await createTestTask(user2.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return 400 for invalid task ID", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .delete("/api/tasks/invalid")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/tasks/:taskId/toggle-status", () => {
    it("should toggle task from TODO to DONE", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { status: "TODO" });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/toggle-status`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Task status toggled successfully");
      expect(response.body.data.status).toBe("DONE");
    });

    it("should toggle task from DONE to TODO", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { status: "DONE" });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/toggle-status`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.status).toBe("TODO");
    });

    it("should toggle IN_PROGRESS to DONE", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);
      const task = await createTestTask(user.id, { status: "IN_PROGRESS" });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/toggle-status`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.status).toBe("DONE");
    });

    it("should return 404 for non-existent task", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const response = await request(app)
        .patch("/api/tasks/99999/toggle-status")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 404 when toggling another user's task", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      const task = await createTestTask(user2.id);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/toggle-status`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(response.body.message).toContain("not found");
    });

    it("should return 401 when not authenticated", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/toggle-status`)
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("Task Isolation & Authorization", () => {
    it("should not allow user to access another user's tasks", async () => {
      const user1 = await createTestUser({ email: "user1@example.com" });
      const user2 = await createTestUser({ email: "user2@example.com" });
      const token1 = generateAuthToken(user1.id, user1.email);

      // User 2 creates tasks
      const task1 = await createTestTask(user2.id, {
        taskName: "User 2 Task 1",
      });
      const task2 = await createTestTask(user2.id, {
        taskName: "User 2 Task 2",
      });

      // User 1 tries to fetch all tasks
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // Should not see user 2's tasks
      expect(response.body.data).toHaveLength(0);
    });

    it("should ensure task authorId matches authenticated user", async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user.id, user.email);

      const taskData = {
        taskName: "New Task",
        // Not providing authorId - should be set automatically
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      // Verify authorId is set to authenticated user
      expect(response.body.data.authorId).toBe(user.id);
    });
  });
});
