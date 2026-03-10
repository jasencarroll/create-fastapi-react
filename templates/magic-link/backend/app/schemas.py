from pydantic import BaseModel


class SendMagicLinkRequest(BaseModel):
    email: str


class UserResponse(BaseModel):
    id: str
    email: str


class AuthMeResponse(BaseModel):
    user: UserResponse | None
