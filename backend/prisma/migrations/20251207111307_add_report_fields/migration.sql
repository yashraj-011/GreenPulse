-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "stationName" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';
