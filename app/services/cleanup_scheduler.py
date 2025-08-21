"""
Scheduled cleanup service that clears all files periodically.
"""

import asyncio
import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict

from app.config import settings


class ScheduledCleanupService:
    """Service that performs periodic cleanup of all video files."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.is_running = False
        self.cleanup_task = None
        
    async def start(self):
        """Start the scheduled cleanup service."""
        if self.is_running:
            self.logger.warning("Cleanup service is already running")
            return
            
        self.is_running = True
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        self.logger.info("Scheduled cleanup service started - will run every hour")
        
    async def stop(self):
        """Stop the scheduled cleanup service."""
        self.is_running = False
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Scheduled cleanup service stopped")
        
    async def _cleanup_loop(self):
        """Main cleanup loop that runs every hour."""
        while self.is_running:
            try:
                # Wait for 1 hour (3600 seconds)
                await asyncio.sleep(3600)
                
                if self.is_running:  # Check again in case we're stopping
                    await self.cleanup_all_directories()
                    
            except asyncio.CancelledError:
                self.logger.info("Cleanup loop cancelled")
                break
            except Exception as e:
                self.logger.error(f"Error in cleanup loop: {e}")
                # Continue running even if there's an error
                continue
                
    async def cleanup_all_directories(self) -> Dict[str, int]:
        """
        Clean up all directories completely.
        
        Returns:
            Dictionary with cleanup statistics
        """
        cleanup_stats = {
            "uploads_cleared": 0,
            "outputs_cleared": 0,
            "temp_cleared": 0,
            "total_files_deleted": 0,
            "total_size_freed_mb": 0.0
        }
        
        self.logger.info("🧹 Starting scheduled cleanup of all directories")
        
        try:
            # Clean uploads directory
            uploads_stats = await self._clean_directory(settings.upload_dir, "uploads")
            cleanup_stats["uploads_cleared"] = uploads_stats["files_deleted"]
            cleanup_stats["total_files_deleted"] += uploads_stats["files_deleted"]
            cleanup_stats["total_size_freed_mb"] += uploads_stats["size_freed_mb"]
            
            # Clean outputs directory
            outputs_stats = await self._clean_directory(settings.output_dir, "outputs")
            cleanup_stats["outputs_cleared"] = outputs_stats["files_deleted"]
            cleanup_stats["total_files_deleted"] += outputs_stats["files_deleted"]
            cleanup_stats["total_size_freed_mb"] += outputs_stats["size_freed_mb"]
            
            # Clean temp directory
            temp_stats = await self._clean_directory(settings.temp_dir, "temp")
            cleanup_stats["temp_cleared"] = temp_stats["files_deleted"]
            cleanup_stats["total_files_deleted"] += temp_stats["files_deleted"]
            cleanup_stats["total_size_freed_mb"] += temp_stats["size_freed_mb"]
            
            self.logger.info(
                f"🧹 Scheduled cleanup completed: "
                f"{cleanup_stats['total_files_deleted']} files deleted, "
                f"{cleanup_stats['total_size_freed_mb']:.2f} MB freed"
            )
            
        except Exception as e:
            self.logger.error(f"Error during scheduled cleanup: {e}")
            
        return cleanup_stats
        
    async def _clean_directory(self, directory: Path, name: str) -> Dict[str, any]:
        """
        Clean a specific directory.
        
        Args:
            directory: Path to the directory to clean
            name: Name of the directory for logging
            
        Returns:
            Dictionary with cleanup statistics
        """
        stats = {"files_deleted": 0, "size_freed_mb": 0.0}
        
        try:
            if not directory.exists():
                self.logger.info(f"Directory {name} doesn't exist, skipping")
                return stats
                
            # Get all files in the directory
            files = list(directory.iterdir())
            
            if not files:
                self.logger.info(f"Directory {name} is already empty")
                return stats
                
            # Calculate total size before deletion
            total_size = 0
            for file_path in files:
                if file_path.is_file():
                    try:
                        total_size += file_path.stat().st_size
                    except (OSError, FileNotFoundError):
                        pass  # File might have been deleted by another process
                        
            # Delete all files and subdirectories
            for file_path in files:
                try:
                    if file_path.is_file():
                        file_path.unlink()
                        stats["files_deleted"] += 1
                    elif file_path.is_dir():
                        shutil.rmtree(file_path)
                        stats["files_deleted"] += 1  # Count directories as 1 item
                        
                except (OSError, FileNotFoundError) as e:
                    self.logger.warning(f"Could not delete {file_path}: {e}")
                    
            stats["size_freed_mb"] = total_size / (1024 * 1024)
            
            self.logger.info(
                f"Cleaned {name} directory: {stats['files_deleted']} items deleted, "
                f"{stats['size_freed_mb']:.2f} MB freed"
            )
            
        except Exception as e:
            self.logger.error(f"Error cleaning {name} directory: {e}")
            
        return stats
        
    async def cleanup_now(self) -> Dict[str, int]:
        """Perform immediate cleanup (for manual triggers)."""
        self.logger.info("Manual cleanup triggered")
        return await self.cleanup_all_directories()
        
    def get_next_cleanup_time(self) -> str:
        """Get the estimated time of the next cleanup."""
        # This is approximate since we don't track exact timing
        if not self.is_running:
            return "Service not running"
            
        # For simplicity, just say "within the next hour"
        return "Within the next hour"
        
    def get_status(self) -> Dict[str, any]:
        """Get the current status of the cleanup service."""
        return {
            "is_running": self.is_running,
            "next_cleanup": self.get_next_cleanup_time(),
            "service_started": datetime.now().isoformat() if self.is_running else None
        }


# Global cleanup service instance
cleanup_service = ScheduledCleanupService()


async def start_cleanup_service():
    """Start the global cleanup service."""
    await cleanup_service.start()


async def stop_cleanup_service():
    """Stop the global cleanup service."""
    await cleanup_service.stop()


async def manual_cleanup():
    """Trigger manual cleanup."""
    return await cleanup_service.cleanup_now()


def get_cleanup_status():
    """Get cleanup service status."""
    return cleanup_service.get_status()