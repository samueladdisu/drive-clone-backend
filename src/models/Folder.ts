import { Schema, model, Document, Types } from 'mongoose';
import { IFolder } from '../types';

const folderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [255, 'Folder name cannot exceed 255 characters'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Folder',
      },
    ],
    path: {
      type: String,
    },
    isRoot: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate folder names in the same parent for the same user
folderSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });

// Ensure only one root folder per user
folderSchema.index(
  { userId: 1, isRoot: 1 },
  {
    unique: true,
    partialFilterExpression: { isRoot: true },
  },
);

// Pre-save middleware to update path
folderSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isModified('parentId') || this.isNew) {
    await this.updatePath();
  }
  next();
});

// Method to update folder path
folderSchema.methods.updatePath = async function (this: IFolder) {
  if (this.isRoot || !this.parentId) {
    this.path = `/${this.name}`;
  } else {
    const parent = await model('Folder').findById(this.parentId);
    if (parent) {
      this.path = `${(parent as IFolder).path}/${this.name}`;
    }
  }
};

// Method to add child folder
folderSchema.methods.addChild = async function (
  this: IFolder,
  childId: Types.ObjectId,
) {
  if (!this.children.some((id: Types.ObjectId) => id.equals(childId))) {
    this.children.push(childId);
    await this.save();
  }
};

// Method to remove child folder
folderSchema.methods.removeChild = async function (
  this: IFolder,
  childId: Types.ObjectId,
) {
  this.children = this.children.filter(
    (id: Types.ObjectId) => !id.equals(childId),
  );
  await this.save();
};

// Method to get all descendants (recursive)
folderSchema.methods.getAllDescendants = async function (
  this: IFolder,
): Promise<IFolder[]> {
  const descendants: IFolder[] = [];
  const queue = [...this.children];

  while (queue.length > 0) {
    const childId = queue.shift();
    if (childId) {
      const child = (await model('Folder')
        .findById(childId)
        .populate('children')) as IFolder;

      if (child) {
        descendants.push(child);
        queue.push(...child.children);
      }
    }
  }

  return descendants;
};

export default model<IFolder>('Folder', folderSchema);
