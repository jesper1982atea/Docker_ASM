import React from 'react';
import aImg from '../images/a.png';
import bImg from '../images/b.png';
import cImg from '../images/c.png';
import dImg from '../images/d.png';

export default function GradingInfoPopup({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxWidth: 480,
        width: '90%',
        padding: '2rem',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 18,
          right: 18,
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          color: '#888',
          cursor: 'pointer',
        }}>&times;</button>
        <h2 style={{ marginBottom: '1.2rem', color: '#1a7f37' }}>Gradering av enheter</h2>
        <div style={{ fontSize: '1.05em', color: '#222', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.7em' }}>
            <img src={aImg} alt="A-grade example" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }} />
            <div>
              <b>A-grade:</b> Enheten är i nyskick eller mycket gott skick, inga synliga skador eller repor.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.7em' }}>
            <img src={bImg} alt="B-grade example" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }} />
            <div>
              <b>B-grade:</b> Enheten har mindre kosmetiska defekter, t.ex. små repor eller märken, men är fullt fungerande.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.7em' }}>
            <img src={cImg} alt="C-grade example" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }} />
            <div>
              <b>C-grade:</b> Enheten har tydliga kosmetiska skador, t.ex. större repor, bucklor eller missfärgningar, men fungerar.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', marginBottom: '0.7em' }}>
            <img src={dImg} alt="D-grade example" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '0.5rem' }} />
            <div>
              <b>D-grade:</b> Enheten har allvarliga skador eller funktionsfel, t.ex. trasig skärm, saknade delar, eller fungerar ej som den ska.
            </div>
          </div>
          <span style={{ color: '#888', fontSize: '0.98em' }}>
            Vid återlämning är det viktigt att enheten bedöms enligt dessa graderingar. A och B ger högsta restvärde, C och D kan ge avdrag eller ingen återbetalning.
          </span>
        </div>
      </div>
    </div>
  );
}
