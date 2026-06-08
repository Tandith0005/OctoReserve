import mongoose, { Schema } from 'mongoose';
import { IOrganization } from '../types/index.js';

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    bookingConfig: {
      defaultDuration: {
        type: Number,
        required: true,
        default: 60, // 60 minutes
        min: 15,
      },
      maxDuration: {
        type: Number,
        required: true,
        default: 480, // 8 hours
        max: 720, // 12 hours
      },
      minDuration: {
        type: Number,
        required: true,
        default: 15,
        min: 15,
      },
      bookingWindowDays: {
        type: Number,
        required: true,
        default: 30,
        min: 1,
        max: 365,
      },
      workingHours: {
        start: {
          type: String,
          required: true,
          default: '09:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          required: true,
          default: '17:00',
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        workingDays: {
          type: [Number],
          required: true,
          default: [1, 2, 3, 4, 5], // Monday to Friday
          validate: {
            validator: (days: number[]) => days.every(d => d >= 0 && d <= 6),
            message: 'Working days must be between 0 (Sunday) and 6 (Saturday)',
          },
        },
      },
      bufferTime: {
        before: {
          type: Number,
          default: 0,
          min: 0,
          max: 120,
        },
        after: {
          type: Number,
          default: 0,
          min: 0,
          max: 120,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ timezone: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);