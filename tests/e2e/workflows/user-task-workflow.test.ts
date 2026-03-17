import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { Application } from "express";
import { createTestApp } from "../../helpers/test-app.js";
import { prisma } from "../../../src/config/database.js";

describe("E2E - User Registration and Task Management Workflow", () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  it("should complete full user workflow: register → login → create tasks → update → delete", async () => {
    // Step 1: Register a new user
    const registrationData = {
      email: "e2e-user@example.com",
      password: "SecurePass123!",
      firstName: "E2E",
      lastName: "User",
    };

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(registrationData)
      .expect(201);

    expect(registerResponse.body.user.email).toBe(registrationData.email);
    expect(registerResponse.body.token).toBeDefined();

    const userId = registerResponse.body.user.id;
    const token = registerResponse.body.token;

    // Step 2: Login with credentials
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: registrationData.email,
        password: registrationData.password,
      })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();

    // Step 3: Get user profile
    const profileResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(profileResponse.body.user.id).toBe(userId);
    expect(profileResponse.body.user.email).toBe(registrationData.email);

    // Step 4: Create multiple tasks
    const task1Response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Complete project documentation",
        description: "Write comprehensive docs",
        priority: "HIGH",
        status: "TODO",
      })
      .expect(201);

    const task1Id = task1Response.body.data.id;

    const task2Response = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Review pull requests",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
      })
      .expect(201);

    const task2Id = task2Response.body.data.id;

    // Step 5: Fetch all tasks
    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(tasksResponse.body.data).toHaveLength(2);

    // Step 6: Update task status
    await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: task1Id,
        status: "DONE",
      })
      .expect(200);

    // Step 7: Toggle task status
    const toggleResponse = await request(app)
      .patch(`/api/tasks/${task1Id}/toggle-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(toggleResponse.body.data.status).toBe("TODO"); // DONE → TODO

    // Step 8: Delete a task
    await request(app)
      .delete(`/api/tasks/${task1Id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Step 9: Verify task is deleted
    const finalTasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalTasksResponse.body.data).toHaveLength(1);
    expect(finalTasksResponse.body.data[0].id).toBe(task2Id);

    // Step 10: Update user profile
    const updateProfileResponse = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "Updated",
        // Phone number not implemented
        /* phoneNumber: "+1234567890", */
      })
      .expect(200);

    expect(updateProfileResponse.body.user.firstName).toBe("Updated");
    // Phone number not implemented
    /* expect(updateProfileResponse.body.user.phoneNumber).toBe("+1234567890"); */

    // Step 11: Delete account (cascades to all data)
    await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    // Step 12: Verify everything is cleaned up
    const deletedUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    expect(deletedUser).toBeNull();

    const remainingTasks = await prisma.task.findMany({
      where: { authorId: userId },
    });
    expect(remainingTasks).toHaveLength(0);
  });

  it("should handle task workflow with list organization", async () => {
    // Register and login
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "list-user@example.com",
        password: "password123",
        firstName: "List",
        lastName: "User",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Create lists
    const workListResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Work Projects",
        description: "Professional tasks",
        color: "#FF5733",
      })
      .expect(201);

    const workListId = workListResponse.body.list.id;

    const personalListResponse = await request(app)
      .post("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Personal",
        color: "#33FF57",
      })
      .expect(201);

    const personalListId = personalListResponse.body.list.id;

    // Create tasks in lists
    const workTask1 = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Client presentation",
        listId: workListId,
        priority: "HIGH",
      })
      .expect(201);

    const workTask2 = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Code review",
        listId: workListId,
        priority: "MEDIUM",
      })
      .expect(201);

    const personalTask = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Grocery shopping",
        listId: personalListId,
        priority: "LOW",
      })
      .expect(201);

    // Create task without list
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Unorganized task",
        priority: "MEDIUM",
      })
      .expect(201);

    // Get work list with tasks
    const workListDetailsResponse = await request(app)
      .get(`/api/lists/${workListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(workListDetailsResponse.body.list.tasks).toHaveLength(2);
    expect(workListDetailsResponse.body.list.tasks[0].taskName).toBe(
      "Client presentation",
    );

    // Toggle list as favorite
    const favoriteResponse = await request(app)
      .patch(`/api/lists/${workListId}/favorite`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(favoriteResponse.body.list.isFavorite).toBe(true);

    // Update list
    await request(app)
      .put(`/api/lists/${workListId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Work Projects (Updated)",
        description: "All work-related tasks",
      })
      .expect(200);

    // Move task from one list to another
    await request(app)
      .patch("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id: workTask2.body.data.id,
        listId: personalListId,
      })
      .expect(200);

    // Delete list (should cascade delete its tasks)
    await request(app)
      .delete(`/api/lists/${workListId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Verify tasks in work list are deleted
    const tasksResponse = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const remainingTaskNames = tasksResponse.body.data.map(
      (t: any) => t.taskName,
    );
    expect(remainingTaskNames).not.toContain("Client presentation");
    expect(remainingTaskNames).toContain("Code review"); // Moved to personal
    expect(remainingTaskNames).toContain("Grocery shopping");
    expect(remainingTaskNames).toContain("Unorganized task");
  });

  it("should handle settings management workflow", async () => {
    // Register user
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "settings-user@example.com",
        password: "password123",
        firstName: "Settings",
        lastName: "User",
      })
      .expect(201);

    const token = registerResponse.body.token;

    // Get default settings (should auto-create)
    const defaultSettingsResponse = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(defaultSettingsResponse.body.settings.theme).toBe("LIGHT");
    expect(defaultSettingsResponse.body.settings.language).toBe("EN");
    expect(defaultSettingsResponse.body.settings.defaultPriority).toBe(
      "MEDIUM",
    );

    // Update settings
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        theme: "DARK",
        language: "ES",
        dateFormat: "DD_MM_YYYY",
      })
      .expect(200);

    // Verify settings persisted
    const updatedSettingsResponse = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(updatedSettingsResponse.body.settings.theme).toBe("DARK");
    expect(updatedSettingsResponse.body.settings.language).toBe("ES");
    expect(updatedSettingsResponse.body.settings.dateFormat).toBe("DD_MM_YYYY");

    // Create tasks with default settings
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        taskName: "Task with defaults",
      })
      .expect(201);

    // Update default priority and status
    await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        defaultPriority: "HIGH",
        defaultStatus: "IN_PROGRESS",
      })
      .expect(200);

    // Verify partial update preserved other settings
    const finalSettingsResponse = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(finalSettingsResponse.body.settings.theme).toBe("DARK"); // Preserved
    expect(finalSettingsResponse.body.settings.defaultPriority).toBe("HIGH"); // Updated
    expect(finalSettingsResponse.body.settings.defaultStatus).toBe(
      "IN_PROGRESS",
    ); // Updated
  });
});
