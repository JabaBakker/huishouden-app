from sqlmodel import SQLModel, Field
from typing import Optional

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject: str
    priority: str
    deadline: str
    status: str = "backlog"
