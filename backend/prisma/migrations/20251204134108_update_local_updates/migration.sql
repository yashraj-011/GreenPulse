/*
  Warnings:

  - Added the required column `category` to the `LocalUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LocalUpdate" ADD COLUMN     "category" TEXT NOT NULL,
ALTER COLUMN "meta" DROP NOT NULL;
