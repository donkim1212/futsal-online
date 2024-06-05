class TeamNotReadyError extends Error {
  constructor(msg) {
    super(msg);
    this.message = msg || "팀 구성이 올바르지 않습니다.";
    this.name = "TeamNotReadyError";
    this.code = 409;
  }
}

export default TeamNotReadyError;
