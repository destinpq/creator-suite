import { request } from '@umijs/max';

export type ShowcaseItem = {
  id?: string | number;
  kind: 'video' | 'image';
  src: string; // playable URL for videos or full image URL
  thumbnail?: string; // optional thumbnail
  title?: string;
};

async function tryRequest<T>(url: string): Promise<T | null> {
  try {
    const res = await request<T>(url, { method: 'GET' });
    return res as unknown as T;
  } catch (e) {
    return null;
  }
}

export async function fetchShowcaseMedia(): Promise<ShowcaseItem[]> {
  // Prefer remote API in dev so the landing page looks populated even without a local backend
  const REMOTE_BASE = 'https://video-api.destinpq.com/api/v1';
  const remoteCandidates = [
    `${REMOTE_BASE}/media/showcase`,
    `${REMOTE_BASE}/public/showcase`,
    `${REMOTE_BASE}/creations/featured`,
  ];

  for (const url of remoteCandidates) {
    const data: any = await tryRequest<any>(url);
    if (Array.isArray(data) && data.length > 0) {
      const normalized: ShowcaseItem[] = data
        .map((item: any) => {
          if (item?.src && item?.kind) {
            // Already normalized
            return item as ShowcaseItem;
          }
          if (item?.id && item?.task_type) {
            if (item.task_type === 'video') {
              return {
                id: item.id,
                kind: 'video',
                src: `${REMOTE_BASE}/media/videos/${item.id}`,
                thumbnail: `${REMOTE_BASE}/media/thumbnails/${item.id}`,
                title: item?.input_data?.prompt?.slice(0, 80) || 'Generated Video',
              } as ShowcaseItem;
            }
            if (item.task_type === 'image') {
              return {
                id: item.id,
                kind: 'image',
                src: `${REMOTE_BASE}/media/images/${item.id}`,
                thumbnail: `${REMOTE_BASE}/media/images/${item.id}`,
                title: item?.input_data?.prompt?.slice(0, 80) || 'Generated Image',
              } as ShowcaseItem;
            }
          }
          return null;
        })
        .filter(Boolean) as ShowcaseItem[];
      if (normalized.length > 0) return normalized;
    }
  }

  // Try local/proxied endpoints (if a dev backend is running behind /api)
  const candidates = [
    '/api/v1/media/showcase',
    '/api/v1/public/showcase',
    '/api/v1/creations/featured',
  ];

  for (const url of candidates) {
    const data: any = await tryRequest<any>(url);
    if (Array.isArray(data) && data.length > 0) {
      // Attempt to normalize common shapes
      const normalized: ShowcaseItem[] = data
        .map((item: any) => {
          if (item?.src && item?.kind) {
            return item as ShowcaseItem;
          }
          // If returned creation records
          if (item?.id && item?.task_type) {
            if (item.task_type === 'video') {
              return {
                id: item.id,
                kind: 'video',
                src: `https://video-api.destinpq.com/api/v1/media/videos/${item.id}`,
                thumbnail: `https://video-api.destinpq.com/api/v1/media/thumbnails/${item.id}`,
                title: item?.input_data?.prompt?.slice(0, 80) || 'Generated Video',
              } as ShowcaseItem;
            }
            if (item.task_type === 'image') {
              return {
                id: item.id,
                kind: 'image',
                src: `https://video-api.destinpq.com/api/v1/media/images/${item.id}`,
                thumbnail: `https://video-api.destinpq.com/api/v1/media/images/${item.id}`,
                title: item?.input_data?.prompt?.slice(0, 80) || 'Generated Image',
              } as ShowcaseItem;
            }
          }
          return null;
        })
        .filter(Boolean) as ShowcaseItem[];
      if (normalized.length > 0) return normalized;
    }
  }

  // Fallback: query recent public creations if available
  const recent = await tryRequest<any>(
    '/api/v1/creations/?limit=12&status=completed&public=true'
  );
  if (Array.isArray(recent) && recent.length > 0) {
    return recent.map((item: any) => ({
      id: item.id,
      kind: item.task_type === 'image' ? 'image' : 'video',
      src:
        item.task_type === 'image'
          ? `https://video-api.destinpq.com/api/v1/media/images/${item.id}`
          : `https://video-api.destinpq.com/api/v1/media/videos/${item.id}`,
      thumbnail: `https://video-api.destinpq.com/api/v1/media/thumbnails/${item.id}`,
      title: item?.input_data?.prompt?.slice(0, 80) || 'Creation',
    }));
  }

  // Final fallback: static samples
  return [
    {
      kind: 'video',
      src: '/service-examples/veo-3.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Cinematic Sample',
    },
    {
      kind: 'video',
      src: '/service-examples/minimax-video-1.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Product Reel',
    },
    {
      kind: 'video',
      src: '/service-examples/minimaxhailu-2.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Atom Visuals',
    },
  ];
}


