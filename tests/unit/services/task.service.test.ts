import { describe, it, expect } from "vitest";
import * as TaskService from "../../../src/services/task.service";
import {
  createTestUser,
  createTestTask,
  createTestList,
} from "../../helpers/test-factories";
import { prisma } from "../../../src/config/database";

describe("TaskService", () => {
  describe("fetchUserTasks", () => {
    it("should return all tasks for a user", async () => {
      const user = await createTestUser();
      await createTestTask(user.id, { taskName: "Task 1" });
      await createTestTask(user.id, { taskName: "Task 2" });
      await createTestTask(user.id, { taskName: "Task 3" });

      const tasks = await TaskService.fetchUserTasks(user.id);

      expect(tasks).toHaveLength(3);
      expect(tasks.map((t) => t.taskName)).toContain("Task 1");
      expect(tasks.map((t) => t.taskName)).toContain("Task 2");
      expect(tasks.map((t) => t.taskName)).toContain("Task 3");
    });

    it("should return empty array when user has no tasks", async () => {
      const user = await createTestUser();

      const tasks = await TaskService.fetchUserTasks(user.id);

      expect(tasks).toHaveLength(0);
      expect(tasks).toEqual([]);
    });

    it("should return only tasks belonging to the user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createTestTask(user1.id, { taskName: "User 1 Task" });
      await createTestTask(user2.id, { taskName: "User 2 Task" });

      const user1Tasks = await TaskService.fetchUserTasks(user1.id);

      expect(user1Tasks).toHaveLength(1);
      expect(user1Tasks[0].taskName).toBe("User 1 Task");
      expect(user1Tasks[0].authorId).toBe(user1.id);
    });

    it("should return tasks in descending order (most recent first)", async () => {
      const user = await createTestUser();
      const task1 = await createTestTask(user.id, { taskName: "First" });
      const task2 = await createTestTask(user.id, { taskName: "Second" });
      const task3 = await createTestTask(user.id, { taskName: "Third" });

      const tasks = await TaskService.fetchUserTasks(user.id);

      // Most recent (highest ID) should be first
      expect(tasks[0].id).toBeGreaterThan(tasks[1].id);
      expect(tasks[1].id).toBeGreaterThan(tasks[2].id);
      expect(tasks[0].taskName).toBe("Third");
      expect(tasks[2].taskName).toBe("First");
    });

    it("should throw error for non-existent user", async () => {
      await expect(TaskService.fetchUserTasks(99999)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("createTask", () => {
    it("should create a task with required fields", async () => {
      const user = await createTestUser();

      const task = await TaskService.createTask({
        taskName: "New Task",
        authorId: user.id,
      });

      expect(task).toBeDefined();
      expect(task.taskName).toBe("New Task");
      expect(task.authorId).toBe(user.id);
      expect(task.status).toBe("TODO"); // Default
      expect(task.priority).toBe("LOW"); // Default
    });

    it("should create task with all fields", async () => {
      const user = await createTestUser();
      const dueDate = new Date("2026-12-31");

      const task = await TaskService.createTask({
        taskName: "Complete Task",
        description: "Full description",
        status: "IN_PROGRESS",
        dueDate,
        priority: "HIGH",
        authorId: user.id,
      });

      expect(task.taskName).toBe("Complete Task");
      expect(task.description).toBe("Full description");
      expect(task.status).toBe("IN_PROGRESS");
      expect(task.dueDate?.toISOString()).toBe(dueDate.toISOString());
      expect(task.priority).toBe("HIGH");
    });

    it("should create task with listId", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const task = await TaskService.createTask({
        taskName: "Task in List",
        authorId: user.id,
        listId: list.id,
      });

      expect(task.listId).toBe(list.id);
    });

    it("should set description to null when not provided", async () => {
      const user = await createTestUser();

      const task = await TaskService.createTask({
        taskName: "No Description",
        authorId: user.id,
      });

      expect(task.description).toBeNull();
    });

    it("should set dueDate to null when not provided", async () => {
      const user = await createTestUser();

      const task = await TaskService.createTask({
        taskName: "No Due Date",
        authorId: user.id,
      });

      expect(task.dueDate).toBeNull();
    });

    it("should parse string dueDate to Date", async () => {
      const user = await createTestUser();

      const task = await TaskService.createTask({
        taskName: "String Date",
        authorId: user.id,
        dueDate: "2026-06-15",
      });

      expect(task.dueDate).toBeInstanceOf(Date);
      expect(task.dueDate?.toISOString()).toContain("2026-06-15");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        TaskService.createTask({
          taskName: "Ghost Task",
          authorId: 99999,
        }),
      ).rejects.toThrow("User not found");
    });

    it("should throw error if listId doesn't belong to user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const user2List = await createTestList(user2.id);

      await expect(
        TaskService.createTask({
          taskName: "Wrong List",
          authorId: user1.id,
          listId: user2List.id,
        }),
      ).rejects.toThrow("List not found or does not belong to user");
    });

    it("should throw error for non-existent listId", async () => {
      const user = await createTestUser();

      await expect(
        TaskService.createTask({
          taskName: "Fake List",
          authorId: user.id,
          listId: 99999,
        }),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });

  describe("updateTask", () => {
    it("should update task name", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { taskName: "Original" });

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        taskName: "Updated Name",
      });

      expect(updated.taskName).toBe("Updated Name");
      expect(updated.id).toBe(task.id);
    });

    it("should update task description", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        description: "New Description",
      });

      expect(updated.description).toBe("New Description");
    });

    it("should update task status", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { status: "TODO" });

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        status: "DONE",
      });

      expect(updated.status).toBe("DONE");
    });

    it("should update task priority", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { priority: "LOW" });

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        priority: "HIGH",
      });

      expect(updated.priority).toBe("HIGH");
    });

    it("should update task dueDate", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);
      const newDate = new Date("2026-07-01");

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        dueDate: newDate,
      });

      expect(updated.dueDate?.toISOString()).toBe(newDate.toISOString());
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        taskName: "Multi Update",
        status: "IN_PROGRESS",
        priority: "HIGH",
      });

      expect(updated.taskName).toBe("Multi Update");
      expect(updated.status).toBe("IN_PROGRESS");
      expect(updated.priority).toBe("HIGH");
    });

    it("should connect task to a list", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { listId: undefined });
      const list = await createTestList(user.id);

      const updated = await TaskService.updateTask({
        id: task.id,
        authorId: user.id,
        listId: list.id,
      });

      expect(updated.listId).toBe(list.id);
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await expect(
        TaskService.updateTask({
          id: task.id,
          authorId: 99999,
          taskName: "Updated",
        }),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for non-existent task", async () => {
      const user = await createTestUser();

      await expect(
        TaskService.updateTask({
          id: 99999,
          authorId: user.id,
          taskName: "Updated",
        }),
      ).rejects.toThrow("Task not found or does not belong to user");
    });

    it("should throw error when updating another user's task", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const task = await createTestTask(user1.id);

      await expect(
        TaskService.updateTask({
          id: task.id,
          authorId: user2.id,
          taskName: "Hijack Attempt",
        }),
      ).rejects.toThrow("Task not found or does not belong to user");
    });

    it("should throw error when assigning to another user's list", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const task = await createTestTask(user1.id);
      const user2List = await createTestList(user2.id);

      await expect(
        TaskService.updateTask({
          id: task.id,
          authorId: user1.id,
          listId: user2List.id,
        }),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });

  describe("deleteTaskById", () => {
    it("should delete a task", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await TaskService.deleteTaskById(user.id, task.id);

      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await expect(TaskService.deleteTaskById(99999, task.id)).rejects.toThrow(
        "User not found",
      );
    });

    it("should throw error for non-existent task", async () => {
      const user = await createTestUser();

      await expect(TaskService.deleteTaskById(user.id, 99999)).rejects.toThrow(
        "Task not found or does not belong to user",
      );
    });

    it("should throw error when deleting another user's task", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const task = await createTestTask(user1.id);

      await expect(
        TaskService.deleteTaskById(user2.id, task.id),
      ).rejects.toThrow("Task not found or does not belong to user");
    });

    it("should not affect other tasks", async () => {
      const user = await createTestUser();
      const task1 = await createTestTask(user.id);
      const task2 = await createTestTask(user.id);

      await TaskService.deleteTaskById(user.id, task1.id);

      const remainingTask = await prisma.task.findUnique({
        where: { id: task2.id },
      });
      expect(remainingTask).toBeDefined();
    });
  });

  describe("toggleTaskStatus", () => {
    it("should toggle TODO to DONE", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { status: "TODO" });

      const toggled = await TaskService.toggleTaskStatus(user.id, task.id);

      expect(toggled.status).toBe("DONE");
    });

    it("should toggle DONE to TODO", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { status: "DONE" });

      const toggled = await TaskService.toggleTaskStatus(user.id, task.id);

      expect(toggled.status).toBe("TODO");
    });

    it("should change IN_PROGRESS to DONE", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { status: "IN_PROGRESS" });

      const toggled = await TaskService.toggleTaskStatus(user.id, task.id);

      expect(toggled.status).toBe("DONE");
    });

    it("should toggle multiple times correctly", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { status: "TODO" });

      const toggle1 = await TaskService.toggleTaskStatus(user.id, task.id);
      expect(toggle1.status).toBe("DONE");

      const toggle2 = await TaskService.toggleTaskStatus(user.id, task.id);
      expect(toggle2.status).toBe("TODO");

      const toggle3 = await TaskService.toggleTaskStatus(user.id, task.id);
      expect(toggle3.status).toBe("DONE");
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await expect(
        TaskService.toggleTaskStatus(99999, task.id),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for non-existent task", async () => {
      const user = await createTestUser();

      await expect(
        TaskService.toggleTaskStatus(user.id, 99999),
      ).rejects.toThrow("Task not found or does not belong to user");
    });

    it("should throw error when toggling another user's task", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const task = await createTestTask(user1.id);

      await expect(
        TaskService.toggleTaskStatus(user2.id, task.id),
      ).rejects.toThrow("Task not found or does not belong to user");
    });
  });

  describe("getTaskById", () => {
    it("should get a task by ID", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id, { taskName: "Find Me" });

      const found = await TaskService.getTaskById(user.id, task.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(task.id);
      expect(found?.taskName).toBe("Find Me");
      expect(found?.authorId).toBe(user.id);
    });

    it("should return null for non-existent task", async () => {
      const user = await createTestUser();

      const found = await TaskService.getTaskById(user.id, 99999);

      expect(found).toBeNull();
    });

    it("should return null when getting another user's task", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const task = await createTestTask(user1.id);

      const found = await TaskService.getTaskById(user2.id, task.id);

      expect(found).toBeNull();
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const task = await createTestTask(user.id);

      await expect(TaskService.getTaskById(99999, task.id)).rejects.toThrow(
        "User not found",
      );
    });

    it("should return task with all fields", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);
      const dueDate = new Date("2026-08-01");

      const task = await createTestTask(user.id, {
        taskName: "Complete Task",
        description: "Full description",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate,
        listId: list.id,
      });

      const found = await TaskService.getTaskById(user.id, task.id);

      expect(found?.taskName).toBe("Complete Task");
      expect(found?.description).toBe("Full description");
      expect(found?.status).toBe("IN_PROGRESS");
      expect(found?.priority).toBe("HIGH");
      expect(found?.dueDate?.toISOString()).toBe(dueDate.toISOString());
      expect(found?.listId).toBe(list.id);
      expect(found?.archived).toBe(false);
    });
  });
});
