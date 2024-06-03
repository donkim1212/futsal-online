import Joi from "joi";

const userId = Joi.number().strict().integer().min(1);
const username = Joi.string().alphanum.min(6).max(20);
const password = Joi.string().min(6).max(20);
const money = Joi.number()
  .strict()
  .integer()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);
const isAll = Joi.boolean().strict();

const signInSchema = Joi.object({
  username: username.required(),
  password: password.required(),
});

const signUpSchema = Joi.object({
  ...signInSchema,
  passwordConfirmation: Joi.string().valid(Joi.ref("password")).required(),
});

const userIdSchema = Joi.object({
  userId: userId.required(),
}).unknown(true);

const isAllSchema = Joi.object({
  isAll: isAll.required(),
}).unknown(true);

const userValidationErrorHandler = async (err, res, msg, code) => {
  return res
    .status(code ? code : 400)
    .json({ message: msg ? msg : err.message });
};

export default userValidatorJoi = {
  signInValidation: async function (req, res, next) {
    try {
      await signInSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  signUpValidation: async function (req, res, next) {
    try {
      await signUpSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  userIdValidation: async function (req, res, next) {
    try {
      await userIdSchema.validateAsync(req.params);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  isAllValidation: async function (req, res, next) {
    try {
      await isAllSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },
};
