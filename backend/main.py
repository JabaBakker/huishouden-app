from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select

# --- Database model ---
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subject: str
    priority: str
    deadline: str
    status: str = "backlog"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite database setup
sqlite_file = "tasks.db"
engine = create_engine(f"sqlite:///{sqlite_file}", echo=False)

# Database aanmaken
def create_db():
    SQLModel.metadata.create_all(engine)

create_db()

# --- Routes ---
@app.get("/")
def read_root():
    return {"message": "Huishoud-app API draait"}

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    with Session(engine) as session:
        tasks = session.exec(select(Task)).all()
        return tasks

@app.post("/tasks", response_model=Task)
def create_task(task: Task):
    with Session(engine) as session:
        session.add(task)
        session.commit()
        session.refresh(task)
        return task


@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, updated_task: Task):
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Taak niet gevonden")
        task.subject = updated_task.subject
        task.priority = updated_task.priority
        task.deadline = updated_task.deadline
        task.status = updated_task.status
        session.commit()
        session.refresh(task)
        return task

# In-memory opslag (tijdelijk)
#tasks = []

#class Task(BaseModel):
#    subject: str
#    priority: str
#    deadline: str
#    status: str = "backlog" # standaardstatus



#@app.post("/tasks")
#def create_task(task: Task):
#    tasks.append(task)
#    return {"message": "Taak opgeslagen", "task": task}

#@app.get("/tasks")
#def get_tasks():
#    return tasks

#@app.put("/tasks/{task_id}")
#def update_task(task_id: int, updated_task: Task):
#    if task_id < 0 or task_id >= len(tasks):
#        return {"error": "Ongeldig ID"}
#    tasks[task_id] = updated_task
#    return {"message": "Taak bijgewerkt", "task": updated_task}