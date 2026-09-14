/* eslint-disable @typescript-eslint/no-explicit-any */


export const handleDuplicateError = (err: any) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];

  if (field === "email") {
    return {
      statusCode: 400,
      message: "An account with this email already exists",
    };
  }
  if (field === "phone") {
    return {
      statusCode: 400,
      message: "An account with this phone number already exists",
    };
  }

  return {
    statusCode: 400,
    message: `Duplicate ${field}: ${value}`,
  };
};
