class NotEnoughMoneyError extends Error {
  constructor(msg) {
    super.message = msg || "재화가 부족합니다.";
    this.name = "NotEnoughMoneyError";
    this.code = 403;
  }
}

export default NotEnoughMoneyError;