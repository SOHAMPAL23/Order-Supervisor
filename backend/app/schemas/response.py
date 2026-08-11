from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

DataType = TypeVar("DataType")

class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None

class APIResponse(BaseModel, Generic[DataType]):
    success: bool
    data: Optional[DataType] = None
    error: Optional[ErrorDetails] = None

    @classmethod
    def ok(cls, data: DataType) -> "APIResponse[DataType]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, code: str, message: str, details: Optional[dict] = None) -> "APIResponse[DataType]":
        return cls(success=False, data=None, error=ErrorDetails(code=code, message=message, details=details))
