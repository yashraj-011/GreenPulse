-- CreateTable
CREATE TABLE "AqiData" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "aqiValue" INTEGER NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AqiData_pkey" PRIMARY KEY ("id")
);
