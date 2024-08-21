import { Router } from "express";

export default function (app: Router) {
  app.get("/", (req, res) => {
    return res.send("Welcome to CashPlan API");
  });
}
