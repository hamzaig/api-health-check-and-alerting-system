import mongoose, { Schema, Document } from 'mongoose';

export interface IEndpoint extends Document {
  url: string;
  name: string;
  checkInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

const EndpointSchema = new Schema<IEndpoint>(
  {
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    checkInterval: {
      type: Number,
      default: 60000, // 60 seconds in milliseconds
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Endpoint || mongoose.model<IEndpoint>('Endpoint', EndpointSchema);
