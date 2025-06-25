import { Router } from 'express';
import {
  uploadFile,
  downloadFile,
  getFileInfo,
  renameFile,
  moveFile,
  deleteFile,
  searchFiles,
} from '../controllers/fileController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest, updateFileSchema } from '../utils/validation';
import { upload } from '../utils/upload';

const router = Router();

// Search files
router.get('/search', authenticateToken, searchFiles);

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), uploadFile);

// Download file
router.get('/download/:fileId', authenticateToken, downloadFile);

// Rename file
router.put(
  '/rename/:fileId',
  authenticateToken,
  validateRequest(updateFileSchema),
  renameFile,
);

// Move file
router.put(
  '/move/:fileId',
  authenticateToken,
  validateRequest(updateFileSchema),
  moveFile,
);

// Delete file
router.delete('/delete/:fileId', authenticateToken, deleteFile);

// Get file info (last to avoid conflicts)
router.get('/:fileId', authenticateToken, getFileInfo);

export default router;
