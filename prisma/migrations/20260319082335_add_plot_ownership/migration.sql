-- CreateTable
CREATE TABLE "plot_ownerships" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "cnic" TEXT,
    "name" TEXT,
    "fatherName" TEXT,

    CONSTRAINT "plot_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plot_ownerships_plotId_key" ON "plot_ownerships"("plotId");

-- AddForeignKey
ALTER TABLE "plot_ownerships" ADD CONSTRAINT "plot_ownerships_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
