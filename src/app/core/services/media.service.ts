import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { IMedia, IMediaUploadResponse } from '../interfaces/media';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private baseUrl = environment.SERVER_URL;

  uploadFile(
    file: File,
    workspaceId: string,
  ): Observable<{ type: 'progress'; progress: number } | { type: 'complete'; media: IMedia }> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('workspaceId', workspaceId);

    return this.http
      .post<IMediaUploadResponse>(`${this.baseUrl}/api/media/upload`, formData, {
        reportProgress: true,
        observe: 'events',
        withCredentials: true,
      })
      .pipe(
        filter(
          (event: HttpEvent<IMediaUploadResponse>) =>
            event.type === HttpEventType.UploadProgress ||
            event.type === HttpEventType.Response,
        ),
        map((event: HttpEvent<IMediaUploadResponse>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { type: 'progress' as const, progress };
          }
          const body = (event as any).body as IMediaUploadResponse;
          return { type: 'complete' as const, media: body.media[0] };
        }),
      );
  }

  deleteMedia(mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/media/${mediaId}`, {
      withCredentials: true,
    });
  }

  getMediaUrl(urlOrMedia: string | IMedia): string {
    const url = typeof urlOrMedia === 'string' ? urlOrMedia : urlOrMedia.url;
    if (url.startsWith('http')) return url;
    return `${this.baseUrl}${url}`;
  }
}
