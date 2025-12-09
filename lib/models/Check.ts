import mongoose, { Schema, Document } from 'mongoose';

export interface ICheck extends Document {
  endpointId: mongoose.Types.ObjectId;
  status: number;
  responseTime: number;
  timestamp: Date;
  errorMessage?: string;
}

const CheckSchema = new Schema<ICheck>({
  endpointId: {
    type: Schema.Types.ObjectId,
    ref: 'Endpoint',
    required: true,
  },
  status: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  errorMessage: {
    type: String,
  },
});

export default mongoose.models.Check || mongoose.model<ICheck>('Check', CheckSchema);
