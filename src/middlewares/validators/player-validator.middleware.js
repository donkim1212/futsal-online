import Joi from "joi";

const playerId = Joi.number().integer().min(1);
const playerName = Joi.string().min(1);
const stat = Joi.number().integer().min(1).max(100);
const level = Joi.number().integer().min(1).max(10); // max?
const gradeRegex = /^[DCBAS]$/; // D, C, B, A, S ?
const grade = Joi.string().regex(gradeRegex);

const playerIdSchema = Joi.object({
  playerId: playerId.required(),
}).unknown(true);

const playerNameSchema = Joi.object({
  playerName: playerName.required(),
}).unknown(true);

const playerStatSchema = Joi.object({
  speed: stat.required(),
  goalRate: stat.required(),
  power: stat.required(),
  defense: stat.required(),
  stamina: stat.required(),
}).unknown(true);

const playerLevelSchema = Joi.object({
  level: level.required(),
}).unknown(true);

const playerGradeSchema = Joi.object({
  grade: grade.required(),
}).unknown(true);

const playerValidationErrorHandler = async (err, res, msg, code) => {
  return res
    .status(code ? code : 400)
    .json({ message: msg ? msg : err.message });
};

const playerValidatorJoi = {
  playerIdParamsValidation: async function (req, res, next) {
    try {
      await playerIdSchema.validateAsync(req.params);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
  playerIdBodyValidation: async function (req, res, next) {
    try {
      await playerIdSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
  playerNameValidation: async function (req, res, next) {
    try {
      await playerNameSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
  playerStatValidation: async function (req, res, next) {
    try {
      await playerStatSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
  playerLevelValidation: async function (req, res, next) {
    try {
      await playerLevelSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
  playerGradeValidation: async function (req, res, next) {
    try {
      await playerGradeSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return playerValidationErrorHandler(err, res);
    }
  },
};

export default playerValidatorJoi;
