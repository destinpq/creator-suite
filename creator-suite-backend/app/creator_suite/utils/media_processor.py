import os
import uuid
import httpx
import ffmpeg
from pathlib import Path
from typing import Tuple, Optional, Dict
from urllib.parse import urlparse
from PIL import Image
import io

from app.core.config import settings


class MediaProcessor:
    """Utility class for downloading videos and generating thumbnails"""
    
    def __init__(self):
        self.storage_root = Path("public/storage")
        self.videos_dir = self.storage_root / "videos"
        self.images_dir = self.storage_root / "images"
        self.thumbnails_dir = self.storage_root / "thumbnails"
        
        # Ensure directories exist
        self.videos_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.thumbnails_dir.mkdir(parents=True, exist_ok=True)
    
    async def combine_video_segments(self, segment_paths: list, output_task_id: str) -> str:
        """
        Combine multiple video segments into a single video.
        
        Args:
            segment_paths: List of paths to video segments
            output_task_id: Task ID for the combined output
            
        Returns:
            Path to the combined video
        """
        if not segment_paths:
            raise ValueError("No segment paths provided")
        
        # Create output filename
        output_filename = f"{output_task_id}_combined_{uuid.uuid4().hex[:8]}.mp4"
        output_path = self.videos_dir / output_filename
        
        try:
            # Create a text file with segment paths for ffmpeg concat
            concat_file = self.videos_dir / f"{output_task_id}_concat.txt"
            
            with open(concat_file, 'w') as f:
                for segment_path in segment_paths:
                    # Ensure absolute path
                    abs_path = Path(segment_path).resolve()
                    f.write(f"file '{abs_path}'\n")
            
            # Use ffmpeg to concatenate videos
            (
                ffmpeg
                .input(str(concat_file), format='concat', safe=0)
                .output(str(output_path), 
                       vcodec='libx264', 
                       acodec='aac',
                       **{'avoid_negative_ts': 'make_zero'})
                .run(overwrite_output=True, quiet=True)
            )
            
            # Clean up concat file
            concat_file.unlink()
            
            return str(output_path)
            
        except Exception as e:
            print(f"Error combining video segments: {e}")
            raise
        """
        Download video from URL and generate thumbnail.
        
        Args:
            video_url: URL of the video to download
            task_id: Task ID for unique naming
            
        Returns:
            Tuple of (local_video_path, local_thumbnail_path)
        """
        # Generate unique filename
        file_extension = self._get_file_extension(video_url)
        video_filename = f"{task_id}_{uuid.uuid4().hex[:8]}{file_extension}"
        thumbnail_filename = f"{task_id}_{uuid.uuid4().hex[:8]}.jpg"
        
        video_path = self.videos_dir / video_filename
        thumbnail_path = self.thumbnails_dir / thumbnail_filename
        
        # Download video
        await self._download_file(video_url, video_path)
        
        # Generate thumbnail
        self._generate_thumbnail(video_path, thumbnail_path)
        
        # Return relative paths for database storage
        video_relative_path = f"/storage/videos/{video_filename}"
        thumbnail_relative_path = f"/storage/thumbnails/{thumbnail_filename}"
        
        return video_relative_path, thumbnail_relative_path
    
    async def download_and_process_image(self, image_url: str, task_id: str) -> Tuple[str, str]:
        """
        Download image from URL and generate thumbnail.
        
        Args:
            image_url: URL of the image to download
            task_id: Task ID for unique naming
            
        Returns:
            Tuple of (local_image_path, local_thumbnail_path)
        """
        # Generate unique filename
        file_extension = self._get_file_extension(image_url, default='.png')
        image_filename = f"{task_id}_{uuid.uuid4().hex[:8]}{file_extension}"
        thumbnail_filename = f"{task_id}_{uuid.uuid4().hex[:8]}_thumb.jpg"
        
        image_path = self.images_dir / image_filename
        thumbnail_path = self.thumbnails_dir / thumbnail_filename
        
        # Download image
        await self._download_file(image_url, image_path)
        
        # Generate thumbnail from image
        self._generate_image_thumbnail(image_path, thumbnail_path)
        
        # Return relative paths for database storage
        image_relative_path = f"/storage/images/{image_filename}"
        thumbnail_relative_path = f"/storage/thumbnails/{thumbnail_filename}"
        
        return image_relative_path, thumbnail_relative_path
    
    async def _download_file(self, url: str, save_path: Path) -> None:
        """Download file from URL to local path"""
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            with open(save_path, 'wb') as f:
                f.write(response.content)
    
    def _generate_thumbnail(self, video_path: Path, thumbnail_path: Path) -> None:
        """Generate thumbnail from video file"""
        try:
            # Try to generate thumbnail from the middle of the video
            (
                ffmpeg
                .input(str(video_path), ss='00:00:01')
                .output(str(thumbnail_path), vframes=1, format='image2', vcodec='mjpeg')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            # Fallback: try to get the first frame
            try:
                (
                    ffmpeg
                    .input(str(video_path))
                    .output(str(thumbnail_path), vframes=1, format='image2', vcodec='mjpeg')
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
            except ffmpeg.Error as e2:
                raise Exception(f"Failed to generate thumbnail: {e2.stderr.decode() if e2.stderr else str(e2)}")
    
    def _generate_image_thumbnail(self, image_path: Path, thumbnail_path: Path, max_size: Tuple[int, int] = (512, 512)) -> None:
        """Generate thumbnail from image file"""
        try:
            with Image.open(image_path) as img:
                # Convert RGBA to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create a white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Generate thumbnail
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            raise Exception(f"Failed to generate image thumbnail: {str(e)}")
    
    def _get_file_extension(self, url: str, default: str = '.mp4') -> str:
        """Extract file extension from URL"""
        parsed = urlparse(url)
        path = parsed.path
        
        # Get extension from path
        if '.' in path:
            extension = Path(path).suffix
            if extension:
                return extension
        
        # Return default extension
        return default
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size in bytes"""
        full_path = self.storage_root.parent / file_path.lstrip('/')
        if full_path.exists():
            return full_path.stat().st_size
        return None
    
    def delete_local_files(self, video_path: Optional[str] = None, 
                           image_path: Optional[str] = None, 
                           thumbnail_path: Optional[str] = None) -> None:
        """Delete local files when they're no longer needed"""
        if video_path:
            full_video_path = self.storage_root.parent / video_path.lstrip('/')
            if full_video_path.exists():
                full_video_path.unlink()
        
        if image_path:
            full_image_path = self.storage_root.parent / image_path.lstrip('/')
            if full_image_path.exists():
                full_image_path.unlink()
        
        if thumbnail_path:
            full_thumbnail_path = self.storage_root.parent / thumbnail_path.lstrip('/')
            if full_thumbnail_path.exists():
                full_thumbnail_path.unlink()


# Standalone function for backward compatibility and Celery tasks
def download_and_save_media(media_url: str, task_id: str, media_type: str = "video") -> Optional[Dict[str, str]]:
    """
    Download media (video or image) and save locally with thumbnail generation.
    
    Args:
        media_url: URL of the media to download
        task_id: Task ID for unique naming
        media_type: Type of media ("video" or "image")
        
    Returns:
        Dictionary with local paths or None if failed
    """
    import asyncio
    
    processor = MediaProcessor()
    
    try:
        # Always create a new event loop for Celery tasks
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            if media_type == "video":
                video_path, thumbnail_path = loop.run_until_complete(
                    processor.download_and_process_video(media_url, task_id)
                )
                return {
                    "video_path": video_path,
                    "thumbnail_path": thumbnail_path
                }
            elif media_type == "image":
                image_path, thumbnail_path = loop.run_until_complete(
                    processor.download_and_process_image(media_url, task_id)
                )
                return {
                    "image_path": image_path,
                    "thumbnail_path": thumbnail_path
                }
            else:
                raise ValueError(f"Unsupported media type: {media_type}")
        finally:
            loop.close()
            
    except Exception as e:
        print(f"Failed to download and save media: {e}")
        return None