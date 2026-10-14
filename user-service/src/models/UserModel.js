const mongoose = require('mongoose');
const validator = require('validator');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email format',
      },
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    credits: {
      type: Number,
      default: 0,
      min: [0, 'Credits cannot be negative'],
    },
    role: roleSchema,
  },
  {
    timestamps: true,
  }
);

userSchema.methods.isAdmin = function () {
  return this.role.name === 'admin';
};

module.exports = mongoose.model('Users', userSchema);
