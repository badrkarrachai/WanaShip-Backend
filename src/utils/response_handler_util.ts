import { Response } from "express";
import config from "../config";

interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details: string;
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}

interface SuccessResponseOptions<T> {
  res: Response;
  message: string;
  data?: T;
  status?: number;
}

interface ErrorResponseOptions {
  res: Response;
  message: string;
  errorCode: string;
  errorDetails: string;
  status?: number;
}

export const sendResponse = <T>(
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data?: T,
  error?: { code: string; details: string }
) => {
  const response: ApiResponse<T> = {
    status,
    success,
    message,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      version: config.app.version,
    },
  };

  return res.status(status).json(response);
};

export const sendSuccessResponse = <T>({
  res,
  message,
  data,
  status = 200,
}: SuccessResponseOptions<T>) => {
  return sendResponse(res, status, true, message, data);
};

export const sendErrorResponse = ({
  res,
  message,
  errorCode,
  errorDetails,
  status = 400,
}: ErrorResponseOptions) => {
  return sendResponse(res, status, false, message, undefined, {
    code: errorCode,
    details: errorDetails,
  });
};
