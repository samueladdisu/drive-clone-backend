import { Request, Response, NextFunction } from 'express';
import {
  AuthRequest,
  FileUploadRequest,
  FileResponse,
  UpdateFileInput,
} from '../types';
import File from '../models/File';
import Folder from '../models/Folder';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';
import { formatFileSize, isImage, isPDF } from '../utils/helperFunctions';

// Upload file
export const uploadFile = async (
  req: FileUploadRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let { folderId } = req.body;

    // If no folderId provided, use the user's root folder
    if (!folderId) {
      const rootFolder = await Folder.findOne({
        userId: req.user._id,
        isRoot: true,
      });

      if (rootFolder) {
        folderId = rootFolder._id.toString();
      } else {
        // Clean up uploaded file
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Root folder not found' });
        return;
      }
    }

    // Verify folder exists and belongs to user
    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!folder) {
      // Clean up uploaded file
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Check file type
    if (!config.allowedFileTypes.includes(req.file.mimetype)) {
      // Clean up uploaded file
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ error: 'File type not allowed' });
      return;
    }

    // Check file size
    if (req.file.size > config.maxFileSize) {
      // Clean up uploaded file
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({
        error: `File size exceeds maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
      });
      return;
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const finalPath = path.join(config.uploadDir, uniqueFilename);

    // Ensure upload directory exists
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    // Move file to final location
    fs.renameSync(req.file.path, finalPath);

    // Check for duplicate file name in folder
    const baseName = path.parse(req.file.originalname).name;
    const extension = path.parse(req.file.originalname).ext;
    let fileName = req.file.originalname;
    let counter = 1;

    while (
      await File.findOne({ name: fileName, folderId, userId: req.user._id })
    ) {
      fileName = `${baseName} (${counter})${extension}`;
      counter++;
    }

    // Create file record
    const file = new File({
      name: fileName,
      folderId,
      userId: req.user._id,
      filePath: finalPath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });

    await file.save();

    const fileResponse: FileResponse = {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileResponse,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Download file
export const downloadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const fileId = req.params.fileId;

    // Find file
    const file = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check if file exists on disk
    if (!file.filePath || !fs.existsSync(file.filePath)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

    if (file.mimeType) {
      res.setHeader('Content-Type', file.mimeType);
    }

    // Stream file to response
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// Get file info
export const getFileInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const fileId = req.params.fileId;

    // Find file
    const file = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    }).populate('folderId', 'name path');

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const fileResponse: FileResponse = {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };

    res.json({ file: fileResponse });
  } catch (error) {
    next(error);
  }
};

// Rename file
export const renameFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const fileId = req.params.fileId;
    const { name }: UpdateFileInput = req.body;

    if (!name) {
      res.status(400).json({ error: 'File name is required' });
      return;
    }

    // Find file
    const file = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check for duplicate name in same folder
    const existingFile = await File.findOne({
      name,
      folderId: file.folderId,
      userId: req.user._id,
      _id: { $ne: fileId },
    });

    if (existingFile) {
      res.status(409).json({
        error: 'A file with this name already exists in this folder',
      });
      return;
    }

    // Update file name
    file.name = name;
    await file.save();

    const fileResponse: FileResponse = {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };

    res.json({
      message: 'File renamed successfully',
      file: fileResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Move file
export const moveFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const fileId = req.params.fileId;
    const { folderId }: UpdateFileInput = req.body;

    if (!folderId) {
      res.status(400).json({ error: 'Destination folder ID is required' });
      return;
    }

    // Find file
    const file = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check if destination folder exists
    const destinationFolder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!destinationFolder) {
      res.status(404).json({ error: 'Destination folder not found' });
      return;
    }

    // Check for duplicate name in destination folder
    const existingFile = await File.findOne({
      name: file.name,
      folderId,
      userId: req.user._id,
    });

    if (existingFile) {
      res.status(409).json({
        error: 'A file with this name already exists in the destination folder',
      });
      return;
    }

    // Update file folder
    file.folderId = folderId;
    await file.save();

    const fileResponse: FileResponse = {
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };

    res.json({
      message: 'File moved successfully',
      file: fileResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Delete file
export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const fileId = req.params.fileId;

    // Find file
    const file = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Delete file from disk
    if (file.filePath && fs.existsSync(file.filePath)) {
      try {
        fs.unlinkSync(file.filePath);
      } catch (error) {
        console.error('Error deleting file from disk:', error);
        // Continue with database deletion even if disk deletion fails
      }
    }

    // Delete file from database
    await File.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Search files
export const searchFiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { query, folderId } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    let searchFilter: any = {
      userId: req.user._id,
      name: { $regex: query, $options: 'i' },
    };

    // If folderId is provided, search only in that folder
    if (folderId && typeof folderId === 'string') {
      searchFilter.folderId = folderId;
    }

    const files = await File.find(searchFilter)
      .populate('folderId', 'name path')
      .sort({ name: 1 })
      .limit(50); // Limit results to prevent large responses

    const filesResponse: FileResponse[] = files.map((file) => ({
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    res.json({
      files: filesResponse,
      count: filesResponse.length,
    });
  } catch (error) {
    next(error);
  }
};

// get files by folder id
export const getFilesByFolderId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const folderId = req.params.folderId;

    const files = await File.find({ folderId, userId: req.user._id }).populate(
      'folderId',
      'name path',
    );

    const filesResponse: FileResponse[] = files.map((file) => ({
      id: file._id.toString(),
      name: file.name,
      folderId: file.folderId.toString(),
      filePath: file.filePath,
      fileSize: file.fileSize,
      formattedSize: formatFileSize(file.fileSize),
      mimeType: file.mimeType,
      originalName: file.originalName,
      isImage: isImage(file.mimeType),
      isPDF: isPDF(file.mimeType),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    res.json({ files: filesResponse });
  } catch (error) {
    next(error);
  }
};
