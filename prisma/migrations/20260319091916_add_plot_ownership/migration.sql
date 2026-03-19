/*
  Warnings:

  - The `cnic` column on the `plot_ownerships` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "plot_ownerships" DROP COLUMN "cnic",
ADD COLUMN     "cnic" BIGINT;
