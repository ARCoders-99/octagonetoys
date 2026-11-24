// app/api/health/route.js

import { connectToDatabase } from "@/lib/mongoose";
import { jsonOk, jsonError } from "@/lib/server/api";

export async function GET() {
  try {
    await connectToDatabase();
    return jsonOk({ message: "Database connection healthy" });
  } catch (error) {
    return jsonError(error?.message || "Database connection failed", 500);
  }
}
