class UserNotFoundError extends Error {
  constructor(msg) {
    super.message = msg || "User does not exist.";
    this.name = "UserNotFoundError";
    this.code = 404;
  }
}

export default UserNotFoundError;
