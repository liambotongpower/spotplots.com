import mongoose, { Schema, Document } from 'mongoose';

// Transport Stop Schema
export interface IStop extends Document {
  stop_id: string;
  stop_code: number;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const StopSchema = new Schema<IStop>({
  stop_id: { type: String, required: true, index: true },
  stop_code: { type: Number, required: true },
  stop_name: { type: String, required: true },
  stop_lat: { type: Number, required: true },
  stop_lon: { type: Number, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  }
});

// Create a virtual to automatically populate the location field from lat/lon
StopSchema.pre('save', function(next) {
  if (this.stop_lat && this.stop_lon) {
    this.location = {
      type: 'Point',
      coordinates: [this.stop_lon, this.stop_lat] // MongoDB expects [lng, lat]
    };
  }
  next();
});

export const Stop = mongoose.models.Stop || mongoose.model<IStop>('Stop', StopSchema, 'stops');
