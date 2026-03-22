import { useState, useEffect, useRef, useCallback } from 'react';
import * as db from '../services/db';
import { 
    generateResponse, 
    generateSuggestion, 
    cleanLeakage, 
    analyzeIntimateEncounter, 
    extractSceneSummary, 
    generateVisualPrompt,
    generateDiaryEntry
} from '../services/llm';

export const useChatLogic = (persona, showToast, generateSelfie) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Core Game States
    const [relationshipScore, setRelationshipScore] = useState(50);
    const [memory, setMemory] = useState('');
    const [intensity, setIntensity] = useState(3);
    const [milestones, setMilestones] = useState([]);
    const [traits, setTraits] = useState([]);
    const [encounterStats, setEncounterStats] = useState({ count: 0, history: [] });
    const [currentSituation, setCurrentSituation] = useState('Just starting the conversation...');
    const [currentSceneId, setCurrentSceneId] = useState('default');
    const [invitedPersona, setInvitedPersona] = useState(null);
    const [activePersonaImage, setActivePersonaImage] = useState(persona.image);
    const [currentSuggestions, setCurrentSuggestions] = useState([]);
    const [messageCountForScene, setMessageCountForScene] = useState(0);

    const abortControllerRef = useRef(null);

    // Load initial data
    useEffect(() => {
        const load = async () => {
            const chat = await db.getItem('chats', `chat_${persona.id}`) || [];
            if (chat.length > 0) {
                setMessages(chat.map(m => ({ ...m, content: cleanLeakage(m.content) })));
            } else {
                setMessages([{
                    id: Date.now().toString(),
                    role: 'ai',
                    content: cleanLeakage(persona.initialMessage) || "*Smiles softly* Hello..."
                }]);
            }

            setMemory(await db.getItem('memories', `memory_${persona.id}`) || '');
            setRelationshipScore(await db.getItem('settings', `score_${persona.id}`) || 50);
            setIntensity(await db.getItem('settings', `intensity_${persona.id}`) || 3);
            setMilestones(await db.getItem('memories', `milestones_${persona.id}`) || []);
            setTraits(await db.getItem('memories', `traits_${persona.id}`) || []);
            setEncounterStats(await db.getItem('memories', `encounters_${persona.id}`) || { count: 0, lastLocation: 'Never', history: [] });
            setCurrentSceneId(await db.getItem('settings', `scene_${persona.id}`) || 'default');
            setInvitedPersona(await db.getItem('settings', `invited_${persona.id}`) || null);
            setActivePersonaImage(await db.getItem('settings', `active_image_${persona.id}`) || persona.image);
            setIsDataLoaded(true);
        };
        load();
    }, [persona]);

    // Save data
    useEffect(() => {
        if (!isDataLoaded) return;
        db.setItem('chats', `chat_${persona.id}`, messages);
        db.setItem('memories', `memory_${persona.id}`, memory);
        db.setItem('settings', `score_${persona.id}`, relationshipScore);
        db.setItem('settings', `intensity_${persona.id}`, intensity);
        db.setItem('memories', `milestones_${persona.id}`, milestones);
        db.setItem('memories', `traits_${persona.id}`, traits);
        db.setItem('memories', `encounters_${persona.id}`, encounterStats);
        db.setItem('settings', `scene_${persona.id}`, currentSceneId);
        db.setItem('settings', `invited_${persona.id}`, invitedPersona);
        db.setItem('settings', `active_image_${persona.id}`, activePersonaImage);
    }, [messages, memory, relationshipScore, intensity, milestones, traits, encounterStats, currentSceneId, invitedPersona, activePersonaImage, persona.id, isDataLoaded]);

    const executeAiRequest = useCallback(async (aiMessageId, context) => {
        abortControllerRef.current = new AbortController();

        const personaWithExtras = {
            ...persona,
            systemPrompt: (invitedPersona ? `${persona.systemPrompt}\n\n[CRITICAL: ${invitedPersona.name} has joined the scene and is interacting with you and the user.]` : persona.systemPrompt) + 
                          (traits.length > 0 ? `\n\n[RECENT PERSONALITY EVOLUTION: ${traits.join(", ")}]` : "")
        };

        try {
            await generateResponse(
                personaWithExtras,
                context,
                (chunkText) => {
                    setIsTyping(false);
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, content: chunkText, isError: false } : msg
                    ));
                },
                async (fullText) => {
                    let scoreDelta = 0;
                    let photoPrompt = null;

                    // Parse scoring and autonomous actions
                    const scoreMatch = fullText.match(/\[SCORE:\s*([+-]\d+)\]/i);
                    if (scoreMatch) scoreDelta = parseInt(scoreMatch[1]);

                    const photoMatch = fullText.match(/\[PHOTO:\s*(.*?)\]/i);
                    if (photoMatch) photoPrompt = photoMatch[1];

                    const avatarMatch = fullText.match(/\[AVATAR:\s*(.*?)\]/i);
                    if (avatarMatch) setActivePersonaImage(avatarMatch[1].trim());

                    if (scoreDelta !== 0) {
                        setRelationshipScore(prev => Math.max(0, Math.min(100, prev + (scoreDelta * 5))));
                    }

                    if (photoPrompt && generateSelfie) {
                        generateSelfie(photoPrompt, aiMessageId);
                    }

                    // Background situational awareness
                    setMessageCountForScene(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 4) {
                            extractSceneSummary(persona, [...context, { role: 'ai', content: fullText }]).then(summary => {
                                if (summary) setCurrentSituation(summary);
                            });

                            analyzeIntimateEncounter(persona, [...context, { role: 'ai', content: fullText }]).then(result => {
                                if (result && result.detected) {
                                    setEncounterStats(prev => ({
                                        count: prev.count + 1,
                                        lastLocation: result.location || prev.lastLocation,
                                        history: [
                                            {
                                                timestamp: new Date().toISOString(),
                                                location: result.location,
                                                summary: result.summary
                                            },
                                            ...(prev.history || [])
                                        ].slice(0, 10)
                                    }));
                                    showToast("New Intimate Memory Unlocked", "success");
                                }
                            });
                            return 0;
                        }
                        return newCount;
                    });
                },
                (errMessage) => {
                    setIsTyping(false);
                    showToast(errMessage);
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId ? { ...msg, content: "ΓÜá∩╕Å Generation failed. Check connection.", isError: true } : msg
                    ));
                },
                abortControllerRef.current.signal,
                { memory, intensity, milestones, encounterStats, currentSituation }
            );
        } catch (e) {
            setIsTyping(false);
        }
    }, [persona, memory, intensity, milestones, encounterStats, currentSituation, invitedPersona, traits, generateSelfie, showToast]);

    const handleSendMessage = useCallback(async (customInput) => {
        const text = customInput || input;
        if (!text.trim() || isTyping) return;

        const userMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isError: false }]);

        await executeAiRequest(aiMessageId, [...messages, userMsg]);
    }, [input, isTyping, messages, executeAiRequest]);

    const handleSendGift = useCallback(async (gift) => {
        const giftMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `*Sends you a gift: ${gift.name}*` 
        };
        setMessages(prev => [...prev, giftMsg]);
        setRelationshipScore(prev => Math.min(100, prev + gift.bonus));
        
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '' }]);

        const giftDirective = {
            role: 'user',
            content: `[SYSTEM DIRECTIVE: The user has just gifted you a ${gift.name}. React with intense emotion and deep gratitude. Describe your physical reaction.]`
        };

        await executeAiRequest(aiMessageId, [...messages, giftMsg, giftDirective]);
    }, [messages, executeAiRequest]);

    const handleSetOutfit = useCallback(async (outfit) => {
        setActivePersonaImage(outfit.avatar);
        const outfitMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `*Suggests a change of outfit: ${outfit.name}*` 
        };
        setMessages(prev => [...prev, outfitMsg]);
        
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '' }]);

        const outfitDirective = {
            role: 'user',
            content: `[SYSTEM DIRECTIVE: You have just changed your outfit to: ${outfit.name}. Describe your new look and how it makes you feel.]`
        };

        await executeAiRequest(aiMessageId, [...messages, outfitMsg, outfitDirective]);
    }, [messages, executeAiRequest]);

    const handleSceneChange = useCallback(() => {
        const newScene = window.prompt("Enter new location or scene description:");
        if (newScene && newScene.trim()) {
            const sysMessage = { 
                id: Date.now().toString(), 
                role: 'system', 
                content: `[SYSTEM EVENT: The scene has now shifted to: ${newScene.trim()}]` 
            };
            setMessages(prev => [...prev, sysMessage]);
            setCurrentSituation(newScene.trim());
        }
    }, []);

    const handleScenarioShuffle = useCallback(async () => {
        if (isTyping) return;
        
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '' }]);

        const shuffleDirective = {
            role: 'user',
            content: "[SYSTEM DIRECTIVE: SCENARIO SHIFT. Randomly and creatively transition the story to a completely NEW location and situation. Describe the new environment vividly using sensory details. Stay in character, but take a bold leap into a new phase of our interaction ΓÇö something unexpected and exciting.]"
        };

        await executeAiRequest(aiMessageId, [...messages, shuffleDirective]);
    }, [isTyping, messages, executeAiRequest]);

    const handleSelectFantasy = useCallback(async (fantasy) => {
        const fantasyMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `[SYSTEM EVENT: Starting Fantasy: ${fantasy.title}. ${fantasy.prompt}]` 
        };
        setMessages(prev => [...prev, fantasyMsg]);
        
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '' }]);

        await executeAiRequest(aiMessageId, [...messages, fantasyMsg]);
    }, [messages, executeAiRequest]);

    const handleScanIntimacy = useCallback(async () => {
        showToast("Scanning recent history for intimacy...", "info");
        const result = await analyzeIntimateEncounter(persona, messages);
        if (result && result.detected) {
            setEncounterStats(prev => ({
                count: prev.count + 1,
                lastLocation: result.location || prev.lastLocation,
                history: [
                    {
                        timestamp: new Date().toISOString(),
                        location: result.location,
                        summary: result.summary
                    },
                    ...(prev.history || [])
                ].slice(0, 10)
            }));
            showToast("Recorded new intimate encounter!", "success");
        } else {
            showToast("No new intimacy detected.", "info");
        }
    }, [persona, messages, showToast]);

    const handleGenerateSceneImage = useCallback(async () => {
        showToast("Analyzing scene for visual capture...", "info");
        const visualContext = await generateVisualPrompt(persona, messages);
        if (visualContext && generateSelfie) {
            generateSelfie(visualContext, Date.now().toString());
        }
    }, [persona, messages, generateSelfie, showToast]);

    const handleStopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsTyping(false);
        }
    }, []);

    const handleGenerateSuggestion = useCallback(async () => {
        setIsSuggesting(true);
        const suggestion = await generateSuggestion(persona, messages);
        if (suggestion) {
            setCurrentSuggestions([suggestion]);
        }
        setIsSuggesting(false);
    }, [persona, messages]);

    return {
        messages, setMessages,
        input, setInput,
        isTyping,
        isSuggesting,
        relationshipScore,
        memory,
        intensity, setIntensity,
        milestones,
        traits,
        encounterStats,
        currentSituation,
        activePersonaImage,
        currentSuggestions,
        invitedPersona, setInvitedPersona,
        handleSendMessage,
        handleStopGeneration,
        handleGenerateSuggestion,
        handleSendGift,
        handleSetOutfit,
        handleScanIntimacy,
        handleGenerateSceneImage,
        handleSceneChange,
        handleScenarioShuffle,
        handleSelectFantasy
    };
};
