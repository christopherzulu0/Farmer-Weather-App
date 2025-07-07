/*
  Warnings:

  - Added the required column `name` to the `CropAdvice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CropAdvice" ADD COLUMN     "name" TEXT NOT NULL;
