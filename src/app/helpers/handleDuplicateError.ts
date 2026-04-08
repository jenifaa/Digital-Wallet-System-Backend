/* eslint-disable @typescript-eslint/no-explicit-any */


export const handleDuplicateError = (err: any) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];

  return {
    statusCode: 400,
    message: `Duplicate ${field}: ${value}`,
  };
};
