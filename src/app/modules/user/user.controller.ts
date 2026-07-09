/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import { JwtPayload } from "jsonwebtoken";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Created Successfully",
      data: user,
    });
  },
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(
      query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "All Users Retrieved Successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    const verifiedToken = req.user;
    const payload = { ...req.body};
    // const payload = { ...req.body, picture: req.file?.path };

    const user = await UserServices.updateUser(
      userId as string,
      payload,
      verifiedToken as JwtPayload,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Users updated Successfully",
      data: user,
    });
  },
);
const updateUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const userId = req.params.id;

    const verifiedToken = req.user;
    const payload = {  picture: req.file?.path };

    const user = await UserServices.updateUserProfile(
      payload,
      verifiedToken as JwtPayload,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User profile updated Successfully",
      data: user,
    });
  },
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  },
);

const getSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.getSingleUser(id as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result.data,
    });
  },
);

const makeAgent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const decodedToken = req.user;

    const result = await UserServices.makeAgent(
      userId as string,
      decodedToken as JwtPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Role updated to agent Successfully",
      data: result,
    });
  },
);

const approveAgent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const decodedToken = req.user;

    const result = await UserServices.approveAgent(
      userId as string,
      decodedToken as JwtPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent approved successfully",
      data: result,
    });
  },
);

const applyForAgent = catchAsync(
  async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.applyForAgent(decodedToken.userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Agent application submitted successfully",
      data: result,
    });
  },
);

const rejectAgent = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.rejectAgent(String(userId), decodedToken, req.body.reason);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent rejected successfully",
      data: result,
    });
  },
);

const suspendAgent = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.suspendAgent(String(userId), decodedToken, req.body.reason);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent suspended successfully",
      data: result,
    });
  },
);

const reactivateAgent = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.reactivateAgent(String(userId), decodedToken);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent reactivated successfully",
      data: result,
    });
  },
);

const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.searchUsers(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const searchAgents = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.searchAgents(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Agents retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});


const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.deleteUser(
    req.params.id as string,
    req.user as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successfully",
    data: result,
  });
});



export const userControllers = {
  createUser,
  getAllUsers,
  searchUsers,
  searchAgents,
  getMe,
  updateUser,
  getSingleUser,
  makeAgent,
  applyForAgent,
  approveAgent,
  rejectAgent,
  suspendAgent,
  reactivateAgent,
  updateUserProfile,
  deleteUser
};
