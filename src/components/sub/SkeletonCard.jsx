import React from 'react';

const SkeletonCard = () => (
    <div className="persona-card full-bleed skeleton" style={{ height: '380px', borderRadius: '16px' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <div className="skeleton" style={{ height: '1.5rem', width: '60%', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: '4px' }}></div>
        </div>
    </div>
);

export default SkeletonCard;
