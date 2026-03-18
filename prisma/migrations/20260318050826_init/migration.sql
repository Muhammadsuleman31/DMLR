-- CreateTable
CREATE TABLE "points" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "karamX" DOUBLE PRECISION NOT NULL,
    "karamY" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointids" JSONB NOT NULL,
    "area" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);
