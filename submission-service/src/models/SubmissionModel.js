const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  status: { type: String, required: true },
  metadataFileName: { type: String, required: true },
  inputDataFileName: { type: String, required: true }
}, { timestamps: true });

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalCost: { type: Number, required: true },
  status: { type: String, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  solverModelId: { type: mongoose.Schema.Types.ObjectId, ref: 'SolverModels', required: true },
  tasks: [taskSchema]
}, { timestamps: true });

module.exports = mongoose.model('Submissions', submissionSchema);
