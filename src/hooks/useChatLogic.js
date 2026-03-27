import { useState, useEffect, useRef, useCallback } from 'react';
import * as db from '../services/db';
import { 
    generateResponse, 
    generateSuggestion, 
    cleanLeakage, 
    analyzeIntimateEncounter, 
    extractSceneSummary, 
    generateVisualPrompt,
    generateDiaryEntry,
    summarizeMemory,
    generateMemoryRecallQuestion
} from '../services/llm';
import { getDiaries } from '../services/memory';
import { getLocation, getAllLocations } from '../services/LocationService';

export const useChatLogic = (persona, showToast, initialScenario, generateSelfie) => {
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
    const [currentLocationId, setCurrentLocationId] = useState('kitchen_morning');
    const [customRelation, setCustomRelation] = useState('');

    const abortControllerRef = useRef(null);

    const [sessionId, setSessionId] = useState('default');
    const [allSessions, setAllSessions] = useState([]);

    // Load initial data
    useEffect(() => {
        const load = async () => {
            setIsDataLoaded(false);
            // 1. Get the current active sessionId for this persona (Double-redundant)
            let currentSid = await db.getItem('settings', `active_session_${persona.id}`) || 
                             localStorage.getItem(`active_session_fallback_${persona.id}`) || 
                             'default';
            if (currentSid !== sessionId) {
                setSessionId(currentSid);
                return; // Let the next cycle handle the data loading with the correct ID
            }

            // 2. Load the list of all sessions for this persona
            const sessions = await db.getItem('settings', `sessions_list_${persona.id}`) || ['default'];
            setAllSessions(sessions);

            // 3. Load chat and state with sessionId suffix
            let chatKey = `chat_${persona.id}_${currentSid}`;
            let chat = await db.getItem('chats', chatKey) || [];
            
            // Check for scenario prompt: prioritize prop, then localStorage
            const scenarioPrompt = initialScenario?.prompt || localStorage.getItem(`scenarioPrompt_${persona.id}`);

            if (scenarioPrompt && chat.length > 0) {
                // FORCE a new session if we're picking a specific scenario but the current session isn't fresh
                const newSid = `session_${Date.now()}`;
                const newList = [...sessions, newSid];
                await db.setItem('settings', `active_session_${persona.id}`, newSid);
                await db.setItem('settings', `sessions_list_${persona.id}`, newList);
                
                currentSid = newSid;
                setSessionId(newSid);
                setAllSessions(newList);
                chat = []; // Start with an empty chat for the new session
            }
            
            if (chat.length > 0) {
                setMessages(chat.map(m => ({ ...m, content: cleanLeakage(m.content) })));
            } else {
                const initialContent = scenarioPrompt || persona.initialMessage || "*Smiles softly* Hello...";
                
                setMessages([{
                    id: Date.now().toString(),
                    role: 'ai',
                    content: cleanLeakage(initialContent)
                }]);
                
                // Cleanup localStorage if it was used
                if (!initialScenario && scenarioPrompt) {
                    localStorage.removeItem(`scenarioPrompt_${persona.id}`);
                }
            }

            const suffix = `_${persona.id}_${currentSid}`;
            setMemory(await db.getItem('memories', `memory${suffix}`) || '');
            setRelationshipScore(await db.getItem('settings', `score${suffix}`) || 50);
            setIntensity(await db.getItem('settings', `intensity${suffix}`) || 3);
            setMilestones(await db.getItem('memories', `milestones${suffix}`) || []);
            setTraits(await db.getItem('memories', `traits${suffix}`) || []);
            setEncounterStats(await db.getItem('memories', `encounters${suffix}`) || { count: 0, lastLocation: 'Never', history: [] });
            setCurrentSceneId(await db.getItem('settings', `scene${suffix}`) || 'default');
            setCurrentLocationId(await db.getItem('settings', `location${suffix}`) || 'kitchen_morning');
            setInvitedPersona(await db.getItem('settings', `invited${suffix}`) || null);
            const savedImg = await db.getItem('settings', `active_image${suffix}`);
            if (savedImg && savedImg.length > 10) {
                setActivePersonaImage(savedImg);
            } else {
                setActivePersonaImage(persona.image);
            }
            setCustomRelation(await db.getItem('settings', `relation${suffix}`) || '');
            setIsAvatarManual(await db.getItem('settings', `avatar_manual${suffix}`) || false);
            
            setIsDataLoaded(true);
        };
        load();
    }, [persona, sessionId, initialScenario]); // Reload if persona, session, or scenario changes

    const [isAvatarManual, setIsAvatarManual] = useState(false);
    const [lastIntensity, setLastIntensity] = useState(intensity);

    // Save data
    useEffect(() => {
        if (!isDataLoaded) return;
        
        // Auto-Avatar Logic
        if (!isAvatarManual && persona.wardrobe && persona.wardrobe.length > 0) {
            let targetImage = persona.image;
            const score = relationshipScore;
            
            // Logic: High score + High intensity = more intimate/flirty looks
            if (score >= 90 && intensity >= 4) {
                targetImage = persona.wardrobe[persona.wardrobe.length - 1].avatar;
            } else if (score >= 70) {
                targetImage = persona.wardrobe[Math.min(2, persona.wardrobe.length - 1)].avatar;
            } else if (score >= 40) {
                targetImage = persona.wardrobe[Math.min(1, persona.wardrobe.length - 1)].avatar;
            }

            if (targetImage !== activePersonaImage) {
                setActivePersonaImage(targetImage);
            }
        }

        const suffix = `_${persona.id}_${sessionId}`;
        db.setItem('chats', `chat${suffix}`, messages);
        db.setItem('memories', `memory${suffix}`, memory);
        db.setItem('settings', `score${suffix}`, relationshipScore);
        db.setItem('settings', `intensity${suffix}`, intensity);
        db.setItem('memories', `milestones${suffix}`, milestones);
        db.setItem('memories', `traits${suffix}`, traits);
        db.setItem('memories', `encounters${suffix}`, encounterStats);
        db.setItem('settings', `scene${suffix}`, currentSceneId);
        db.setItem('settings', `invited${suffix}`, invitedPersona);
        db.setItem('settings', `active_image${suffix}`, activePersonaImage);
        // Force leading slash for local assets if missing
        if (activePersonaImage && activePersonaImage.startsWith('assets/')) {
            setActivePersonaImage('/' + activePersonaImage);
        }
        db.setItem('settings', `location${suffix}`, currentLocationId);
        db.setItem('settings', `relation${suffix}`, customRelation);
        db.setItem('settings', `avatar_manual${suffix}`, isAvatarManual);

        // Milestone Unlocking Logic
        const checkMilestones = async () => {
            const unlocked = await db.getItem('unlocked_gallery', `unlocked${suffix}`) || [];
            let changed = false;
            
            if (relationshipScore >= 80 && !unlocked.includes('milestone_80')) {
                unlocked.push('milestone_80');
                showToast("Milestone Reached: Level 80! Secret image unlocked.", "success");
                changed = true;
            }
            if (relationshipScore >= 90 && !unlocked.includes('milestone_90')) {
                unlocked.push('milestone_90');
                showToast("Milestone Reached: Level 90! Deep Intimacy unlocked.", "success");
                changed = true;
            }
            if (relationshipScore >= 100 && !unlocked.includes('milestone_100')) {
                unlocked.push('milestone_100');
                showToast("MAX RELATIONSHIP! Eternal Bond unlocked.", "success");
                changed = true;
            }

            if (changed) {
                await db.setItem('unlocked_gallery', `unlocked${suffix}`, unlocked);
            }
        };
        checkMilestones();

    }, [messages, memory, relationshipScore, intensity, milestones, traits, encounterStats, currentSceneId, invitedPersona, activePersonaImage, currentLocationId, persona.id, sessionId, isDataLoaded]);

    const startNewSession = async () => {
        setIsDataLoaded(false);
        const newSid = `session_${Date.now()}`;
        const newList = [...allSessions, newSid];
        
        await db.setItem('settings', `active_session_${persona.id}`, newSid);
        localStorage.setItem(`active_session_fallback_${persona.id}`, newSid);
        await db.setItem('settings', `sessions_list_${persona.id}`, newList);
        
        setSessionId(newSid);
        setAllSessions(newList);
        // This will trigger the effect to reload data for the new session
    };

    const switchSession = async (sid) => {
        setIsDataLoaded(false);
        await db.setItem('settings', `active_session_${persona.id}`, sid);
        localStorage.setItem(`active_session_fallback_${persona.id}`, sid);
        setSessionId(sid);
    };

    const deleteSession = async (sid) => {
        if (sid === 'default') return; // Protect default
        const newList = allSessions.filter(s => s !== sid);
        await db.setItem('settings', `sessions_list_${persona.id}`, newList);
        if (sessionId === sid) {
            await switchSession('default');
        }
        setAllSessions(newList);
    };

    const executeAiRequest = useCallback(async (aiMessageId, context, options = {}) => {
        abortControllerRef.current = new AbortController();

        const personaWithExtras = {
            ...persona,
            systemPrompt: (invitedPersona ? `${persona.systemPrompt}\n\n[CRITICAL: ${invitedPersona.name} has joined the scene and is interacting with you and the user.]` : persona.systemPrompt) + 
                          (traits.length > 0 ? `\n\n[RECENT PERSONALITY EVOLUTION: ${traits.join(", ")}]` : "") +
                          (customRelation ? `\n\n[RELATIONSHIP ROLE: You are currently acting in the role of: ${customRelation}]` : "")
        };

        const finalOptions = {
            memory,
            milestones,
            intensity,
            relationshipScore,
            currentSituation,
            ...options,
            systemOverride: options.isRepair ? `[SYSTEM OVERRIDE: Your last response was invalid or contained metadata. This is a REPAIR ATTEMPT. You MUST respond ONLY with character dialogue and physical actions in pure narrative roleplay. NO JSON, NO MOOD TAGS, NO CODE, NO METADATA.]` : null
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
                async (cleanedText, rawText) => {
                    // Update message with final cleaned version
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, content: cleanedText, isError: false } : msg
                    ));

                    let scoreDelta = 0;
                    let photoPrompt = null;

                    // Parse scoring and autonomous actions FROM RAW TEXT
                    const scoreMatch = rawText.match(/\[SCORE:\s*([+-]\d+)\]/i);
                    if (scoreMatch) scoreDelta = parseInt(scoreMatch[1]);

                    const photoMatch = rawText.match(/\[PHOTO:\s*(.*?)\]/i);
                    if (photoMatch) photoPrompt = photoMatch[1];

                    const avatarMatch = rawText.match(/\[AVATAR:\s*(.*?)\]/i);
                    if (avatarMatch) setActivePersonaImage(avatarMatch[1].trim());

                    // Mood log for debug
                    const moodMatch = rawText.match(/\[MOOD:\s*(.*?)\]/i);
                    if (moodMatch) console.log(`[ChatLogic] Persona Mood: ${moodMatch[1]}`);

                    if (scoreDelta !== 0) {
                        setRelationshipScore(prev => Math.max(0, Math.min(100, prev + (scoreDelta * 5))));
                    }

                    if (photoPrompt && generateSelfie) {
                        generateSelfie(photoPrompt, aiMessageId);
                    }

                    // Background situational awareness (pass RAW for analysis)
                    const contextWithRaw = [...context, { role: 'ai', content: rawText }];
                    setMessageCountForScene(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 4) {
                            extractSceneSummary(persona, [...context, { role: 'ai', content: rawText }]).then(summary => {
                                if (summary) setCurrentSituation(summary);
                            });

                            analyzeIntimateEncounter(persona, [...context, { role: 'ai', content: rawText }]).then(result => {
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
                                        ].slice(0, 50)
                                    }));
                                    showToast("New Intimate Memory Unlocked", "success");
                                }
                            });
                            // Automatic Long-term Memory Summarization
                            if (context.length >= 15 && context.length % 15 === 0) {
                                summarizeMemory(persona, memory, context.slice(-15)).then(newMemory => {
                                    if (newMemory && newMemory !== memory) {
                                        setMemory(newMemory);
                                        showToast("Character Memory Updated", "info");
                                    }
                                });
                            }

                            // Trigger "Moment of Truth" memory recall
                            if (context.length > 5 && (context.length % 10 === 0)) {
                                getDiaries(persona.id).then(diaries => {
                                    const diaryTexts = diaries.map(d => d.content);
                                    generateMemoryRecallQuestion(persona, milestones, diaryTexts).then(question => {
                                        if (question) {
                                            setTimeout(() => {
                                                setMessages(prev => [...prev, {
                                                    id: Date.now().toString() + "_moment",
                                                    role: 'ai',
                                                    content: question,
                                                    isMoment: true
                                                }]);
                                                showToast(`${persona.name} is reminiscing...`, "success");
                                            }, 2000);
                                        }
                                    });
                                });
                            }

                            return 0;
                        }
                        return newCount;
                    });

                    // Automatic Scene Detection
                    const allLocs = getAllLocations();
                    const textToScan = cleanedText.toLowerCase();
                    const matchedLoc = allLocs.find(loc => 
                        loc.keywords?.some(kw => textToScan.includes(kw.toLowerCase()))
                    );

                    if (matchedLoc && matchedLoc.id !== currentLocationId) {
                        console.log(`[ChatLogic] Auto-detected scene transition to: ${matchedLoc.name}`);
                        setCurrentLocationId(matchedLoc.id);
                        setCurrentSituation(matchedLoc.situation);
                        showToast(`Scene changed to ${matchedLoc.name}`, "info");
                    }
                },
                (errMessage) => {
                    console.error(`[ChatLogic] onError called: ${errMessage}`);
                    setIsTyping(false);
                    showToast(errMessage);
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId ? { ...msg, content: "⚠️ Generation failed. Check connection.", isError: true } : msg
                    ));
                },
                abortControllerRef.current.signal,
                finalOptions
            );
        } catch (e) {
            setIsTyping(false);
        }
    }, [persona, memory, intensity, milestones, encounterStats, currentSituation, invitedPersona, traits, generateSelfie, showToast]);

    const handleSendMessage = useCallback(async (customInput) => {
        const text = customInput || input;
        if (!text.trim() || isTyping) return;

        // Detect Time-Skip keywords
        const timeSkipRegex = /\b(days? pass|weeks? pass|months? pass|next (morning|day|week|month)|every day|passed by|a long time|later that)\b/gi;
        const isTimeSkip = timeSkipRegex.test(text);

        const userMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setRelationshipScore(prev => Math.min(100, prev + 1)); // Interaction Reward
        setInput('');
        localStorage.setItem('lastPersonaId', persona.id);
        setIsTyping(true);

        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isError: false }]);

        await executeAiRequest(aiMessageId, [...messages, userMsg], { isTimeSkip });

        // User-side Scene Detection
        const allLocs = getAllLocations();
        const textToScan = text.toLowerCase();
        const matchedLoc = allLocs.find(loc => 
            loc.keywords?.some(kw => textToScan.includes(kw.toLowerCase()))
        );
        if (matchedLoc && matchedLoc.id !== currentLocationId) {
            console.log(`[ChatLogic] User-triggered scene transition: ${matchedLoc.name}`);
            setCurrentLocationId(matchedLoc.id);
            setCurrentSituation(matchedLoc.situation);
            showToast(`Heading to ${matchedLoc.name}...`, "info");
        }
    }, [input, isTyping, messages, executeAiRequest, currentLocationId]);

    const handleSendGift = useCallback(async (gift) => {
        const giftMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `*Sends you a gift: ${gift.name}*` 
        };
        setMessages(prev => [...prev, giftMsg]);
        setRelationshipScore(prev => Math.min(100, prev + gift.bonus));
        
        localStorage.setItem('lastPersonaId', persona.id);
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
        setIsAvatarManual(true);
        setActivePersonaImage(outfit.avatar);
        const outfitMsg = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `*Suggests a change of outfit: ${outfit.name}*` 
        };
        setMessages(prev => [...prev, outfitMsg]);
        
        localStorage.setItem('lastPersonaId', persona.id);
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
                ].slice(0, 50)
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

    const handleClearChat = useCallback(async () => {
        const confirmClear = window.confirm("Are you sure you want to archive and clear this chat history? This cannot be undone.");
        if (!confirmClear) return;

        if (messages.length > 1) {
            try {
                // Archive current talk
                const archiveId = `archive_${persona.id}_${Date.now()}`;
                await db.setItem('conversations', archiveId, {
                    personaId: persona.id,
                    personaName: persona.name,
                    timestamp: new Date().toISOString(),
                    messages: messages
                });
            } catch (e) {
                console.warn("[ChatLogic] Archiving failed during reset", e);
            }
        }
        
        // 1. CLEAR PERSISTENT STORAGE (IndexedDB)
        try {
            await Promise.all([
                db.removeItem('chats', `chat_${persona.id}`),
                db.removeItem('memories', `memory_${persona.id}`),
                db.removeItem('memories', `milestones_${persona.id}`),
                db.removeItem('memories', `traits_${persona.id}`),
                db.removeItem('memories', `encounters_${persona.id}`),
                db.removeItem('settings', `score_${persona.id}`),
                db.removeItem('settings', `intensity_${persona.id}`),
                db.removeItem('settings', `scene_${persona.id}`),
                db.removeItem('settings', `active_image_${persona.id}`)
            ]);
        } catch (e) {
            console.error("[ChatLogic] Failed to clear IndexedDB", e);
        }

        // 2. CLEAR LEGACY STORAGE (LocalStorage)
        localStorage.removeItem(`chat_${persona.id}`);
        localStorage.removeItem(`memory_${persona.id}`);
        localStorage.removeItem(`milestones_${persona.id}`);
        localStorage.removeItem(`encounters_${persona.id}`);
        localStorage.removeItem(`score_${persona.id}`);
        localStorage.removeItem(`intensity_${persona.id}`);

        // 3. RESET COMPONENT STATE
        const initialMsg = {
            id: Date.now().toString(),
            role: 'ai',
            content: cleanLeakage(persona.initialMessage) || "*Smiles softly* Hello..."
        };
        
        setMessages([initialMsg]);
        setMemory("");
        setMilestones([]);
        setTraits([]);
        setEncounterStats({ count: 0, lastLocation: "", history: [] });
        setCurrentSituation("");
        setRelationshipScore(50);
        setIntensity(3);
        setCurrentSceneId('default');
        setActivePersonaImage(persona.image);
        
        showToast("Conversation reset", "success");
    }, [persona, messages, showToast]);

    const handleResubmit = useCallback(async (messageId) => {
        // Find the index of the message to resubmit (the user message)
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1 || isTyping) return;

        // Remove everything after this message (keeping the user message itself)
        const truncatedMessages = messages.slice(0, msgIndex + 1);
        setMessages(truncatedMessages);
        
        localStorage.setItem('lastPersonaId', persona.id);
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        // Add a fresh empty AI bubble for the new response
        setMessages(prev => [...prev.slice(0, msgIndex + 1), { id: aiMessageId, role: 'ai', content: '', isError: false }]);

        await executeAiRequest(aiMessageId, truncatedMessages);
    }, [messages, isTyping, executeAiRequest, persona.id]);
    const handleRepair = useCallback(async (messageId) => {
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1 || isTyping) return;

        // Find the User message that preceded this AI message
        const userMsgIndex = msgIndex - 1;
        if (userMsgIndex < 0) return;

        const truncatedMessages = messages.slice(0, userMsgIndex + 1);
        const userMsg = messages[userMsgIndex];

        setIsTyping(true);
        const aiMessageId = Date.now().toString() + "_repair";
        setMessages(prev => [...prev.slice(0, userMsgIndex + 1), { id: aiMessageId, role: 'ai', content: 'Repairing response...', isError: false }]);

        await executeAiRequest(aiMessageId, truncatedMessages, { isRepair: true });
    }, [messages, isTyping, executeAiRequest]);

    const handleContinue = useCallback(async () => {
        if (isTyping || messages.length === 0) return;

        // Add a subtle user directive to keep the flow going
        const continueMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: "*Waits for you to continue...*" 
        };
        
        setMessages(prev => [...prev, continueMsg]);
        setIsTyping(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', content: '', isError: false }]);

        // We handle the continuation directive inside generateResponse (via isContinuation flag)
        await executeAiRequest(aiMessageId, [...messages, continueMsg], { isContinuation: true });
    }, [messages, isTyping, executeAiRequest]);

    const handleLocationChange = useCallback(async (locationId) => {
        const location = getLocation(locationId);
        if (!location) return;

        setCurrentLocationId(locationId);
        setCurrentSituation(location.situation);
        
        // Add a narrative marker so the AI knows we moved
        const moveMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: `*We move together to the ${location.name}.*`,
            isSystem: true 
        };
        
        setMessages(prev => [...prev, moveMsg]);
        showToast(`Moved to ${location.name}`, "info");

        // Trigger an immediate AI reaction to the new environment
        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', isTyping: true }]);
        setIsTyping(true);
        
        await executeAiRequest(aiMsgId, [...messages, moveMsg], { currentSituation: location.situation });
    }, [messages, executeAiRequest, showToast]);
    const handleUpdateMemory = useCallback((newMemory) => {
        setMemory(newMemory);
        showToast("Memory manually updated", "success");
    }, [showToast]);

    const handleUpdateRelation = useCallback((newRelation) => {
        setCustomRelation(newRelation);
        showToast("Relation role updated", "success");
    }, [showToast]);

    const handleUpdateMilestones = useCallback((newMilestones) => {
        setMilestones(newMilestones);
        showToast("Milestones updated", "success");
    }, [showToast]);

    const handleUpdateEncounters = useCallback((newStats) => {
        setEncounterStats(newStats);
        showToast("Encounters updated", "success");
    }, [showToast]);

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
        currentSuggestions, setCurrentSuggestions,
        messageCountForScene,
        startNewSession,
        switchSession,
        deleteSession,
        sessionId,
        allSessions,
        invitedPersona, setInvitedPersona,
        currentLocationId,
        handleSendMessage,
        handleStopGeneration,
        handleGenerateSuggestion,
        handleSendGift,
        handleSetOutfit,
        handleScanIntimacy,
        handleGenerateSceneImage,
        handleSceneChange,
        handleLocationChange,
        handleScenarioShuffle,
        handleSelectFantasy,
        handleClearChat,
        handleResubmit,
        handleRepair,
        handleContinue,
        handleUpdateMemory,
        handleUpdateRelation,
        handleUpdateMilestones,
        handleUpdateEncounters,
        customRelation
    };
};
