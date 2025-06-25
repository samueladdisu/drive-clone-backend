import { Router } from 'express';
import {
  getFolderContents,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getFolderBreadcrumbs,
  getFolderTree,
} from '../controllers/folderController';
import { authenticateToken } from '../middlewares/auth';
import {
  validateRequest,
  folderSchema,
  updateFolderSchema,
} from '../utils/validation';

const router = Router();

// Get root folder contents
router.get('/', authenticateToken, getFolderContents);

// Create new folder
router.post(
  '/',
  authenticateToken,
  validateRequest(folderSchema),
  createFolder,
);

// Get folder breadcrumbs
router.get('/breadcrumbs', authenticateToken, getFolderBreadcrumbs);

// Get folder tree
router.get('/tree', authenticateToken, getFolderTree);

// Rename folder
router.put(
  '/rename/:folderId',
  authenticateToken,
  validateRequest(updateFolderSchema),
  renameFolder,
);

// Move folder
router.put(
  '/move/:folderId',
  authenticateToken,
  validateRequest(updateFolderSchema),
  moveFolder,
);

// Delete folder
router.delete('/delete/:folderId', authenticateToken, deleteFolder);

// Get specific folder contents (last to avoid conflicts)
router.get('/:folderId', authenticateToken, getFolderContents);

export default router;
