import React, { useState } from 'react';
import * as xlsx from 'xlsx';
import { db } from '../utils/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export default function Catalog() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus('Reading Excel file...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Parse as array of arrays to find header row safely
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(data.length, 20); i++) {
          const row = data[i] || [];
          if (row.some(cell => String(cell).toLowerCase().includes('lot name') || String(cell).toLowerCase() === 'lot')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not find a column header named "Lot Name" in the first 20 rows.');
        }

        setStatus('Parsing rows...');
        const headers = data[headerRowIndex];
        const lotIndex = headers.findIndex(h => String(h).toLowerCase().includes('lot name') || String(h).toLowerCase() === 'lot');
        
        const catalogItems = [];
        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[lotIndex]) continue; // skip empty lot names
          
          const lotName = String(row[lotIndex]).trim();
          if (!lotName) continue;

          const item = {};
          headers.forEach((h, idx) => {
            if (h) {
              item[h] = row[idx] !== undefined ? row[idx] : null;
            }
          });
          
          catalogItems.push({
            id: lotName,
            ...item
          });
        }

        setStatus(`Found ${catalogItems.length} diamonds. Saving to database...`);
        
        // Chunk into batches of 500 for Firestore
        const chunkSize = 500;
        for (let i = 0; i < catalogItems.length; i += chunkSize) {
          const chunk = catalogItems.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          
          chunk.forEach(item => {
            // Using lot name as document ID
            const docRef = doc(collection(db, 'catalog'), item.id);
            batch.set(docRef, item);
          });
          
          await batch.commit();
          setStatus(`Saved ${Math.min(i + chunkSize, catalogItems.length)} of ${catalogItems.length} diamonds...`);
        }

        setStatus('Catalog successfully updated! You can now use Auto-Fill in the Task Form.');
      } catch (err) {
        console.error(err);
        setStatus('Error: ' + err.message);
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Inventory Catalog</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Upload your latest `.XLSX` inventory file. The app will securely read the file and update its internal catalog so the "Auto-Fill" feature in the Task Form has the latest data.
      </p>
      
      <div style={{ 
        border: '2px dashed var(--border-color)', 
        borderRadius: '12px', 
        padding: '3rem 2rem', 
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        marginBottom: '2rem'
      }}>
        <label 
          htmlFor="catalog-upload" 
          style={{ 
            display: 'inline-block',
            background: 'var(--primary-color)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading ? 'Processing...' : 'Select Excel File (.xlsx)'}
        </label>
        <input 
          id="catalog-upload" 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
          disabled={loading}
          style={{ display: 'none' }} 
        />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your file is read locally and the data is saved directly to your private database.
        </div>
      </div>

      {status && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          background: status.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: status.includes('Error') ? '#ef4444' : '#10b981',
          border: `1px solid ${status.includes('Error') ? '#ef4444' : '#10b981'}`,
          textAlign: 'center'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
