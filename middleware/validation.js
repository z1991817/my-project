const Joi = require('joi');

const schemas = {
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(8).required()
  }),
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required()
      .messages({ 'string.pattern.base': '密码必须至少8位，且包含字母和数字' }),
    code: Joi.string().length(6).required()
  }),
  imageGeneration: Joi.object({
    prompt: Joi.string().min(1).max(4000).required(),
    n: Joi.number().integer().min(1).max(4).optional()
  })
};

function validate(schemaName) {
  return (req, res, next) => {
    const { error } = schemas[schemaName].validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: error.details[0].message
      });
    }
    next();
  };
}

module.exports = { validate };
