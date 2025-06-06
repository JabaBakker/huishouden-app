import { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

function App() {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('normaal');
  const [deadline, setDeadline] = useState('');
  const [taskList, setTaskList] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/tasks")
      .then((res) => res.json())
      .then((data) => setTaskList(data))
      .catch((err) => console.error("Fout bij ophalen taken:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newTask = { subject, priority, deadline, status: "backlog" };

    try {
      const response = await fetch('http://localhost:8000/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      const result = await response.json();
      console.log('Backend response:', result);

      setSubject('');
      setPriority('normaal');
      setDeadline('');

      const updatedTasks = await fetch("http://localhost:8000/tasks").then(res => res.json());
      setTaskList(updatedTasks);

    } catch (error) {
      console.error('Fout bij versturen taak:', error);
    }
  };

  const handleMarkAsDone = (taskId) => {
    const task = taskList.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, status: "klaar" };

    setTaskList((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    }).catch(err => console.error("Fout bij afronden taak:", err));
  };

  const handleDelete = (taskId) => {
    setTaskList((prev) => prev.filter((t) => t.id !== taskId));

    fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: "DELETE",
    }).catch(err => console.error("Fout bij verwijderen taak:", err));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🧹 Huishoudplanner</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Onderwerp:</label><br />
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label>Belangrijkheid:</label><br />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
          </select>
        </div>
        <div>
          <label>Deadline:</label><br />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <button type="submit" style={{ marginTop: '1rem' }}>Taak toevoegen</button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={() => setShowOnlyActive(!showOnlyActive)}
          />
          Toon alleen actieve taken
        </label>
      </div>

      <hr style={{ margin: '2rem 0' }} />
      <h2>📋 Takenbord</h2>

      <DragDropContext
        onDragEnd={(result) => {
          const { source, destination } = result;
          if (!destination || source.droppableId === destination.droppableId) return;

          const filteredTasks = taskList.filter((task) => task.status === source.droppableId);
          const movedTask = filteredTasks[source.index];
          const updatedTask = { ...movedTask, status: destination.droppableId };

          setTaskList((prev) => prev.map((t) => (t.id === movedTask.id ? updatedTask : t)));

          fetch(`http://localhost:8000/tasks/${movedTask.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask),
          }).catch(err => console.error("Fout bij updaten taak:", err));
        }}
      >
        <div style={{ display: "flex", gap: "2rem" }}>
          {["backlog", "bezig", "klaar"].map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flex: 1,
                    minHeight: "100px",
                    border: "1px solid #ddd",
                    padding: "1rem",
                    borderRadius: "8px",
                    background: "#f9f9f9",
                  }}
                >
                  <h3>
                    {status === "backlog" && "📥 Backlog"}
                    {status === "bezig" && "🛠️ Bezig"}
                    {status === "klaar" && "✅ Klaar"}
                  </h3>
                  {taskList
                    .filter((task) => task.status === status)
                    .filter((task) => !showOnlyActive || task.status !== "klaar")
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: "0.5rem",
                              marginBottom: "0.5rem",
                              background: "white",
                              borderRadius: "4px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <strong>{task.subject}</strong> – {task.priority}<br />
                            {task.deadline && (
                              <span style={{ color: new Date(task.deadline) < new Date() ? 'red' : 'inherit' }}>
                                Deadline: {task.deadline}
                              </span>
                            )}<br />
                            {task.status !== "klaar" && (
                              <button
                                style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}
                                onClick={() => handleMarkAsDone(task.id)}
                              >
                                ✅ Markeer als klaar
                              </button>
                            )}
                            <button
                              style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                              onClick={() => handleDelete(task.id)}
                            >
                              ❌ Verwijderen
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;
