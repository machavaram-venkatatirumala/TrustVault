import io
from typing import BinaryIO
from .base import BaseStorageProvider

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None
    ClientError = Exception


class S3StorageProvider(BaseStorageProvider):
    """S3-compatible object storage provider."""

    def __init__(self, bucket_name: str, endpoint_url: str = None, access_key: str = None, secret_key: str = None, region: str = "us-east-1"):
        if not boto3:
            raise ImportError("boto3 is required for S3StorageProvider.")
            
        self.bucket_name = bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    def save(self, key: str, stream: BinaryIO) -> int:
        position = stream.tell() if hasattr(stream, "tell") else 0
        self.client.upload_fileobj(stream, self.bucket_name, key)
        new_pos = stream.tell() if hasattr(stream, "tell") else 0
        return max(0, new_pos - position)

    def get_stream(self, key: str) -> BinaryIO:
        response = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return response["Body"]

    def get_bytes(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket_name, Key=key)
        return response["Body"].read()

    def delete(self, key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError:
            return False
