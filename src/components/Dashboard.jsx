import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../utils/storage';
import { auth } from '../utils/firebase';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(window.innerWidth >= 1024);

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
          status: t.status || (t.completed ? 'completed' : 'active'),
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
    try {
      if (taskData.id) {
        await updateTask(taskData);
        setEditingTask(null);
      } else {
        await addTask(taskData);
      }
      if (window.innerWidth < 1024 && !editingTask) {
          setShowAddForm(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save task. ' + err.message);
    }
  };

  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updated = { ...task, status: newStatus };
      await updateTask(updated);
    }
  }, [tasks]);

  const handleDelete = useCallback(async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  }, []);

  const handleEdit = useCallback((task) => {
    setEditingTask(task);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => t.status === 'active'), [tasks]);
  const historyTasks = useMemo(() => tasks.filter(t => t.status !== 'active'), [tasks]);

  const [searchTerm, setSearchTerm] = useState('');

  const filterTasks = (taskList) => {
    if (!searchTerm.trim()) return taskList;
    const lower = searchTerm.toLowerCase();
    return taskList.filter(task => {
      const matchTitle = task.title?.toLowerCase().includes(lower);
      const matchCustomer = task.customer?.toLowerCase().includes(lower);
      const matchSeller = task.seller?.toLowerCase().includes(lower);
      const matchNote = task.note?.toLowerCase().includes(lower);
      const matchStones = task.stones?.some(stone => 
        stone.certNumber?.toLowerCase().includes(lower) ||
        stone.shape?.toLowerCase().includes(lower) ||
        stone.color?.toLowerCase().includes(lower) ||
        stone.clarity?.toLowerCase().includes(lower) ||
        stone.buyPrice?.toLowerCase().includes(lower) ||
        stone.sellPrice?.toLowerCase().includes(lower)
      );
      return matchTitle || matchCustomer || matchSeller || matchNote || matchStones;
    });
  };

  const activeTasksFiltered = useMemo(() => filterTasks(activeTasks), [activeTasks, searchTerm]);
  const historyTasksFiltered = useMemo(() => filterTasks(historyTasks), [historyTasks, searchTerm]);

  const stats = useMemo(() => {
    let buy = 0;
    let sell = 0;
    activeTasksFiltered.forEach(task => {
      task.stones?.forEach(stone => {
        const qty = parseInt(stone.quantity) || 1;
        if (stone.buyPrice) buy += (parseFloat(stone.buyPrice.toString().replace(/,/g, '')) || 0) * qty;
        if (stone.sellPrice) sell += (parseFloat(stone.sellPrice.toString().replace(/,/g, '')) || 0) * qty;
      });
    });
    return { buy, sell, profit: sell - buy };
  }, [activeTasksFiltered]);

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
          {/* Stats Panel */}
          <div className="glass-panel stat-panel flex-row">
            <div className="stat-box">
              <div className="stat-label">Inventory Cost</div>
              <div className="stat-value">${stats.buy.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Expected Revenue</div>
              <div className="stat-value">${stats.sell.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Est. Profit</div>
              <div className="stat-value" style={{ color: stats.profit >= 0 ? '#34d399' : '#f87171' }}>
                ${stats.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <input 
              type="text" 
              placeholder="Search by shape, color, cert #, customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {activeTasksFiltered.length > 0 ? (
            <div style={{ marginBottom: '2rem' }}>
              <h2>Active Tasks ({activeTasksFiltered.length})</h2>
              <div className="tasks-grid">
                {activeTasksFiltered.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          ) : searchTerm && (
             <div style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>No active tasks match your search.</div>
          )}

          {historyTasksFiltered.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text-muted)' }}>History ({historyTasksFiltered.length})</h2>
              <div className="tasks-grid">
                {historyTasksFiltered.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
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
