/*
  Warnings:

  - You are about to alter the column `area` on the `plots` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "plots" ALTER COLUMN "area" SET DATA TYPE DOUBLE PRECISION;
