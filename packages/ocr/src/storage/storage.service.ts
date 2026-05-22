// StorageService moved to @lince/database — import+re-export explicitly to work with isolatedModules
import { StorageService, ALLOWED_MIME_TYPES } from '@lince/database';
import type { AllowedMimeType, PresignedUploadResult } from '@lince/database';
export { StorageService, ALLOWED_MIME_TYPES };
export type { AllowedMimeType, PresignedUploadResult };
