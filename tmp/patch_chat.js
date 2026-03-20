
const fs = require('fs');
const path = 'c:\\Users\\rgira\\chatexperince\\src\\components\\ChatInterface.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to clear your chat history with " + persona.name + "?")) {
            const initialMessage = [{ id: Date.now().toString(), role: 'ai', content: persona.initialMessage || \`*I look at you with a soft smile* Hello there... I'm glad you're here.\` }];
            setMessages(initialMessage);
            localStorage.setItem(\`chat_\${persona.id}\`, JSON.stringify(initialMessage));
        }
    };`;

const newCode = `    const handleClearChat = () => {
        if (window.confirm("Are you sure you want to clear EVERYTHING for " + persona.name + "? This resets chat history, memories, score, and all stats.")) {
            const initialMsg = { 
                id: Date.now().toString(), 
                role: 'ai', 
                content: persona.initialMessage || \`*I look at you with a soft smile* Hello there... I'm glad you're here.\` 
            };
            
            // 1. Reset State
            setMessages([initialMsg]);
            setMemory('');
            setRelationshipScore(50);
            setIntensity(3);
            setMilestones([]);
            setTraits([]);
            setEncounterStats({ count: 0, lastLocation: 'Never', history: [] });
            setCurrentSituation('Starting a new conversation...');
            setCurrentSceneId('default');
            if (typeof setInvitedPersona === 'function') setInvitedPersona(null);

            // 2. Clear LocalStorage
            localStorage.setItem(\`chat_\${persona.id}\`, JSON.stringify([initialMsg]));
            localStorage.removeItem(\`memory_\${persona.id}\`);
            localStorage.removeItem(\`score_\${persona.id}\`);
            localStorage.removeItem(\`intensity_\${persona.id}\`);
            localStorage.removeItem(\`milestones_\${persona.id}\`);
            localStorage.removeItem(\`traits_\${persona.id}\`);
            localStorage.removeItem(\`encounters_\${persona.id}\`);
            localStorage.removeItem(\`situation_\${persona.id}\`);
            localStorage.removeItem(\`scene_\${persona.id}\`);
            localStorage.removeItem(\`invited_\${persona.id}\`);
            
            if (typeof showToast === 'function') showToast("Persona data completely reset.", "success");
        }
    };`;

// Try with CRLF
let modified = content.replace(oldCode.replace(/\n/g, '\r\n'), newCode.replace(/\n/g, '\r\n'));

if (modified === content) {
    // Try with LF
    modified = content.replace(oldCode, newCode);
}

if (modified === content) {
    console.error("Failed to find target code block.");
    process.exit(1);
}

fs.writeFileSync(path, modified);
console.log("Successfully patched ChatInterface.jsx");
