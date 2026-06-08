import mongoose, { Schema } from 'mongoose';
import { IResource, ResourceType } from '../types/index.js';

const ResourceSchema = new Schema<IResource>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ResourceType),
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      min: 1,
    },
    location: {
      type: String,
      trim: true,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
    bufferTime: {
      before: {
        type: Number,
        min: 0,
        max: 120,
      },
      after: {
        type: Number,
        min: 0,
        max: 120,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for resource name within organization
ResourceSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// Index for active resources queries
ResourceSchema.index({ organizationId: 1, isActive: 1, isDeleted: 1 });
ResourceSchema.index({ organizationId: 1, type: 1 });

// Soft delete middleware
ResourceSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

ResourceSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

// Method for soft delete
ResourceSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  await this.save();
};

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);