import Joi from 'joi';

// User registration validation
export const userRegistrationSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// User login validation
export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// User profile update validation
export const userUpdateSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
});

// File validation
export const fileSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  folderId: Joi.string().hex().length(24).required(),
  originalName: Joi.string().min(1).max(255).required(),
});

// Folder validation
export const folderSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  parentId: Joi.string().hex().length(24).allow(null).optional(),
});

// File update validation
export const updateFileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  folderId: Joi.string().hex().length(24).optional(),
});

// Folder update validation
export const updateFolderSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  parentId: Joi.string().hex().length(24).allow(null).optional(),
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details?.[0]?.message || 'Validation failed',
      });
    }
    next();
  };
};
