// lib/mongoose.js
// Singleton Mongoose connection helper.
// Uses MONGODB_URI from .env.local. Cached globally so Next.js hot reload
// and serverless invocations do not open unnecessary connections.

import mongoose from "mongoose";

const FAILURE_COOLDOWN_MS = 15000;

let cached = global.__octagonetoysMongoose;

if (!cached) {
  cached = global.__octagonetoysMongoose = { conn: null, promise: null, failure: null };
}

export async function connect(options = {}) {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    cached.failure = null;
    return cached.conn;
  }

  // After a failed connection, fail fast for a short window instead of making
  // every page/API call wait for another full server-selection timeout.
  const now = Date.now();
  if (cached.failure) {
    if (now - cached.failure.at < FAILURE_COOLDOWN_MS) {
      throw new Error(`MongoDB unavailable: ${cached.failure.message}`);
    }
    cached.failure = null;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        ...options,
      })
      .then((instance) => instance);
  }

  try {
    cached.conn = await cached.promise;
    cached.failure = null;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    cached.failure = { at: Date.now(), message: error.message };
    throw error;
  }
}

export function getConnection() {
  if (!cached.conn || mongoose.connection.readyState !== 1) {
    throw new Error("Mongoose connection has not been established. Call connect() first.");
  }
  return cached.conn;
}

export const connectToDatabase = connect;
export default connect;
