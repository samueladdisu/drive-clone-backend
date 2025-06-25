import { Request, Response, NextFunction } from 'express';
import {
  AuthRequest,
  FolderInput,
  UpdateFolderInput,
  FolderResponse,
} from '../types';
import Folder from '../models/Folder';
import File from '../models/File';
import { Types } from 'mongoose';
import { formatFileSize, isImage, isPDF } from '../utils/helperFunctions';

// Get folder contents (subfolders and files)
export const getFolderContents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const folderId = req.params.folderId || null;
    let targetFolderId: string;

    // If no folderId provided, get the root folder ID
    if (!folderId) {
      const rootFolder = await Folder.findOne({
        userId: req.user._id,
        isRoot: true,
      });

      if (!rootFolder) {
        res.status(404).json({ error: 'Root folder not found' });
        return;
      }

      targetFolderId = rootFolder._id.toString();
    } else {
      targetFolderId = folderId;
    }

    // Get subfolders (children of the target folder)
    const folders = await Folder.find({
      userId: req.user._id,
      parentId: new Types.ObjectId(targetFolderId),
    }).sort({ name: 1 });

    // Get files in this folder
    const files = await File.find({
      userId: req.user._id,
      folderId: new Types.ObjectId(targetFolderId),
    }).sort({ name: 1 });

    const foldersResponse: FolderResponse[] = folders.map((folder) => ({
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      path: folder.path,
      isRoot: folder.isRoot,
      children: folder.children.map((id) => id.toString()),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));

    const filesResponse = files.map((file) => ({
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

    // Get current folder info
    const currentFolder = await Folder.findById(targetFolderId);

    res.json({
      folders: foldersResponse,
      files: filesResponse,
      currentFolder: currentFolder
        ? {
            id: currentFolder._id.toString(),
            name: currentFolder.name,
            parentId: currentFolder.parentId
              ? currentFolder.parentId.toString()
              : null,
            path: currentFolder.path,
            isRoot: currentFolder.isRoot,
            children: currentFolder.children.map((id) => id.toString()),
            createdAt: currentFolder.createdAt,
            updatedAt: currentFolder.updatedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// Create new folder
export const createFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, parentId }: FolderInput = req.body;

    // If no parentId provided, use the user's root folder
    let finalParentId = parentId;
    if (!parentId) {
      const rootFolder = await Folder.findOne({
        userId: req.user._id,
        isRoot: true,
      });

      if (rootFolder) {
        finalParentId = rootFolder._id;
      } else {
        res.status(500).json({ error: 'Root folder not found' });
        return;
      }
    }

    // Check if parent folder exists and belongs to user
    const parentFolder = await Folder.findOne({
      _id: finalParentId,
      userId: req.user._id,
    });

    if (!parentFolder) {
      res.status(404).json({ error: 'Parent folder not found' });
      return;
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await Folder.findOne({
      name,
      parentId: finalParentId,
      userId: req.user._id,
    });

    if (existingFolder) {
      res.status(409).json({
        error: 'A folder with this name already exists in this location',
      });
      return;
    }

    // Create folder
    const folder = new Folder({
      name,
      parentId: finalParentId,
      userId: req.user._id,
      children: [],
      isRoot: false,
    });

    await folder.save();

    // Add to parent's children array
    if (parentFolder) {
      await parentFolder.addChild(folder._id);
    }

    const folderResponse: FolderResponse = {
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      path: folder.path,
      isRoot: folder.isRoot,
      children: folder.children.map((id) => id.toString()),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };

    res.status(201).json({
      message: 'Folder created successfully',
      folder: folderResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Rename folder
export const renameFolder = async (
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
    const { name }: UpdateFolderInput = req.body;

    if (!name) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }

    // Find folder
    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Check for duplicate name in same parent
    const existingFolder = await Folder.findOne({
      name,
      parentId: folder.parentId,
      userId: req.user._id,
      _id: { $ne: folderId },
    });

    if (existingFolder) {
      res.status(409).json({
        error: 'A folder with this name already exists in this location',
      });
      return;
    }

    // Update folder name
    folder.name = name;
    await folder.save();

    const folderResponse: FolderResponse = {
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      path: folder.path,
      isRoot: folder.isRoot,
      children: folder.children.map((id) => id.toString()),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };

    res.json({
      message: 'Folder renamed successfully',
      folder: folderResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Move folder
export const moveFolder = async (
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
    const { parentId }: UpdateFolderInput = req.body;

    // Find folder
    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Check if new parent exists
    if (parentId) {
      const newParent = await Folder.findOne({
        _id: parentId,
        userId: req.user._id,
      });

      if (!newParent) {
        res.status(404).json({ error: 'Destination folder not found' });
        return;
      }

      // Prevent moving folder into itself or its descendants
      const descendants = await folder.getAllDescendants();
      const descendantIds = descendants.map((d) => d._id.toString());

      if (
        descendantIds.includes(parentId.toString()) ||
        folderId === parentId.toString()
      ) {
        res.status(400).json({
          error: 'Cannot move folder into itself or its subfolders',
        });
        return;
      }
    }

    // Remove from old parent's children
    if (folder.parentId) {
      const oldParent = await Folder.findById(folder.parentId);
      if (oldParent) {
        await oldParent.removeChild(folder._id);
      }
    }

    // Update folder parent
    folder.parentId = parentId || null;
    await folder.save();

    // Add to new parent's children
    if (parentId) {
      const newParent = await Folder.findById(parentId);
      if (newParent) {
        await newParent.addChild(folder._id);
      }
    }

    const folderResponse: FolderResponse = {
      id: folder._id.toString(),
      name: folder.name,
      parentId: folder.parentId ? folder.parentId.toString() : null,
      path: folder.path,
      isRoot: folder.isRoot,
      children: folder.children.map((id) => id.toString()),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };

    res.json({
      message: 'Folder moved successfully',
      folder: folderResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Delete folder
export const deleteFolder = async (
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

    // Find folder
    const folder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    if (folder.isRoot) {
      res.status(400).json({ error: 'Cannot delete root folder' });
      return;
    }

    // Delete all files in this folder
    await File.deleteMany({ folderId: folder._id, userId: req.user._id });

    // Recursively delete all subfolders
    const descendants = await folder.getAllDescendants();
    for (const descendant of descendants) {
      await File.deleteMany({ folderId: descendant._id, userId: req.user._id });
      await Folder.findByIdAndDelete(descendant._id);
    }

    // Remove from parent's children
    if (folder.parentId) {
      const parent = await Folder.findById(folder.parentId);
      if (parent) {
        await parent.removeChild(folder._id);
      }
    }

    // Delete the folder
    await Folder.findByIdAndDelete(folderId);

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get folder breadcrumbs
export const getFolderBreadcrumbs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    let folderId = req.query.folderId as string;
    const breadcrumbs: Array<{ id: string; name: string; path: string }> = [];

    // If folderId is not supplied or is null/empty, use the root folder
    if (!folderId) {
      const rootFolder = await Folder.findOne({
        userId: req.user._id,
        isRoot: true,
      });
      if (!rootFolder) {
        res.status(404).json({ error: 'Root folder not found' });
        return;
      }
      folderId = rootFolder._id.toString();
    }

    let currentFolder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!currentFolder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Build breadcrumbs by traversing up the hierarchy
    while (currentFolder) {
      breadcrumbs.unshift({
        id: currentFolder._id.toString(),
        name: currentFolder.name,
        path: currentFolder.path,
      });

      if (currentFolder.parentId) {
        currentFolder = await Folder.findById(currentFolder.parentId);
      } else {
        break;
      }
    }

    res.json({ breadcrumbs });
  } catch (error) {
    next(error);
  }
};

// Helper function to build nested folder tree recursively
const buildNestedFolderTree = async (
  folderId: string,
  userId: string,
): Promise<any> => {
  const folder = await Folder.findOne({ _id: folderId, userId });
  if (!folder) return null;

  // Get all direct children of this folder
  const children = await Folder.find({
    parentId: folderId,
    userId,
  }).sort({ name: 1 });

  // Recursively build nested children
  const nestedChildren = await Promise.all(
    children.map((child) =>
      buildNestedFolderTree(child._id.toString(), userId),
    ),
  );

  return {
    id: folder._id.toString(),
    name: folder.name,
    path: folder.path,
    isRoot: folder.isRoot,
    children: nestedChildren.filter((child) => child !== null),
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
};

export const getFolderTree = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    let folderId = req.query.folderId as string;

    // If no folderId provided, start from root folder
    if (!folderId) {
      const rootFolder = await Folder.findOne({
        userId: req.user._id,
        isRoot: true,
      });
      if (!rootFolder) {
        res.status(404).json({ error: 'Root folder not found' });
        return;
      }
      folderId = rootFolder._id.toString();
    }

    // Verify the starting folder exists and belongs to user
    const startFolder = await Folder.findOne({
      _id: folderId,
      userId: req.user._id,
    });

    if (!startFolder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Build the complete folder tree in nested format
    const folderTree = await buildNestedFolderTree(
      folderId,
      req.user._id.toString(),
    );

    // Return as array (since the response format expects an array)
    res.json([folderTree].filter((tree) => tree !== null));
  } catch (error) {
    next(error);
  }
};
