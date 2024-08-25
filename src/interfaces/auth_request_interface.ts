import { Request } from "express";
import { JwtPayload } from "./jwt_payload_interface";

export interface AuthRequest extends Request {
  user?: JwtPayload["user"];
}
