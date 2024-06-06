import Joi from "joi";

const regex = /[0-9]/;
const userId = Joi.number().strict().integer().min(1);
const userIdParams = Joi.string().regex(regex);
const username = Joi.string().alphanum().lowercase().min(6).max(20);
const password = Joi.string().min(6).max(20);
const amount = Joi.number().strict().integer().min(1000).max(1000000);
const isAll = Joi.boolean().strict();
const inventoryId = Joi.number().integer().strict().min(1);

const signInSchema = Joi.object({
  username: username.required(),
  password: password.required(),
});

const signUpSchema = Joi.object({
  username: username.required(),
  password: password.required(),
  passwordConfirmation: Joi.string().valid(Joi.ref("password")).required(),
});

const userIdSchema = Joi.object({
  userId: userId.required(),
}).unknown(true);

const userIdParamsSchema = Joi.object({
  userId: userIdParams.required(),
}).unknown(true);

const isAllSchema = Joi.object({
  isAll: isAll.required(),
}).unknown(true);

const cashPurchaseSchema = Joi.object({
  amount: amount.required(),
}).unknown(true);

const inventoryIdBodySchema = Joi.object({
  inventoryId: inventoryId.required(),
}).unknown(true);

const inventoryIdParamsSchema = Joi.object({
  inventoryId: userIdParams.required(),
}).unknown(true);

const pagenationSchema = Joi.object({
  pageNumber: userId.required(),
  loadCount: userId.required(),
});

const userValidationErrorHandler = async (err, res, msg, code) => {
  return res
    .status(code ? code : 400)
    .json({ message: msg ? msg : err.message });
};

const userValidatorJoi = {
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

  userIdBodyValidation: async function (req, res, next) {
    try {
      await userIdSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },
  userIdParamsValidation: async function (req, res, next) {
    try {
      await userIdParamsSchema.validateAsync(req.params);
      const parsed = parseInt(req.params.userId);
      if (parsed == 0) throw new Error("userId is invalid.");
      req.params.userId = parsed;
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  userIdQueryValidationOptional: async function (req, res, next) {
    try {
      await userIdParamsSchema.validateAsync(req.query);
      const parsed = parseInt(req.query.userId);
      if (parsed == 0) throw new Error("userId is invalid.");
      req.query.userId = parsed;
      next();
    } catch (err) {
      req.query.userId = null;
      next();
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
  cashPurchaseValidation: async function (req, res, next) {
    try {
      await cashPurchaseSchema.validateAsync(req.body);
      next();
    } catch (err) {
      // TODO: set msg to fit the error case
      return userValidationErrorHandler(err, res);
    }
  },

  inventoryIdBodyValidation: async function (req, res, next) {
    try {
      await inventoryIdBodySchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  inventoryIdParamValidation: async function (req, res, next) {
    try {
      await inventoryIdParamsSchema.validateAsync(req.params);
      const parsed = parseInt(req.params.inventoryId);
      if (parsed == 0) throw new Error("inventoryId is invalid.");
      req.params.inventoryId = parsed;
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },

  pagenationValidation: async function (req, res, next) {
    try {
      await pagenationSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return userValidationErrorHandler(err, res);
    }
  },
};

export default userValidatorJoi;
