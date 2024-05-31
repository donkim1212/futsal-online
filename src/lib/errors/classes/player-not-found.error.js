class PlayerNotFoundError extends Error {
  constructor(msg) {
    super.message = msg || "플레이어가 존재하지 않습니다.";
    this.name = "PlayerNotFoundError";
    this.code = 404;
  }
}

export default PlayerNotFoundError;
