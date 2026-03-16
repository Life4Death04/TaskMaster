import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";

describe("E2E - Complex Task Management Scenarios", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it("should handle task lifecycle: create → in-progress → done → archive", async () => {
    // Register and login
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "lifecycle@example.com",
        password: "password123",
        firstName: "Life",
        lastName: "Cycle",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Create task
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Important project",
        description: "Complete by end of week",
        priority: "HIGH",
        status: "TODO",
        dueDate: new Date("2026-12-31").toISOString(),
      })
      .expect(201);

    const taskId = createResponse.body.data.id;
    expect(createResponse.body.data.status).toBe("TODO");
    expect(createResponse.body.data.archived).toBe(false);

    // Update to IN_PROGRESS
    const inProgressResponse = await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: taskId,
        status: "IN_PROGRESS",
      })
      .expect(200);

    expect(inProgressResponse.body.data.status).toBe("IN_PROGRESS");

    // Toggle to DONE
    const doneResponse = await request(app)
      .patch(`/api/tasks/${taskId}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(doneResponse.body.data.status).toBe("DONE");

    // Archive the completed task
    const archiveResponse = await request(app)
      .patch(`/api/tasks/${taskId}/toggle-archived`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(archiveResponse.body.data.archived).toBe(true);
    expect(archiveResponse.body.data.status).toBe("DONE");

    // Verify final state
    const finalTaskResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalTaskResponse.body.data.status).toBe("DONE");
    expect(finalTaskResponse.body.data.archived).toBe(true);
  });

  it("should handle complex list and task organization", async () => {
    // Register user
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "complex@example.com",
        password: "password123",
        firstName: "Complex",
        lastName: "User",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Create multiple lists
    const urgentList = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Urgent",
        color: "#FF0000",
      })
      .expect(201);

    const urgentListId = urgentList.body.list.id;

    const todayList = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Today",
        color: "#FFA500",
      })
      .expect(201);

    const todayListId = todayList.body.list.id;

    const laterList = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Later",
        color: "#0000FF",
      })
      .expect(201);

    const laterListId = laterList.body.list.id;

    // Mark urgent as favorite
    await request(app)
      .patch(`/api/lists/${urgentListId}/favorite`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Create tasks in different lists
    const urgentTasks = [];
    for (let i = 1; i <= 3; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          taskName: `Urgent Task ${i}`,
          listId: urgentListId,
          priority: "HIGH",
          status: "TODO",
        })
        .expect(201);
      urgentTasks.push(response.body.data.id);
    }

    const todayTasks = [];
    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          taskName: `Today Task ${i}`,
          listId: todayListId,
          priority: "MEDIUM",
          status: "TODO",
        })
        .expect(201);
      todayTasks.push(response.body.data.id);
    }

    // Create some tasks without list
    for (let i = 1; i <= 2; i++) {
      await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          taskName: `Unorganized Task ${i}`,
          priority: "LOW",
        })
        .expect(201);
    }

    // Verify urgent list has 3 tasks
    const urgentListDetails = await request(app)
      .get(`/api/lists/${urgentListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(urgentListDetails.body.list.tasks).toHaveLength(3);
    expect(urgentListDetails.body.list.isFavorite).toBe(true);

    // Complete some urgent tasks
    await request(app)
      .patch(`/api/tasks/${urgentTasks[0]}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .patch(`/api/tasks/${urgentTasks[1]}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Move a today task to later
    await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: todayTasks[0],
        listId: laterListId,
      })
      .expect(200);

    // Verify today list now has 4 tasks
    const todayListDetails = await request(app)
      .get(`/api/lists/${todayListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(todayListDetails.body.list.tasks).toHaveLength(4);

    // Verify later list has 1 task
    const laterListDetails = await request(app)
      .get(`/api/lists/${laterListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(laterListDetails.body.list.tasks).toHaveLength(1);

    // Get all tasks and verify counts
    const allTasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(allTasksResponse.body.data).toHaveLength(10); // 3 urgent + 5 today + 2 unorganized

    // Delete today list (should cascade delete 4 tasks)
    await request(app)
      .delete(`/api/lists/${todayListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Verify only 6 tasks remain
    const finalTasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalTasksResponse.body.data).toHaveLength(6); // 3 urgent + 1 later + 2 unorganized
  });

  it("should handle task priority and status transitions", async () => {
    // Register user
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "priority@example.com",
        password: "password123",
        firstName: "Priority",
        lastName: "Test",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Create task with LOW priority
    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Test task",
        priority: "LOW",
        status: "TODO",
      })
      .expect(201);

    const taskId = createResponse.body.data.id;

    // Escalate priority: LOW → MEDIUM
    const mediumResponse = await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: taskId,
        priority: "MEDIUM",
      })
      .expect(200);

    expect(mediumResponse.body.data.priority).toBe("MEDIUM");

    // Escalate priority: MEDIUM → HIGH
    const highResponse = await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: taskId,
        priority: "HIGH",
      })
      .expect(200);

    expect(highResponse.body.data.priority).toBe("HIGH");

    // Test status transitions: TODO → IN_PROGRESS → DONE
    await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: taskId,
        status: "IN_PROGRESS",
      })
      .expect(200);

    // Toggle to DONE
    const doneResponse = await request(app)
      .patch(`/api/tasks/${taskId}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(doneResponse.body.data.status).toBe("DONE");

    // Toggle back to TODO
    const todoResponse = await request(app)
      .patch(`/api/tasks/${taskId}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(todoResponse.body.data.status).toBe("TODO");
  });

  it("should handle batch operations efficiently", async () => {
    // Register user
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "batch@example.com",
        password: "password123",
        firstName: "Batch",
        lastName: "User",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Create 20 tasks
    const taskIds = [];
    for (let i = 1; i <= 20; i++) {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          taskName: `Task ${i}`,
          priority: i % 3 === 0 ? "HIGH" : i % 2 === 0 ? "MEDIUM" : "LOW",
          status: "TODO",
        })
        .expect(201);
      taskIds.push(response.body.data.id);
    }

    // Verify all 20 tasks exist
    const allTasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(allTasksResponse.body.data).toHaveLength(20);

    // Mark first 10 as done
    for (let i = 0; i < 10; i++) {
      await request(app)
        .patch(`/api/tasks/${taskIds[i]}/toggle-status`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    }

    // Archive first 5
    for (let i = 0; i < 5; i++) {
      await request(app)
        .patch(`/api/tasks/${taskIds[i]}/toggle-archived`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    }

    // Delete last 5
    for (let i = 15; i < 20; i++) {
      await request(app)
        .delete(`/api/tasks/${taskIds[i]}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    }

    // Verify 15 tasks remain
    const finalTasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalTasksResponse.body.data).toHaveLength(15);
  });
});
