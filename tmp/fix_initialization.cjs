const fs = require('fs');
const FILE_PATH = 'c:\\Users\\rgira\\chatexperince\\src\\components\\ChatInterface.jsx';

let content = fs.readFileSync(FILE_PATH, 'utf8');

// Update currentSituation initialization
content = content.replace(
    /const \[currentSituation, setCurrentSituation\] = useState\(\(\) => localStorage\.getItem\(`situation_\${persona\.id}`\) \|\| 'Starting a new conversation\.\.\.'\);/,
    "const [currentSituation, setCurrentSituation] = useState(() => localStorage.getItem(`situation_${persona.id}`) || persona.tagline || 'Starting a new conversation...');"
);

// Update handleClearChat
content = content.replace(
    /setCurrentSituation\('Starting a new conversation\.\.\.'\);/,
    "const initialSituation = persona.tagline || 'Starting a new conversation...';\n            setCurrentSituation(initialSituation);\n            setSituationInput(initialSituation);"
);

// Update second instance in handleClearChat if it exists (localStorage sync)
content = content.replace(
    /localStorage\.setItem\(`situation_\${persona\.id}`, 'Starting a new conversation\.\.\.'\);/,
    "localStorage.setItem(`situation_${persona.id}`, persona.tagline || 'Starting a new conversation...');"
);

fs.writeFileSync(FILE_PATH, content);
console.log('Updated ChatInterface.jsx');
