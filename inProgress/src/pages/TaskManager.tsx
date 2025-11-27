import React, { useState } from 'react';
import './TaskManager.css';

interface Task {
  id: number;
  text: string;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');

  const handleAddTask = () => {
    if (taskInput.trim() === '') return;
    const newTask: Task = {
      id: Date.now(),
      text: taskInput,
    };
    setTasks([...tasks, newTask]);
    setTaskInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  return (
    <div className="task-manager">
      <h1>Notes</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Add a note..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleAddTask}>Add</button>
      </div>
      <div className="notes-container">
        {tasks.map((task) => (
          <div className="note" key={task.id}>
            {task.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
