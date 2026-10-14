const SolverModel = require('../models/SolverModel');

async function createSolverModel(title, notes, metadataTemplate, inputDataTemplate, chargeRate) {
  try {
    // Check if solver model already exists
    const existingSolverModel = await SolverModel.findOne({ title });
    if (existingSolverModel) {
      console.log(`SolverModel ${title} already exists`);
      return;
    }

    // Create solver model
    const newSolverModel = new SolverModel({
      title,
      notes,
      metadataTemplate,
      inputDataTemplate,
      chargeRate,
    });

    await newSolverModel.save();
    console.log(`SolverModel ${title} created successfully`);
  } catch (error) {
    console.error('Error creating solver model:', error);
    throw error;
  }
}

async function initDatabase() {
  // Create initial solver models
  await createSolverModel(
    'Vehicle Routing Problem',
    'Solver Model for the Vehicle Routing Problem (VRP)',
    `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "num_vehicles": {
      "type": "integer",
      "minimum": 0,
      "description": "The number of vehicles in the fleet"
    },
    "depot": {
      "type": "integer",
      "minimum": 0,
      "description": "The index of the depot, the location where all vehicles start and end their routes"
    },
    "max_distance": {
      "type": "number",
      "minimum": 0,
      "description": "The maximum distance that each vehicle can travel"
    }
  },
  "required": ["num_vehicles", "depot", "max_distance"],
  "additionalProperties": false
}`,
    `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "Locations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "Latitude": {
            "type": "number",
            "minimum": -90,
            "maximum": 90
          },
          "Longitude": {
            "type": "number",
            "minimum": -180,
            "maximum": 180
          }
        },
        "required": ["Latitude", "Longitude"],
        "additionalProperties": false
      },
      "minItems": 1
    }
  },
  "required": ["Locations"],
  "additionalProperties": false
}`,
    1.0
  );

  // Add more initial solver models here if needed
}

module.exports = { initDatabase, createSolverModel };
