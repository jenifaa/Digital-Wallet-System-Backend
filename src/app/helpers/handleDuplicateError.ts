/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericErrorResponse } from "../interfaces/error.types";

export const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const duplicate = err.message.match(/"([^"]*)"/);
  return {
    statusCode: 400,
    message: `${duplicate[1]} already exist `,
  };
};