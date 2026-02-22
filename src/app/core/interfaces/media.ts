export type MediaType = 'image' | 'video';

export type MediaProcessingStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface IMedia {
  _id: string;
  workspaceId: string;
  originalFileName?: string;
  mimeType?: string;
  size?: number;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  processingStatus: MediaProcessingStatus;
  uploadedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMediaUploadResponse {
  media: IMedia[];
}

export interface IMediaUploadItem {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  media?: IMedia;
  error?: string;
}
