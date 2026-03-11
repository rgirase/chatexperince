import React from 'react';
import { personas } from '../data/personas';

const PersonaList = ({ onSelectPersona, customPersonas = [] }) => {
    const allPersonas = [...personas, ...customPersonas];
    return (
        <div className="persona-container fade-in">
            <div className="persona-header">
                <h2>Choose Your Companion</h2>
                <p>Select a persona to start your intimate journey.</p>
            </div>

            <div className="persona-grid">
                {allPersonas.map((persona) => (
                    <div
                        key={persona.id}
                        className="persona-card glass-panel"
                        onClick={() => onSelectPersona(persona)}
                    >
                        {persona.image ? (
                            <img
                                src={persona.image}
                                alt={persona.name}
                                className="persona-img"
                                loading="lazy"
                            />
                        ) : (
                            <div className="persona-img fallback-bg"></div>
                        )}
                        <div className="persona-overlay"></div>
                        <div className="persona-info">
                            <div className="persona-name">
                                {persona.name}
                                <span className="status-dot"></span>
                            </div>
                            <p className="persona-tagline">{persona.tagline}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PersonaList;
