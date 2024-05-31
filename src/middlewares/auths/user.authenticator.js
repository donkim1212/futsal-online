import jwt from "jsonwebtoken";

const checkHeaders = async function (headers) {
  const authorization = headers.authorization?.split(" ");
  if (!authorization) throw new Error("로그인이 필요합니다.");
  if (authorization[0] !== "Bearer")
    throw new Error("토큰이 유효하지 않습니다.");
  if (!authorization[1]) throw new Error("토큰이 없습니다.");
  jwt.verify(authorization[1], process.env.SECRET, (err, user) => {
    if (err) throw new Error(err.message);
    return user;
  });
};

export default UserAuthenticator = {
  authStrict: async function (req, res, next) {
    try {
      req.body.user = await checkHeaders(req.headers);
      next();
    } catch (err) {
      return res.status(401).json({ message: "인증 실패." });
    }
  },
  authOptional: async function (req, res, next) {
    try {
      req.body.user = await checkHeaders(req.headers);
      next();
    } catch (err) {
      req.body.user = null;
      next();
    }
  },
};
