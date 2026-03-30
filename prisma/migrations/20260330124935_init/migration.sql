-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'ES');

-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('MM_DD_YYYY', 'DD_MM_YYYY', 'YYYY_MM_DD');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileImage" VARCHAR(255),
    "phoneNumber" VARCHAR(30),
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "description" VARCHAR(50),
    "color" VARCHAR(20) NOT NULL DEFAULT '#000000',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "taskName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(200),
    "status" "Status" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'LOW',
    "authorId" INTEGER NOT NULL,
    "listId" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'LIGHT',
    "dateFormat" "DateFormat" NOT NULL DEFAULT 'MM_DD_YYYY',
    "language" "Language" NOT NULL DEFAULT 'EN',
    "defaultPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "defaultStatus" "Status" NOT NULL DEFAULT 'TODO',
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
