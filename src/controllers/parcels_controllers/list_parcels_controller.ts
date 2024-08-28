import { Response } from "express";
import { AuthRequest } from "../../interfaces/auth_request_interface";
import Parcel from "../../models/parcel_model";
import {
  sendSuccessResponse,
  sendErrorResponse,
  PaginationInfo,
} from "../../utils/response_handler_util";
import { FilterQuery } from "mongoose";
import { validationResult, query } from "express-validator";
import { formatParcelData } from "../../utils/responces_templates/parcel_response_template";

interface QueryParams {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  trackingNumber?: string;
  fromDate?: string;
  toDate?: string;
  minWeight?: string;
  maxWeight?: string;
  search?: string;
}

const ALLOWED_SORT_FIELDS = ["createdAt", "status", "weight", "trackingNumber"];
const MAX_LIMIT = 100;

export const validateListParcelsInput = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${MAX_LIMIT}`),
  query("sortBy")
    .optional()
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be 'asc' or 'desc'"),
  query("status").optional().isString().withMessage("Status must be a string"),
  query("trackingNumber")
    .optional()
    .isString()
    .withMessage("Tracking number must be a string"),
  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("fromDate must be a valid ISO 8601 date"),
  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("toDate must be a valid ISO 8601 date"),
  query("minWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minWeight must be a non-negative number"),
  query("maxWeight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxWeight must be a non-negative number"),
  query("search").optional().isString().withMessage("Search must be a string"),
];

export const listParcels = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      sendErrorResponse({
        res,
        message: "Invalid input parameters",
        errorCode: "INVALID_INPUT",
        errorDetails: errors.array()[0].msg,
        status: 400,
      });
      return;
    }

    const {
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      ...queryParams
    } = req.query as QueryParams;

    // Pagination
    const pageNumber = parseInt(page, 10);
    const itemsPerPage = Math.min(MAX_LIMIT, parseInt(limit, 10));

    // Sorting
    let sortOptions: { [key: string]: 1 | -1 } = {};
    if (ALLOWED_SORT_FIELDS.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder.toLowerCase() === "asc" ? 1 : -1;
    } else {
      sortOptions["createdAt"] = -1; // Default sort
    }

    // Filtering
    const filterOptions: FilterQuery<typeof Parcel> = { userId: req.user.id };
    try {
      applyFilters(filterOptions, queryParams);
    } catch (filterError) {
      sendErrorResponse({
        res,
        message: "Error applying filters",
        errorCode: "FILTER_ERROR",
        errorDetails:
          filterError instanceof Error
            ? filterError.message
            : "Unknown filter error",
        status: 400,
      });
      return;
    }

    // Execute query
    try {
      const [parcels, totalCount] = await Promise.all([
        Parcel.find(filterOptions)
          .sort(sortOptions)
          .skip((pageNumber - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .populate("toAddress")
          .populate("reshipperId"),
        Parcel.countDocuments(filterOptions),
      ]);

      // Check if no parcels found
      if (parcels.length === 0) {
        sendSuccessResponse({
          res,
          message: "No parcels found matching the criteria",
          data: [],
          status: 200,
        });
        return;
      }

      // Prepare pagination info
      const paginationInfo: PaginationInfo = {
        currentPage: pageNumber,
        pageSize: itemsPerPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalItems: totalCount,
        hasNextPage: pageNumber * itemsPerPage < totalCount,
        hasPrevPage: pageNumber > 1,
      };

      const parcelsData = await Promise.all(
        parcels.map(async (parcel) => {
          return await formatParcelData(parcel);
        })
      );

      sendSuccessResponse({
        res,
        message: "Parcels fetched successfully",
        data: parcelsData,
        pagination: paginationInfo,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      sendErrorResponse({
        res,
        message: "Failed to fetch parcels",
        errorCode: "DATABASE_ERROR",
        errorDetails:
          dbError instanceof Error ? dbError.message : "Unknown database error",
        status: 500,
      });
    }
  } catch (err) {
    console.error("Unexpected error in listParcels:", err);
    sendErrorResponse({
      res,
      message: "An unexpected error occurred",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: err instanceof Error ? err.message : "Unknown error",
      status: 500,
    });
  }
};

function applyFilters(
  filterOptions: FilterQuery<typeof Parcel>,
  queryParams: QueryParams
): void {
  const {
    status,
    trackingNumber,
    fromDate,
    toDate,
    minWeight,
    maxWeight,
    search,
  } = queryParams;

  if (status) filterOptions.status = status;
  if (trackingNumber)
    filterOptions.trackingNumber = new RegExp(trackingNumber, "i");

  if (fromDate || toDate) {
    filterOptions.createdAt = {};
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      if (isNaN(fromDateObj.getTime())) throw new Error("Invalid fromDate");
      filterOptions.createdAt.$gte = fromDateObj;
    }
    if (toDate) {
      const toDateObj = new Date(toDate);
      if (isNaN(toDateObj.getTime())) throw new Error("Invalid toDate");
      filterOptions.createdAt.$lte = toDateObj;
    }
  }

  if (minWeight || maxWeight) {
    filterOptions.weight = {};
    if (minWeight) {
      const minWeightNum = parseFloat(minWeight);
      if (isNaN(minWeightNum)) throw new Error("Invalid minWeight");
      filterOptions.weight.$gte = minWeightNum;
    }
    if (maxWeight) {
      const maxWeightNum = parseFloat(maxWeight);
      if (isNaN(maxWeightNum)) throw new Error("Invalid maxWeight");
      filterOptions.weight.$lte = maxWeightNum;
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filterOptions.$or = [
      { trackingNumber: searchRegex },
      { name: searchRegex },
      { description: searchRegex },
      { referenceId: searchRegex },
    ];
  }
}
