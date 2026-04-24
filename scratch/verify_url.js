// Verification script for getLmStudioUrl logic v2
const DEFAULT_LM_STUDIO_URL = 'http://localhost:1234';

const getLmStudioUrl = (providedUrl) => {
    let baseUrl = providedUrl || DEFAULT_LM_STUDIO_URL;
    baseUrl = baseUrl.trim();
    
    if (!baseUrl) baseUrl = DEFAULT_LM_STUDIO_URL;
    if (baseUrl.includes('/chat/completions')) return baseUrl;

    let cleanUrl = baseUrl.replace(/\/+$/, '');

    // 4. Handle proxy paths and /v1 logic
    if (cleanUrl.startsWith('/api')) {
        return `${cleanUrl}/chat/completions`;
    }

    if (cleanUrl.endsWith('/v1')) {
        return `${cleanUrl}/chat/completions`;
    }
    
    return `${cleanUrl}/v1/chat/completions`;
};

console.log("Test direct hostname:", getLmStudioUrl('http://localhost:1234'));
console.log("Test hostname with /v1:", getLmStudioUrl('http://localhost:1234/v1'));
console.log("Test proxy path /api:", getLmStudioUrl('/api'));
console.log("Test proxy path /api-pc:", getLmStudioUrl('/api-pc'));
console.log("Test default:", getLmStudioUrl(null));
