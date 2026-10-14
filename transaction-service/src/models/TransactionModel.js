const mongoose = require('mongoose');
const validator = require('validator');

const transactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: [true, 'Customer ID is required'],
      validate: {
        validator: value => validator.isMongoId(value.toString()),
        message: '{VALUE} is not a valid customer ID'
      }
    },
    transactionCost: {
      type: Number,
      required: [true, 'Transaction cost is required'],
      validate: {
        validator: value => validator.isFloat(value.toString(), { min: 0.01 }),
        message: '{VALUE} is not a valid transaction cost. It must be at least 0.01'
      }
    },
    creditsPurchased: {
      type: Number,
      required: [true, 'Credits purchased is required'],
      validate: {
        validator: value => validator.isInt(value.toString(), { min: 1 }),
        message: '{VALUE} is not a valid number of credits. It must be an integer greater than 0'
      }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transactions', transactionSchema);
