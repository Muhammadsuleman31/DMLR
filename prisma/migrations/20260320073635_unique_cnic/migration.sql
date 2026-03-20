/*
  Warnings:

  - A unique constraint covering the columns `[cnic]` on the table `plot_ownerships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plot_ownerships_cnic_key" ON "plot_ownerships"("cnic");
