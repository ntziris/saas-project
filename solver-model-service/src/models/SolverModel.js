const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    type: { type: String, required: true },
    bucketName: { type: String, required: true },
    objectKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const solverModelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    notes: { type: String },
    metadataTemplate: { type: String, required: true },
    inputDataTemplate: { type: String, required: true },
    chargeRate: { type: Number, required: true },
    files: [fileSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SolverModels', solverModelSchema);
