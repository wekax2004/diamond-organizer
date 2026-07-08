import React from 'react';
import { CheckCircle, Circle, Edit2, Trash2, Image as ImageIcon, Calendar, CalendarPlus, Clock } from 'lucide-react';

const TaskCard = React.memo(({ task, onStatusChange, onDelete, onEdit }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#34d399'; // green
      case 'sold': return '#3b82f6'; // blue
      case 'returned': return '#f87171'; // red
      default: return '#94a3b8'; // grey
    }
  };

  const handleAddToCalendar = () => {
    if (!task.dueDate) return;
    
    // Format dates to YYYYMMDDTHHMMSSZ
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${task.title || 'Diamond Task'}`,
      `DESCRIPTION:${(task.note || '').replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${(task.title || 'task').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`glass-panel task-card status-${task.status || 'active'}`}>
      <div className="task-header" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
        <h3 className="task-title" style={{ fontSize: '1.4rem', flex: 1 }}>{task.title || 'Untitled Task'}</h3>
        <select 
          className="status-dropdown"
          value={task.status || 'active'} 
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={{ 
            width: 'auto', 
            padding: '0.4rem 0.8rem', 
            backgroundColor: 'rgba(0,0,0,0.3)', 
            border: `1px solid ${getStatusColor(task.status)}`,
            color: getStatusColor(task.status),
            fontWeight: 'bold',
            borderRadius: '20px',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
          <Calendar size={14} /> 
          <span>Created: {task.taskDate || (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '')}</span>
        </div>
        {task.dueDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: new Date(task.dueDate) < new Date() ? '#f87171' : '#fbbf24', fontWeight: 'bold' }}>
            <Clock size={14} /> 
            <span>Due: {new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        )}
      </div>

      <div className="task-details" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        {task.seller && <div><strong>From:</strong> {task.seller}</div>}
        {task.customer && <div><strong>To:</strong> {task.customer}</div>}
        {task.note && <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {task.note}</div>}
      </div>

      {task.stones && task.stones.map((stone, idx) => (
        <div key={stone.id} style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Stone {task.stones.length > 1 ? `#${idx + 1}` : ''}</h4>
          
          {stone.images && stone.images.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              {stone.images.map((img, i) => (
                <div key={i} className="task-image-container" style={{ flex: '0 0 auto', width: '150px', height: '150px', margin: 0 }}>
                  <img src={img} alt={`Diamond ${i + 1}`} className="task-image" />
                </div>
              ))}
            </div>
          ) : stone.image && (
            <div className="task-image-container" style={{ height: '120px' }}>
              <img src={stone.image} alt="Diamond" className="task-image" />
            </div>
          )}

          <div className="task-badges" style={{ marginBottom: '0.5rem' }}>
            {parseInt(stone.quantity) > 1 && <span className="badge" style={{ background: 'var(--primary-color)' }}>Qty: {stone.quantity}</span>}
            {stone.shape && <span className="badge">{stone.shape}</span>}
            {stone.size && <span className="badge">{stone.size} ct</span>}
            {stone.color && <span className="badge">Color: {stone.color}</span>}
            {stone.clarity && <span className="badge">{stone.clarity}</span>}
            {stone.cut && <span className="badge">Cut: {stone.cut}</span>}
          </div>

          <div className="task-details" style={{ marginBottom: 0 }}>
            {stone.buyPrice && <div><strong>Buy:</strong> ${stone.buyPrice}</div>}
            {stone.sellPrice && <div><strong>Sell:</strong> ${stone.sellPrice}</div>}
            {stone.certNumber && <div style={{ gridColumn: 'span 2' }}><strong>Cert:</strong> {stone.certNumber}</div>}
          </div>
        </div>
      ))}

      <div className="task-actions" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
        {task.dueDate && (
          <button className="secondary" onClick={handleAddToCalendar} style={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CalendarPlus size={16} /> Add Reminder
          </button>
        )}
        <button className="secondary" onClick={() => onEdit(task)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Edit2 size={16} /> Edit
        </button>
        <button className="danger" onClick={() => onDelete(task.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
});

export default TaskCard;
