import React from 'react';
import { CheckCircle, Circle, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

const TaskCard = React.memo(({ task, onToggleStatus, onDelete, onEdit }) => {
  return (
    <div className={`glass-panel task-card ${task.completed ? 'completed' : ''}`}>
      <div className="task-header" style={{ marginBottom: '0.5rem' }}>
        <h3 className="task-title" style={{ fontSize: '1.4rem' }}>{task.title || 'Untitled Task'}</h3>
        <button className="secondary" style={{ padding: '0.2rem', border: 'none' }} onClick={() => onToggleStatus(task.id)}>
          {task.completed ? <CheckCircle color="#34d399" /> : <Circle color="#94a3b8" />}
        </button>
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

      <div className="task-actions" style={{ marginTop: 'auto' }}>
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
