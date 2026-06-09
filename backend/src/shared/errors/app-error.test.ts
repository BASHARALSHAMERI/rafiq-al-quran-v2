import { AppError } from "./app-error";

describe("AppError", () => {
  it("should create error with default status code 500", () => {
    const error = new AppError("Something went wrong");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("APP_ERROR");
    expect(error.details).toBeUndefined();
  });

  it("should create error with custom status code", () => {
    const error = new AppError("Not found", 404);

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not found");
  });

  it("should create error with details and custom code", () => {
    const details = { field: "email", issue: "invalid" };
    const error = new AppError("Validation failed", 400, details, "VALIDATION_ERROR");

    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("should have correct name property", () => {
    const error = new AppError("Test");
    expect(error.name).toBe("AppError");
  });
});
