import Joi from "joi";

const userId = Joi.number().integer().min(1);
const username = Joi.string().alphanum.min(6).max(20);
const password = Joi.string().min(6).max(20);

const signInSchema = Joi.object({
  username: username.required(),
  password: password.required(),
});

const signUpSchema = Joi.object({
  ...signInSchema,
  passwordConfirmation: Joi.string().valid(Joi.ref("password")).required(),
});

export default userValidatorJoi = {
  signInValidation: async function (req, res, next) {
    try {
      await signInSchema.validateAsync(req.body);
      next();
    } catch (err) {
      return res.status(400).json({ message: "" });
    }
  },
};
