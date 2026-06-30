import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../utils/storage';
import { auth } from '../utils/firebase';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(true);

  // Subscribe to tasks on mount
  useEffect(() => {
    const unsubscribe = subscribeToTasks((storedTasks) => {
      const migratedTasks = storedTasks.map(t => {
        if (t.stones) return t; // already migrated
        return {
          id: t.id,
          title: t.title,
          note: t.note,
          customer: t.customer,
          seller: t.seller,
          completed: t.completed,
          createdAt: t.createdAt,
          stones: [{
            id: t.id + '-stone',
            size: t.size || '',
            shape: t.shape || '',
            color: t.color || '',
            clarity: t.clarity || '',
            cut: t.cut || '',
            certNumber: t.certNumber || '',
            buyPrice: t.buyPrice || '',
            sellPrice: t.sellPrice || '',
            image: t.image || null
          }]
        };
      });

      setTasks(migratedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    return () => unsubscribe();
  }, []);

  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      await updateTask(taskData);
      setEditingTask(null);
    } else {
      await addTask(taskData);
    }
    // Mobile friendly: after adding/editing, hide form if multiple items exist, 
    // but here we can just keep the form visible or manage it as needed.
    if (window.innerWidth < 1024 && !editingTask) {
        setShowAddForm(false);
    }
  };

  const handleToggleStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updated = { ...task, completed: !task.completed };
      await updateTask(updated);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div>
      <header className="app-header">
        <div>
          <h1>Diamond Organizer</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage your inventory and tasks beautifully.</p>
        </div>
        
        {/* Mobile Add Button Toggle */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => { setShowAddForm(!showAddForm); setEditingTask(null); }} className="secondary">
            {showAddForm ? 'Hide Form' : '+ Add New Task'}
          </button>
          <button 
            onClick={() => auth.signOut()} 
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-muted)', 
              padding: '0.6rem 1rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 500
            }}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Left Column: Form */}
        <div style={{ display: showAddForm ? 'block' : 'none' }}>
           <TaskForm 
              onSave={handleSaveTask} 
              editingTask={editingTask} 
              onCancel={editingTask ? () => setEditingTask(null) : null}
            />
        </div>

        {/* Right Column: Task Lists */}
        <div>
          {activeTasks.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2>Active Tasks ({activeTasks.length})</h2>
              <div className="tasks-grid">
                {activeTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text-muted)' }}>Completed ({completedTasks.length})</h2>
              <div className="tasks-grid">
                {completedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h3 style={{ color: 'var(--text-muted)' }}>No tasks found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Use the form to add your first diamond task.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
