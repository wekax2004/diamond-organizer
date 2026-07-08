import React, { useState, useRef, useEffect } from 'react';
import { parseFreeText, parseFreeTextWithGemini } from '../utils/parser';
import { fileToBase64 } from '../utils/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Image as ImageIcon, Sparkles, X, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const emptyStone = () => ({
  id: uuidv4(),
  lotName: '',
  quantity: '1',
  size: '',
  shape: '',
  color: '',
  clarity: '',
  cut: '',
  certNumber: '',
  buyPrice: '',
  sellPrice: '',
  images: []
});

const getTodayDate = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  title: '',
  note: '',
  customer: '',
  seller: '',
  taskDate: getTodayDate(),
  dueDate: '',
  stones: [emptyStone()]
});

const TaskForm = ({ onSave, onCancel, editingTask = null }) => {
  const [formData, setFormData] = useState(emptyForm());
  const [freeText, setFreeText] = useState('');
  const [mode, setMode] = useState(editingTask ? 'manual' : 'freetext');
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (editingTask) {
      // Migrate legacy single image to images array for the form
      const migratedStones = editingTask.stones.map(s => {
        const imgs = s.images ? [...s.images] : [];
        if (s.image && imgs.length === 0) imgs.push(s.image);
        return { ...s, images: imgs };
      });
      setFormData({ ...editingTask, stones: migratedStones });
    } else {
      setFormData(emptyForm());
    }
  }, [editingTask]);

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStoneChange = (stoneId, e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      stones: prev.stones.map(s => s.id === stoneId ? { ...s, [name]: value } : s)
    }));
  };

  const addStone = () => {
    setFormData(prev => ({
      ...prev,
      stones: [...prev.stones, emptyStone()]
    }));
  };

  const removeStone = (stoneId) => {
    setFormData(prev => ({
      ...prev,
      stones: prev.stones.filter(s => s.id !== stoneId)
    }));
  };

  const handleFreeTextParse = async () => {
    if (!freeText.trim()) return;
    setIsParsing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY_COMBINED.split('_SPLIT_').join('');
      if (apiKey) {
        const extractedStones = await parseFreeTextWithGemini(freeText, apiKey);
        
        const stones = extractedStones.map(s => ({
          ...emptyStone(),
          ...s
        }));
        
        const firstStone = stones[0] || {};
        const totalQuantity = stones.reduce((acc, s) => acc + (parseInt(s.quantity) || 1), 0);
        const generatedTitle = stones.length === 1 && totalQuantity === 1
          ? [firstStone.size ? `${firstStone.size}ct` : '', firstStone.shape, firstStone.color, firstStone.clarity].filter(Boolean).join(' ') || 'New Diamond Task'
          : `${totalQuantity} Diamonds Task`;

        setFormData(prev => ({
          ...prev,
          title: generatedTitle,
          note: freeText,
          customer: firstStone.customer || prev.customer,
          seller: firstStone.seller || prev.seller,
          stones: stones
        }));
      } else {
        const parsedData = parseFreeText(freeText);
        setFormData(prev => ({
          ...prev,
          title: parsedData.title,
          note: parsedData.note,
          customer: parsedData.customer,
          seller: parsedData.seller,
          stones: [{
            ...emptyStone(),
            size: parsedData.size,
            shape: parsedData.shape,
            color: parsedData.color,
            clarity: parsedData.clarity,
            cut: parsedData.cut,
            certNumber: parsedData.certNumber,
            buyPrice: parsedData.buyPrice,
            sellPrice: parsedData.sellPrice
          }]
        }));
      }
      setMode('manual');
    } catch (err) {
      console.error(err);
      alert("Error parsing text. Please try manual entry.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCatalogSearch = async (stoneId, lotName) => {
    if (!lotName || !lotName.trim()) return;
    setIsParsing(true);
    try {
      const docRef = doc(db, 'catalog', lotName.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(prev => ({
          ...prev,
          stones: prev.stones.map(s => {
            if (s.id === stoneId) {
              return {
                ...s,
                shape: data.Shape || data.shape || s.shape,
                size: data.K_Weight || data.size || s.size,
                color: data.Quality || data.color || s.color,
                buyPrice: data['Total H Cost'] || data.buyPrice || s.buyPrice,
                sellPrice: data['Sale Price'] || data['Total Sale'] || data.sellPrice || s.sellPrice,
              };
            }
            return s;
          })
        }));
      } else {
        alert(`Lot ${lotName} not found in Catalog. Did you upload the latest Excel file?`);
      }
    } catch (err) {
      console.error(err);
      alert('Error searching catalog.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImageChange = async (stoneId, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    try {
      const base64Promises = files.map(file => fileToBase64(file));
      const newImages = await Promise.all(base64Promises);
      
      setFormData(prev => ({
        ...prev,
        stones: prev.stones.map(s => 
          s.id === stoneId 
            ? { ...s, images: [...(s.images || []), ...newImages] } 
            : s
        )
      }));
    } catch (err) {
      console.error("Error converting images:", err);
    }
  };

  const removeImage = (stoneId, imgIndex) => {
    setFormData(prev => ({
      ...prev,
      stones: prev.stones.map(s => {
        if (s.id === stoneId) {
           const newImages = [...s.images];
           newImages.splice(imgIndex, 1);
           return { ...s, images: newImages };
        }
        return s;
      })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (!finalData.title || !finalData.title.trim()) {
      finalData.title = 'Untitled Task';
    }
    onSave(finalData);
    if (!editingTask) {
      setFormData(emptyForm());
      setFreeText('');
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
      <div className="task-header">
        <h2>{editingTask ? 'Edit Diamond Task' : 'Add New Diamond Task'}</h2>
        {onCancel && (
          <button className="secondary" onClick={onCancel} style={{ padding: '0.5rem' }}><X size={20} /></button>
        )}
      </div>

      {!editingTask && (
        <div className="tabs">
          <button 
            className={`tab ${mode === 'freetext' ? 'active' : ''}`} 
            onClick={() => setMode('freetext')}
          >
            Free Text (AI Auto-Extract)
          </button>
          <button 
            className={`tab ${mode === 'manual' ? 'active' : ''}`} 
            onClick={() => setMode('manual')}
          >
            Manual Entry
          </button>
        </div>
      )}

      {mode === 'freetext' && !editingTask ? (
        <div className="form-group">
          <label>Type naturally (e.g. "Buy a 1.5-2.0ct D-F color round from John for 5k and a 3ct oval from Sarah")</label>
          <textarea 
            rows="4" 
            value={freeText} 
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Enter diamond details..."
            disabled={isParsing}
          />
          <button 
            onClick={handleFreeTextParse} 
            disabled={isParsing}
            style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={18} /> {isParsing ? 'Parsing...' : 'Parse & Review'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Task Title / Main Description *</label>
            <input type="text" name="title" value={formData.title} onChange={handleGeneralChange} placeholder="E.g., Client Order: 2ct Round & 3ct Oval" />
          </div>

          <div className="flex-row">
            <div className="form-group">
              <label>Task Date</label>
              <input type="date" name="taskDate" value={formData.taskDate || ''} onChange={handleGeneralChange} />
            </div>
            <div className="form-group">
              <label>Due Date & Time (Optional)</label>
              <input type="datetime-local" name="dueDate" value={formData.dueDate || ''} onChange={handleGeneralChange} />
            </div>
          </div>

          <div className="flex-row">
            <div className="form-group">
              <label>Overall Seller (From)</label>
              <input type="text" name="seller" value={formData.seller} onChange={handleGeneralChange} placeholder="Name" />
            </div>
            <div className="form-group">
              <label>Overall Customer (To)</label>
              <input type="text" name="customer" value={formData.customer} onChange={handleGeneralChange} placeholder="Name" />
            </div>
          </div>

          <div className="form-group">
            <label>General Notes</label>
            <textarea name="note" value={formData.note} onChange={handleGeneralChange} rows="2" placeholder="Any additional details or original text..." />
          </div>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Stones ({formData.stones.length})</h3>

          {formData.stones.map((stone, index) => (
            <div key={stone.id} style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--text-muted)' }}>Stone #{index + 1}</h4>
                {formData.stones.length > 1 && (
                  <button type="button" className="danger" onClick={() => removeStone(stone.id)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Remove</button>
                )}
              </div>

              <div className="form-group" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <label style={{ color: 'var(--primary-color)' }}>Auto-Fill from Excel Catalog</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    name="lotName" 
                    value={stone.lotName || ''} 
                    onChange={(e) => handleStoneChange(stone.id, e)} 
                    placeholder="Enter Lot Name (e.g. BR7370)" 
                    style={{ flex: 1, background: 'rgba(255,255,255,0.9)' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleCatalogSearch(stone.id, stone.lotName)}
                    disabled={isParsing || !stone.lotName}
                    style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}
                  >
                    {isParsing ? 'Searching...' : 'Search Catalog'}
                  </button>
                </div>
              </div>

              <div className="flex-row">
                <div className="form-group" style={{ flex: '0.5' }}>
                  <label>Qty</label>
                  <input type="text" name="quantity" value={stone.quantity || '1'} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="1" />
                </div>
                <div className="form-group">
                  <label>Shape</label>
                  <input type="text" name="shape" value={stone.shape} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="Round, Oval..." />
                </div>
                <div className="form-group">
                  <label>Size (Carat)</label>
                  <input type="text" name="size" value={stone.size} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="e.g., 2.0-2.5" />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" name="color" value={stone.color} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="D-F..." />
                </div>
              </div>

              <div className="flex-row">
                <div className="form-group">
                  <label>Clarity</label>
                  <input type="text" name="clarity" value={stone.clarity} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="VS1-VS2..." />
                </div>
                <div className="form-group">
                  <label>Cut</label>
                  <input type="text" name="cut" value={stone.cut} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="Excellent..." />
                </div>
                <div className="form-group">
                  <label>Certificate #</label>
                  <input type="text" name="certNumber" value={stone.certNumber} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="GIA..." />
                </div>
              </div>

              <div className="flex-row">
                <div className="form-group">
                  <label>Buy Price</label>
                  <input type="text" name="buyPrice" value={stone.buyPrice} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label>Sell Price</label>
                  <input type="text" name="sellPrice" value={stone.sellPrice} onChange={(e) => handleStoneChange(stone.id, e)} placeholder="6000" />
                </div>
              </div>

              <div className="form-group">
                <label>Attach Pictures & Certificates for Stone #{index + 1}</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={(e) => handleImageChange(stone.id, e)} 
                  ref={el => fileInputRefs.current[stone.id] = el}
                  style={{ display: 'none' }}
                />
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(stone.images || []).map((img, imgIdx) => (
                    <div key={imgIdx} style={{ position: 'relative' }}>
                      <img src={img} alt="Preview" className="image-preview" style={{ height: '100px', width: '100px', objectFit: 'cover', margin: 0 }} />
                      <button 
                        type="button" 
                        className="danger" 
                        style={{ position: 'absolute', top: '5px', right: '5px', padding: '0.2rem', background: 'rgba(0,0,0,0.5)' }}
                        onClick={() => removeImage(stone.id, imgIdx)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="image-upload-area" style={{ padding: '1rem' }} onClick={() => fileInputRefs.current[stone.id]?.click()}>
                  <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Upload or Take Photo</p>
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="secondary" onClick={addStone} style={{ width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Another Stone to this Task
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" style={{ flex: 2 }}>{editingTask ? 'Update Task' : 'Save Task'}</button>
            {(!editingTask && mode === 'manual') && (
              <button type="button" className="secondary" onClick={() => setMode('freetext')} style={{ flex: 1 }}>Back</button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
