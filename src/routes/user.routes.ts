// Importing required modules
import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { auth } from "../middlewares/auth.js";
// Importing validation schemas for user routes
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
} from "../schemas/user.schema.js";

// Importing the user controller module; use the UserController namespace to access its functions
import * as UserController from "../controllers/user.controller.js";
// Creating the Express router to define routes
const router = Router();

// Auth routes
router.post(
  "/auth/register", // User registration route
  validate({ body: registerSchema }), // Validation middleware using the registration schema; validate runs before the controller and checks the request body
  UserController.register // Controller handling user registration logic
);
router.post(
  "/auth/login",
  validate({ body: loginSchema }),
  UserController.login
);

// Me routes (protected)
router.get("/users/me", auth, UserController.getMe);
router.put(
  "/users/me",
  auth,
  validate({ body: updateUserSchema }),
  UserController.updateMe
);
router.delete("/users/me", auth, UserController.deleteMe);

export default router; // Exportando el router para ser usado en el servidor principal
// Exporting the router to be used in the main server
