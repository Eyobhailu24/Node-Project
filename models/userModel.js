const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'please provide a name'],
  },
  email: {
    type: String,
    require: [true, 'please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    requred: [true, 'please confirm you password'],
    validate: {
      //This only works on Save and Create
      validator: function (el) {
        return el === this.password; // abc === ab
      },
      message: 'passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  //only run this function if password is modified
  if (!this.isModified('password')) return next();

  //Hast the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete password confirm field
  this.passwordConfirm = undefined;
  //goes out of middleware
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log({resetToken},this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 *1000

    return resetToken
};


const User = mongoose.model('User', userSchema);

module.exports = User;
