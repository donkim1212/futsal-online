class PlayerNotFoundError extends Error {
  constructor(msg) {
    super.message = msg || "Player does not exist.";
    this.name = "PlayerNotFoundError";
    this.code = 404;
  }
}

export default PlayerNotFoundError;
