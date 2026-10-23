from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class BaseStorageProvider(ABC):
    """Abstract base class for document storage backends."""

    @abstractmethod
    def save(self, key: str, stream: BinaryIO) -> int:
        """Saves content from stream to storage key. Returns number of bytes saved."""
        pass

    @abstractmethod
    def get_stream(self, key: str) -> BinaryIO:
        """Returns a readable binary stream for the given storage key."""
        pass

    @abstractmethod
    def get_bytes(self, key: str) -> bytes:
        """Returns the full bytes of the stored object."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Deletes the stored object. Returns True if deleted or did not exist."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Checks if the object exists in storage."""
        pass
