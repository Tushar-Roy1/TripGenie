
import mongoose, { Schema, models, model } from "mongoose";

const SharedTripSchema = new Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tripData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SharedTrip =
  models.SharedTrip ||
  model("SharedTrip", SharedTripSchema);

export default SharedTrip;
