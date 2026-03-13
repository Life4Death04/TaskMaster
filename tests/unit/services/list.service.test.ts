import { describe, it, expect } from "vitest";
import * as ListService from "../../../src/services/list.service";
import {
  createTestUser,
  createTestList,
  createTestTask,
} from "../../helpers/test-factories";
import { prisma } from "../../../src/config/database";

describe("ListService", () => {
  describe("createList", () => {
    it("should create a list with required fields", async () => {
      const user = await createTestUser();

      const list = await ListService.createList({
        title: "My List",
        authorId: user.id,
      });

      expect(list).toBeDefined();
      expect(list.title).toBe("My List");
      expect(list.authorId).toBe(user.id);
      expect(list.color).toBe("#000000"); // Default color
      expect(list.isFavorite).toBe(false);
      expect(list.description).toBeNull();
    });

    it("should create list with all optional fields", async () => {
      const user = await createTestUser();

      const list = await ListService.createList({
        title: "Complete List",
        description: "List description",
        color: "#FF5733",
        authorId: user.id,
      });

      expect(list.title).toBe("Complete List");
      expect(list.description).toBe("List description");
      expect(list.color).toBe("#FF5733");
      expect(list.authorId).toBe(user.id);
    });

    it("should set description to null when not provided", async () => {
      const user = await createTestUser();

      const list = await ListService.createList({
        title: "No Description",
        authorId: user.id,
      });

      expect(list.description).toBeNull();
    });

    it("should use default color when not provided", async () => {
      const user = await createTestUser();

      const list = await ListService.createList({
        title: "Default Color",
        authorId: user.id,
      });

      expect(list.color).toBe("#000000");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        ListService.createList({
          title: "Ghost List",
          authorId: 99999,
        }),
      ).rejects.toThrow("User not found");
    });

    it("should allow multiple lists with same title for same user", async () => {
      const user = await createTestUser();

      const list1 = await ListService.createList({
        title: "Duplicate Title",
        authorId: user.id,
      });

      const list2 = await ListService.createList({
        title: "Duplicate Title",
        authorId: user.id,
      });

      expect(list1.title).toBe(list2.title);
      expect(list1.id).not.toBe(list2.id);
    });
  });

  describe("getListsByUserId", () => {
    it("should return all lists for a user", async () => {
      const user = await createTestUser();
      await createTestList(user.id, { title: "List 1" });
      await createTestList(user.id, { title: "List 2" });
      await createTestList(user.id, { title: "List 3" });

      const lists = await ListService.getListsByUserId(user.id);

      expect(lists).toHaveLength(3);
      expect(lists.map((l) => l.title)).toContain("List 1");
      expect(lists.map((l) => l.title)).toContain("List 2");
      expect(lists.map((l) => l.title)).toContain("List 3");
    });

    it("should return empty array when user has no lists", async () => {
      const user = await createTestUser();

      const lists = await ListService.getListsByUserId(user.id);

      expect(lists).toHaveLength(0);
      expect(lists).toEqual([]);
    });

    it("should include tasks in each list", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);
      await createTestTask(user.id, { listId: list.id });
      await createTestTask(user.id, { listId: list.id });

      const lists = await ListService.getListsByUserId(user.id);

      expect(lists[0].tasks).toHaveLength(2);
      expect(lists[0].tasks[0]).toHaveProperty("taskName");
    });

    it("should include empty tasks array for lists without tasks", async () => {
      const user = await createTestUser();
      await createTestList(user.id);

      const lists = await ListService.getListsByUserId(user.id);

      expect(lists[0].tasks).toHaveLength(0);
      expect(lists[0].tasks).toEqual([]);
    });

    it("should return only lists belonging to the user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createTestList(user1.id, { title: "User 1 List" });
      await createTestList(user2.id, { title: "User 2 List" });

      const user1Lists = await ListService.getListsByUserId(user1.id);

      expect(user1Lists).toHaveLength(1);
      expect(user1Lists[0].title).toBe("User 1 List");
      expect(user1Lists[0].authorId).toBe(user1.id);
    });

    it("should return lists in descending order (most recent first)", async () => {
      const user = await createTestUser();
      const list1 = await createTestList(user.id, { title: "First" });
      const list2 = await createTestList(user.id, { title: "Second" });
      const list3 = await createTestList(user.id, { title: "Third" });

      const lists = await ListService.getListsByUserId(user.id);

      // Most recent (highest ID) should be first
      expect(lists[0].id).toBeGreaterThan(lists[1].id);
      expect(lists[1].id).toBeGreaterThan(lists[2].id);
      expect(lists[0].title).toBe("Third");
      expect(lists[2].title).toBe("First");
    });

    it("should throw error for non-existent user", async () => {
      await expect(ListService.getListsByUserId(99999)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getSingleListById", () => {
    it("should get a single list by ID", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { title: "Single List" });

      const found = await ListService.getSingleListById(list.id, user.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(list.id);
      expect(found.title).toBe("Single List");
      expect(found.authorId).toBe(user.id);
    });

    it("should include tasks in the list", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);
      await createTestTask(user.id, { listId: list.id, taskName: "Task 1" });
      await createTestTask(user.id, { listId: list.id, taskName: "Task 2" });

      const found = await ListService.getSingleListById(list.id, user.id);

      expect(found.tasks).toHaveLength(2);
      expect(found.tasks[0]).toHaveProperty("taskName");
      expect(found.tasks.map((t) => t.taskName)).toContain("Task 1");
      expect(found.tasks.map((t) => t.taskName)).toContain("Task 2");
    });

    it("should include empty tasks array when list has no tasks", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const found = await ListService.getSingleListById(list.id, user.id);

      expect(found.tasks).toHaveLength(0);
      expect(found.tasks).toEqual([]);
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await expect(
        ListService.getSingleListById(list.id, 99999),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for non-existent list", async () => {
      const user = await createTestUser();

      await expect(
        ListService.getSingleListById(99999, user.id),
      ).rejects.toThrow("List not found or does not belong to user");
    });

    it("should throw error when getting another user's list", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const list = await createTestList(user1.id);

      await expect(
        ListService.getSingleListById(list.id, user2.id),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });

  describe("updateListById", () => {
    it("should update list title", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { title: "Original" });

      const updated = await ListService.updateListById({
        id: list.id,
        userId: user.id,
        title: "Updated Title",
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.id).toBe(list.id);
    });

    it("should update list description", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { description: "Old" });

      const updated = await ListService.updateListById({
        id: list.id,
        userId: user.id,
        description: "New Description",
      });

      expect(updated.description).toBe("New Description");
    });

    it("should update list color", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { color: "#000000" });

      const updated = await ListService.updateListById({
        id: list.id,
        userId: user.id,
        color: "#FF5733",
      });

      expect(updated.color).toBe("#FF5733");
    });

    it("should update multiple fields at once", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      const updated = await ListService.updateListById({
        id: list.id,
        userId: user.id,
        title: "Multi Update",
        description: "New Description",
        color: "#123456",
      });

      expect(updated.title).toBe("Multi Update");
      expect(updated.description).toBe("New Description");
      expect(updated.color).toBe("#123456");
    });

    it("should only update provided fields", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, {
        title: "Original",
        description: "Original Desc",
        color: "#000000",
      });

      const updated = await ListService.updateListById({
        id: list.id,
        userId: user.id,
        title: "Updated Title Only",
      });

      expect(updated.title).toBe("Updated Title Only");
      expect(updated.description).toBe("Original Desc"); // Unchanged
      expect(updated.color).toBe("#000000"); // Unchanged
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await expect(
        ListService.updateListById({
          id: list.id,
          userId: 99999,
          title: "Updated",
        }),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for non-existent list", async () => {
      const user = await createTestUser();

      await expect(
        ListService.updateListById({
          id: 99999,
          userId: user.id,
          title: "Updated",
        }),
      ).rejects.toThrow("List not found or does not belong to user");
    });

    it("should throw error when updating another user's list", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const list = await createTestList(user1.id);

      await expect(
        ListService.updateListById({
          id: list.id,
          userId: user2.id,
          title: "Hijack Attempt",
        }),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });

  describe("deleteListById", () => {
    it("should delete a list", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await ListService.deleteListById(list.id, user.id);

      const deletedList = await prisma.list.findUnique({
        where: { id: list.id },
      });
      expect(deletedList).toBeNull();
    });

    it("should cascade delete tasks in the list", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);
      const task1 = await createTestTask(user.id, { listId: list.id });
      const task2 = await createTestTask(user.id, { listId: list.id });

      await ListService.deleteListById(list.id, user.id);

      const [deletedTask1, deletedTask2] = await Promise.all([
        prisma.task.findUnique({ where: { id: task1.id } }),
        prisma.task.findUnique({ where: { id: task2.id } }),
      ]);

      expect(deletedTask1).toBeNull();
      expect(deletedTask2).toBeNull();
    });

    it("should not delete tasks without a listId", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);
      const taskInList = await createTestTask(user.id, { listId: list.id });
      const taskWithoutList = await createTestTask(user.id, { listId: null });

      await ListService.deleteListById(list.id, user.id);

      const stillExists = await prisma.task.findUnique({
        where: { id: taskWithoutList.id },
      });
      const deleted = await prisma.task.findUnique({
        where: { id: taskInList.id },
      });

      expect(stillExists).toBeDefined();
      expect(deleted).toBeNull();
    });

    it("should not affect other lists", async () => {
      const user = await createTestUser();
      const list1 = await createTestList(user.id, { title: "Keep Me" });
      const list2 = await createTestList(user.id, { title: "Delete Me" });

      await ListService.deleteListById(list2.id, user.id);

      const remainingList = await prisma.list.findUnique({
        where: { id: list1.id },
      });
      expect(remainingList).toBeDefined();
      expect(remainingList?.title).toBe("Keep Me");
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await expect(ListService.deleteListById(list.id, 99999)).rejects.toThrow(
        "User not found",
      );
    });

    it("should throw error for non-existent list", async () => {
      const user = await createTestUser();

      await expect(ListService.deleteListById(99999, user.id)).rejects.toThrow(
        "List not found or does not belong to user",
      );
    });

    it("should throw error when deleting another user's list", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const list = await createTestList(user1.id);

      await expect(
        ListService.deleteListById(list.id, user2.id),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });

  describe("toggleListFavorite", () => {
    it("should toggle isFavorite from false to true", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { isFavorite: false });

      const toggled = await ListService.toggleListFavorite(list.id, user.id);

      expect(toggled.isFavorite).toBe(true);
    });

    it("should toggle isFavorite from true to false", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { isFavorite: true });

      const toggled = await ListService.toggleListFavorite(list.id, user.id);

      expect(toggled.isFavorite).toBe(false);
    });

    it("should toggle multiple times correctly", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, { isFavorite: false });

      const toggle1 = await ListService.toggleListFavorite(list.id, user.id);
      expect(toggle1.isFavorite).toBe(true);

      const toggle2 = await ListService.toggleListFavorite(list.id, user.id);
      expect(toggle2.isFavorite).toBe(false);

      const toggle3 = await ListService.toggleListFavorite(list.id, user.id);
      expect(toggle3.isFavorite).toBe(true);
    });

    it("should not affect other list properties", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id, {
        title: "My List",
        description: "Description",
        color: "#FF5733",
        isFavorite: false,
      });

      const toggled = await ListService.toggleListFavorite(list.id, user.id);

      expect(toggled.title).toBe("My List");
      expect(toggled.description).toBe("Description");
      expect(toggled.color).toBe("#FF5733");
      expect(toggled.isFavorite).toBe(true); // Only this changed
    });

    it("should throw error for non-existent user", async () => {
      const user = await createTestUser();
      const list = await createTestList(user.id);

      await expect(
        ListService.toggleListFavorite(list.id, 99999),
      ).rejects.toThrow("User not found");
    });

    it("should throw error for non-existent list", async () => {
      const user = await createTestUser();

      await expect(
        ListService.toggleListFavorite(99999, user.id),
      ).rejects.toThrow("List not found or does not belong to user");
    });

    it("should throw error when toggling another user's list", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const list = await createTestList(user1.id);

      await expect(
        ListService.toggleListFavorite(list.id, user2.id),
      ).rejects.toThrow("List not found or does not belong to user");
    });
  });
});
