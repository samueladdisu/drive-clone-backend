import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface IFile extends Document {
  _id: Types.ObjectId;
  name: string;
  folderId: Types.ObjectId;
  userId: Types.ObjectId;
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFolder extends Document {
  _id: Types.ObjectId;
  name: string;
  parentId: Types.ObjectId | null;
  userId: Types.ObjectId;
  children: Types.ObjectId[];
  path: string;
  isRoot: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatePath(): Promise<void>;
  addChild(childId: Types.ObjectId): Promise<void>;
  removeChild(childId: Types.ObjectId): Promise<void>;
  getAllDescendants(): Promise<IFolder[]>;
}

export interface FileInput {
  name: string;
  folderId: Types.ObjectId;
  originalName: string;
}

export interface FolderInput {
  name: string;
  parentId?: Types.ObjectId | null;
}

export interface UpdateFileInput {
  name?: string;
  folderId?: Types.ObjectId;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: Types.ObjectId | null;
}

export interface FileUploadRequest extends AuthRequest {
  file?: any;
  folderId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Response interfaces
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt?: Date;
}

export interface FileResponse {
  id: string;
  name: string;
  folderId: string;
  filePath?: string;
  fileSize?: number;
  formattedSize?: string;
  mimeType?: string;
  originalName: string;
  isImage?: boolean;
  isPDF?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderResponse {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  isRoot: boolean;
  children: string[];
  createdAt: Date;
  updatedAt: Date;
}
