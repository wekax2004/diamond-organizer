import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    let scanner;
    
    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            scanner.stop().then(() => {
              onScan(decodedText);
            }).catch(console.error);
          },
          (err) => {
            // ignore scan failures
          }
        );
      } catch (err) {
        console.error(err);
        setError("Camera access denied or unavailable.");
      }
    };

    startScanner();

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', background: 'black' }}>
        <button onClick={onClose} style={{ background: 'transparent', color: 'white', border: '1px solid white' }}>
          <X />
        </button>
      </div>
      <div id="reader" style={{ flex: 1, width: '100%', background: 'black' }}></div>
      {error && <div style={{ padding: '1rem', color: '#f87171', textAlign: 'center' }}>{error}</div>}
      <div style={{ padding: '2rem', color: 'white', textAlign: 'center', background: 'black' }}>
        Point at GIA Barcode or QR Code
      </div>
    </div>
  );
};

export default BarcodeScanner;
