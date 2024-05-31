class UserNotFoundError extends Error {
  constructor(msg) {
    super.message = msg || "유저가 존재하지 않습니다.";
    this.name = "UserNotFoundError";
    this.code = 404;
  }
}

export default UserNotFoundError;
