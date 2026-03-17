import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamsSchema,
  toggleStatusBodySchema,
} from "../../../src/schemas/task.schema";

describe("Task Schemas", () => {
  describe("createTaskSchema", () => {
    const validTaskData = {
      taskName: "Complete project",
      description: "Finish the backend implementation",
      status: "TODO" as const,
      priority: "HIGH" as const,
    };

    it("should accept valid task data with all fields", () => {
      const result = createTaskSchema.parse(validTaskData);

      expect(result.taskName).toBe(validTaskData.taskName);
      expect(result.description).toBe(validTaskData.description);
      expect(result.status).toBe(validTaskData.status);
      expect(result.priority).toBe(validTaskData.priority);
    });

    it("should accept minimal task data (only taskName)", () => {
      const minimal = { taskName: "Simple task" };

      const result = createTaskSchema.parse(minimal);

      expect(result.taskName).toBe("Simple task");
      expect(result.status).toBe("TODO"); // Default value
      expect(result.priority).toBe("LOW"); // Default value
    });

    it("should apply default status TODO", () => {
      const result = createTaskSchema.parse({ taskName: "Test" });

      expect(result.status).toBe("TODO");
    });

    it("should apply default priority LOW", () => {
      const result = createTaskSchema.parse({ taskName: "Test" });

      expect(result.priority).toBe("LOW");
    });

    it("should accept optional dueDate as ISO string", () => {
      const withDueDate = {
        ...validTaskData,
        dueDate: "2024-12-31T23:59:59Z",
      };

      const result = createTaskSchema.parse(withDueDate);

      expect(result.dueDate).toBe("2024-12-31T23:59:59Z");
    });

    it("should accept empty string for dueDate", () => {
      const withEmptyDate = {
        ...validTaskData,
        dueDate: "",
      };

      const result = createTaskSchema.parse(withEmptyDate);

      expect(result.dueDate).toBe("");
    });

    it("should accept optional listId", () => {
      const withList = {
        ...validTaskData,
        listId: 5,
      };

      const result = createTaskSchema.parse(withList);

      expect(result.listId).toBe(5);
    });

    it("should reject empty taskName", () => {
      expect(() => createTaskSchema.parse({ taskName: "" })).toThrow();
    });

    it("should reject taskName longer than 100 characters", () => {
      const longName = "a".repeat(101);

      expect(() => createTaskSchema.parse({ taskName: longName })).toThrow();
    });

    it("should accept taskName exactly 100 characters", () => {
      const maxName = "a".repeat(100);

      const result = createTaskSchema.parse({ taskName: maxName });

      expect(result.taskName).toBe(maxName);
    });

    it("should reject description longer than 200 characters", () => {
      const longDesc = "a".repeat(201);

      expect(() =>
        createTaskSchema.parse({ taskName: "Test", description: longDesc }),
      ).toThrow();
    });

    it("should accept description exactly 200 characters", () => {
      const maxDesc = "a".repeat(200);

      const result = createTaskSchema.parse({
        taskName: "Test",
        description: maxDesc,
      });

      expect(result.description).toBe(maxDesc);
    });

    it("should reject invalid status values", () => {
      const invalid = { taskName: "Test", status: "INVALID" as any };

      expect(() => createTaskSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid priority values", () => {
      const invalid = { taskName: "Test", priority: "URGENT" as any };

      expect(() => createTaskSchema.parse(invalid)).toThrow();
    });

    it("should reject non-positive listId", () => {
      expect(() =>
        createTaskSchema.parse({ taskName: "Test", listId: 0 }),
      ).toThrow();
      expect(() =>
        createTaskSchema.parse({ taskName: "Test", listId: -1 }),
      ).toThrow();
    });

    it("should reject decimal listId", () => {
      expect(() =>
        createTaskSchema.parse({ taskName: "Test", listId: 1.5 }),
      ).toThrow();
    });
  });

  describe("updateTaskSchema", () => {
    it("should accept partial updates with id and single field", () => {
      const updates = [
        { id: 1, taskName: "Updated Name" },
        { id: 2, description: "Updated description" },
        { id: 3, status: "DONE" as const },
        { id: 4, priority: "HIGH" as const },
      ];

      updates.forEach((update) => {
        const result = updateTaskSchema.parse(update);
        expect(result).toEqual(update);
      });
    });

    it("should accept id with multiple update fields", () => {
      const update = {
        id: 1,
        taskName: "New name",
        description: "New description",
        status: "IN_PROGRESS" as const,
      };

      const result = updateTaskSchema.parse(update);

      expect(result).toEqual(update);
    });

    it("should reject update with only id (no updates)", () => {
      expect(() => updateTaskSchema.parse({ id: 1 })).toThrow();
    });

    it("should reject missing id", () => {
      expect(() => updateTaskSchema.parse({ taskName: "Test" })).toThrow();
    });

    it("should reject non-positive id", () => {
      expect(() =>
        updateTaskSchema.parse({ id: 0, taskName: "Test" }),
      ).toThrow();
      expect(() =>
        updateTaskSchema.parse({ id: -1, taskName: "Test" }),
      ).toThrow();
    });

    it("should reject empty taskName", () => {
      expect(() => updateTaskSchema.parse({ id: 1, taskName: "" })).toThrow();
    });

    it("should reject taskName longer than 100 characters", () => {
      const longName = "a".repeat(101);

      expect(() =>
        updateTaskSchema.parse({ id: 1, taskName: longName }),
      ).toThrow();
    });

    it("should reject description longer than 200 characters", () => {
      const longDesc = "a".repeat(201);

      expect(() =>
        updateTaskSchema.parse({ id: 1, description: longDesc }),
      ).toThrow();
    });

    it("should accept empty string for dueDate", () => {
      const result = updateTaskSchema.parse({ id: 1, dueDate: "" });

      expect(result.dueDate).toBe("");
    });

    it("should accept valid ISO date for dueDate", () => {
      const result = updateTaskSchema.parse({
        id: 1,
        dueDate: "2024-12-31T00:00:00Z",
      });

      expect(result.dueDate).toBe("2024-12-31T00:00:00Z");
    });

    it("should reject invalid status", () => {
      expect(() =>
        updateTaskSchema.parse({ id: 1, status: "INVALID" as any }),
      ).toThrow();
    });

    it("should reject invalid priority", () => {
      expect(() =>
        updateTaskSchema.parse({ id: 1, priority: "CRITICAL" as any }),
      ).toThrow();
    });

    it("should reject non-positive listId", () => {
      expect(() => updateTaskSchema.parse({ id: 1, listId: 0 })).toThrow();
      expect(() => updateTaskSchema.parse({ id: 1, listId: -5 })).toThrow();
    });
  });

  describe("taskIdParamsSchema", () => {
    it("should accept valid numeric string taskId", () => {
      const result1 = taskIdParamsSchema.parse({ taskId: "1" });
      expect(result1.taskId).toBe(1);

      const result2 = taskIdParamsSchema.parse({ taskId: "12345" });
      expect(result2.taskId).toBe(12345);
    });

    it("should reject zero", () => {
      expect(() => taskIdParamsSchema.parse({ taskId: "0" })).toThrow();
    });

    it("should reject negative numbers", () => {
      expect(() => taskIdParamsSchema.parse({ taskId: "-1" })).toThrow();
    });

    it("should reject non-numeric strings", () => {
      expect(() => taskIdParamsSchema.parse({ taskId: "abc" })).toThrow();
      expect(() => taskIdParamsSchema.parse({ taskId: "1.5" })).toThrow();
      expect(() => taskIdParamsSchema.parse({ taskId: "" })).toThrow();
    });

    it("should accept strings with spaces (coerced)", () => {
      // z.coerce.number() handles whitespace automatically
      const result = taskIdParamsSchema.parse({ taskId: " 456 " });
      expect(result.taskId).toBe(456);
    });
  });

  describe("toggleStatusBodySchema", () => {
    it("should accept valid status values", () => {
      const statuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

      statuses.forEach((status) => {
        const result = toggleStatusBodySchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it("should reject invalid status", () => {
      expect(() =>
        toggleStatusBodySchema.parse({ status: "INVALID" }),
      ).toThrow();
      expect(() =>
        toggleStatusBodySchema.parse({ status: "completed" }),
      ).toThrow();
    });

    it("should reject missing status", () => {
      expect(() => toggleStatusBodySchema.parse({})).toThrow();
    });

    it("should reject empty status", () => {
      expect(() => toggleStatusBodySchema.parse({ status: "" })).toThrow();
    });
  });
});
