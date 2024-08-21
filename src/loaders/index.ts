import connectDB from "./db";
import expressLoader from "./express";
import type { Express } from "express";

export default async function ({ app }: { app: Express }) {
  await connectDB();
  console.log("Mongodb loaded");

  await expressLoader({ app });
  console.log("Express loaded");
}
