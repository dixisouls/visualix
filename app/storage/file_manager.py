"""
File storage management utilities.
"""

import shutil
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timedelta

from app.config import settings
from app.core.exceptions import StorageError


class FileManager:
    """
    Manages file operations for video uploads, outputs, and temporary files.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Ensure directories exist
        settings.upload_dir.mkdir(exist_ok=True)
        settings.output_dir.mkdir(exist_ok=True)
        settings.temp_dir.mkdir(exist_ok=True)
    
    def save_upload(self, job_id: str, filename: str, content: bytes) -> Path:
        """
        Save uploaded file content to disk.
        
        Args:
            job_id: Unique job identifier
            filename: Original filename
            content: File content bytes
            
        Returns:
            Path to saved file
        """
        try:
            # Create safe filename
            safe_filename = f"{job_id}_{self._sanitize_filename(filename)}"
            file_path = settings.upload_dir / safe_filename
            
            # Write file
            with open(file_path, "wb") as f:
                f.write(content)
            
            self.logger.info(f"Saved upload: {file_path}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"Error saving upload: {str(e)}")
            raise StorageError(f"Failed to save upload: {str(e)}")
    
    def get_upload_path(self, job_id: str) -> Optional[Path]:
        """Get the upload file path for a job."""
        upload_files = list(settings.upload_dir.glob(f"{job_id}_*"))
        return upload_files[0] if upload_files else None
    
    def get_output_path(self, job_id: str, suffix: str = "processed") -> Path:
        """Generate output path for processed video."""
        filename = f"{job_id}_{suffix}.mp4"
        return settings.output_dir / filename
    
    def get_temp_path(self, job_id: str, suffix: str = "temp") -> Path:
        """Generate temporary file path."""
        filename = f"{job_id}_{suffix}_{int(datetime.now().timestamp())}.mp4"
        return settings.temp_dir / filename
    
    def delete_job_files(self, job_id: str) -> List[str]:
        """
        Delete all files associated with a job.
        
        Returns:
            List of deleted file paths
        """
        deleted_files = []
        
        try:
            # Delete uploads
            for upload_file in settings.upload_dir.glob(f"{job_id}_*"):
                upload_file.unlink()
                deleted_files.append(str(upload_file))
            
            # Delete outputs  
            for output_file in settings.output_dir.glob(f"{job_id}_*"):
                output_file.unlink()
                deleted_files.append(str(output_file))
            
            # Delete temp files
            for temp_file in settings.temp_dir.glob(f"{job_id}_*"):
                temp_file.unlink()
                deleted_files.append(str(temp_file))
            
            self.logger.info(f"Deleted {len(deleted_files)} files for job {job_id}")
            
        except Exception as e:
            self.logger.error(f"Error deleting job files: {str(e)}")
            raise StorageError(f"Failed to delete job files: {str(e)}")
        
        return deleted_files
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        Clean up old temporary and processed files.
        
        Args:
            max_age_hours: Files older than this will be deleted
            
        Returns:
            Number of files deleted
        """
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        deleted_count = 0
        
        try:
            # Clean temp directory
            for temp_file in settings.temp_dir.iterdir():
                if temp_file.is_file():
                    file_time = datetime.fromtimestamp(temp_file.stat().st_mtime)
                    if file_time < cutoff_time:
                        temp_file.unlink()
                        deleted_count += 1
            
            # Clean old outputs (optional - be careful with this)
            # Uncomment if you want to auto-delete old processed videos
            # for output_file in settings.output_dir.iterdir():
            #     if output_file.is_file():
            #         file_time = datetime.fromtimestamp(output_file.stat().st_mtime)
            #         if file_time < cutoff_time:
            #             output_file.unlink()
            #             deleted_count += 1
            
            if deleted_count > 0:
                self.logger.info(f"Cleaned up {deleted_count} old files")
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {str(e)}")
        
        return deleted_count
    
    def get_storage_stats(self) -> dict:
        """Get storage usage statistics."""
        try:
            stats = {
                "upload_dir": self._get_directory_stats(settings.upload_dir),
                "output_dir": self._get_directory_stats(settings.output_dir),
                "temp_dir": self._get_directory_stats(settings.temp_dir),
            }
            
            # Calculate totals
            stats["total_files"] = sum(s["file_count"] for s in stats.values())
            stats["total_size"] = sum(s["total_size"] for s in stats.values())
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting storage stats: {str(e)}")
            return {"error": str(e)}
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent security issues."""
        # Remove path components
        filename = Path(filename).name
        
        # Replace potentially problematic characters
        safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"
        sanitized = "".join(c if c in safe_chars else "_" for c in filename)
        
        # Ensure it's not empty and not too long
        if not sanitized or sanitized.startswith("."):
            sanitized = "upload" + sanitized
        
        return sanitized[:100]  # Limit length
    
    def _get_directory_stats(self, directory: Path) -> dict:
        """Get statistics for a directory."""
        try:
            files = list(directory.iterdir())
            file_count = len([f for f in files if f.is_file()])
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            
            return {
                "file_count": file_count,
                "total_size": total_size,
                "total_size_mb": total_size / (1024 * 1024)
            }
            
        except Exception as e:
            return {"error": str(e), "file_count": 0, "total_size": 0}
