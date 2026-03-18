"use server";
import { prisma } from "./prisma";



// GET POINTS
export async function getPoints() {
  try {
    return await prisma.point.findMany();
  } catch (err) {
    console.error(err);
    throw new Error(err.message);
  }
}







// SAVE POINTS
export async function savePoints(points) {
  try {
    // We use a loop or Promise.all for upserting multiple points 
    // to ensure if a point exists, it updates; otherwise, it creates.
    const upsertPromises = points.map((p) =>
      prisma.point.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          time: new Date(p.time),
          latitude: p.latitude,
          longitude: p.longitude,
          height: p.height,
          karamX: p.karamX,
          karamY: p.karamY,
        },
        create: {
          id: p.id,
          name: p.name,
          time: new Date(p.time),
          latitude: p.latitude,
          longitude: p.longitude,
          height: p.height,
          karamX: p.karamX,
          karamY: p.karamY,
        },
      })
    );

    await Promise.all(upsertPromises);
    // revalidatePath("/"); // Update the UI cache
    return { success: true };
  } catch (err) {
    console.error("Error saving points:", err);
    throw new Error(err.message);
  }
}




// DELETE POINT

export async function deletePoint(id) {
  try {
    if (!id) throw new Error("ID is required");

    await prisma.point.delete({
      where: { id: id },
    });

    // revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete point:", err);
    throw new Error("Failed to delete point");
  }
}











// SAVE PLOT

export async function savePlot({ id, name, pointids, area }) {
  try {
    // 1. Basic Validation
    if (!name || !Array.isArray(pointids) || pointids.length === 0) {
      throw new Error("Invalid plot data: Name and points are required.");
    }

    // 2. Simple Create (No Update logic)
    const plot = await prisma.plot.create({
      data: {
        id: id || undefined, // If id is null/empty, Prisma generates a new UUID
        name: name,
        pointids: pointids,
        area: parseFloat(area) || 0, // Ensure it's a number, default to 0
      },
    });

    // revalidatePath("/");

    return { success: true, data: plot };
  } catch (err) {
    console.error("Error creating plot:", err);
    throw new Error(err.message);
  }
}







// GET PLOTS
export async function getPlots() {
  try {
    return await prisma.plot.findMany();
  } catch (err) {
    console.error("Error fetching plots:", err);
    throw new Error(err.message);
  }
}