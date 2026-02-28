"""S3/R2 storage integration."""

from typing import Tuple
import boto3
from botocore.config import Config

from ..config import get_settings

settings = get_settings()


class StorageService:
    """S3-compatible storage service (S3/Cloudflare R2)."""

    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        self.bucket = settings.S3_BUCKET_NAME
        self.public_url = settings.S3_PUBLIC_URL

    async def generate_presigned_upload_url(
        self,
        key: str,
        expires_in: int = 3600,
        content_type: str = "image/jpeg",
    ) -> Tuple[str, str]:
        """
        Generate a presigned URL for direct upload.
        Returns (upload_url, public_url).
        """
        upload_url = self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

        # Public URL for accessing the file
        if self.public_url:
            public_url = f"{self.public_url}/{key}"
        else:
            public_url = f"https://{self.bucket}.s3.amazonaws.com/{key}"

        return upload_url, public_url

    async def generate_presigned_download_url(
        self,
        key: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate a presigned URL for downloading."""
        return self.client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket,
                "Key": key,
            },
            ExpiresIn=expires_in,
        )

    async def delete_file(self, key: str) -> bool:
        """Delete a file from storage."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception:
            return False

    async def upload_file(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload file directly (for server-side uploads)."""
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

        if self.public_url:
            return f"{self.public_url}/{key}"
        return f"https://{self.bucket}.s3.amazonaws.com/{key}"
