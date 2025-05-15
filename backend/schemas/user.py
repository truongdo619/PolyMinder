from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True

# class UserCreate(BaseModel):
#     username: str
#     password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenRefresh(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: str

class ParaUpdate(BaseModel):
    paragraphs: list
    