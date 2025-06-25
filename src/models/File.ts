import { Schema, model, Document, Types } from 'mongoose';

export interface IFile extends Document {
  _id: Types.ObjectId;
  name: string;
  folderId: Types.ObjectId; // Reference to the folder containing this file
  userId: Types.ObjectId;
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      required: [true, 'Folder ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate file names in the same folder for the same user
fileSchema.index({ userId: 1, folderId: 1, name: 1 }, { unique: true });

export default model<IFile>('File', fileSchema);
