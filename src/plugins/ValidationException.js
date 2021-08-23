class ValidationException extends Error {
  constructor(message, metadata) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export default ValidationException;
