import { AuthRequest } from "../../interfaces/auth_request_interface";
import { sendErrorResponse } from "../../utils/response_handler";
import { Request, Response } from "express";

export const createParcel = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
};
