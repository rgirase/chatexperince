import { useCallback } from 'react';
import * as db from '../services/db';
import { generateComicPrompts } from '../services/llm';
import { generateImage } from '../services/imageGenerator';

/**
 * useImageGeneration hook 2.0
 * Refactored to utilize the shared imageGenerator service for DRY consistency.
 */
export const useImageGeneration = (persona, setMessages, showToast) => {

    const generateSelfie = useCallback(async (
        prompt, 
        aiMessageId, 
        aspectRatio = 'portrait', 
        selectedModel = null, 
        clothing = '', 
        color = '', 
        skin = 'none', 
        lighting = 'natural', 
        realismHigh = false, 
        isAnimated = false, 
        isComic = false, 
        comicPanelInfo = null, 
        piercing = 'none', 
        tattoo = 'none', 
        isRefinement = false, 
        refinementImageId = null,
        refinementImage = null,
        refinementStrength = 0.5
    ) => {
        const preferredComicModel = localStorage.getItem('preferredComicModel') || 'disneyrealcartoonmix_v10.safetensors';
        const activeModel = selectedModel || (isComic ? preferredComicModel : null);
        
        const photoMsgId = aiMessageId + "_photo";
        
        let msgContent = '*Sends a photo*';
        if (isComic) {
            msgContent = comicPanelInfo ? `*Generates comic panel ${comicPanelInfo.index}/${comicPanelInfo.total}*` : '*Generates a comic illustration*';
        }

        // 1. Initial UI Setup
        setMessages(prev => {
            if (isComic && comicPanelInfo) {
                // Update the main comic strip message to track this panel's progress
                return prev.map(msg => {
                    if (msg.id === aiMessageId && msg.isComicStrip) {
                        const newPanels = [...(msg.panels || [])];
                        if (newPanels[comicPanelInfo.index - 1]) {
                            // Link panel to this placeholder logic
                        }
                        return { ...msg, panels: newPanels };
                    }
                    return msg;
                });
            } else {
                // Standard photo placeholder
                if (!prev.some(m => m.id === photoMsgId)) {
                    return [...prev, { 
                        id: photoMsgId, role: 'ai', isPhoto: true, content: msgContent, url: null, 
                        image: null, isIllustration: !!selectedModel && !isComic 
                    }];
                }
                return prev;
            }
        });

        try {
            // 2. Delegate to Shared Service
            const base64Image = await generateImage({
                persona, prompt, aspectRatio, isComic, activeModel,
                clothing, color, skin, lighting, realismHigh,
                isAnimated, piercing, tattoo, isRefinement, refinementImageId,
                refinementImage, refinementStrength,
                onStatus: (promptId) => {
                    setMessages(prev => {
                        if (isComic && comicPanelInfo) {
                            return prev.map(msg => {
                                if (msg.id === aiMessageId && msg.isComicStrip) {
                                    const newPanels = [...(msg.panels || [])];
                                    if (newPanels[comicPanelInfo.index - 1]) {
                                        newPanels[comicPanelInfo.index - 1].comfyPromptId = promptId;
                                    }
                                    return { ...msg, panels: newPanels };
                                }
                                return msg;
                            });
                        }
                        return prev.map(msg => msg.id === photoMsgId ? { ...msg, comfyPromptId: promptId } : msg);
                    });
                }
            });

            if (base64Image) {
                // 3. UI Updates 
                if (isComic && comicPanelInfo) {
                    const panelId = `${aiMessageId}_panel_${comicPanelInfo.index}`;
                    setMessages(prev => {
                        const updated = prev.map(msg => {
                            if (msg.id === aiMessageId && msg.isComicStrip) {
                                const newPanels = [...(msg.panels || [])];
                                if (newPanels[comicPanelInfo.index - 1]) newPanels[comicPanelInfo.index - 1].url = base64Image;
                                return { ...msg, panels: newPanels };
                            }
                            return msg;
                        });
                        
                        // Check if specific panel message exists, otherwise push
                        if (!updated.some(m => m.id === panelId)) {
                            updated.push({
                                id: panelId, role: 'ai', isPhoto: true, 
                                content: comicPanelInfo.caption || `Panel ${comicPanelInfo.index}`,
                                url: base64Image, image: base64Image, timestamp: new Date().toISOString()
                            });
                        } else {
                            return updated.map(m => m.id === panelId ? { ...m, url: base64Image, image: base64Image } : m);
                        }
                        return updated;
                    });
                } else {
                    setMessages(prev => prev.map(msg => msg.id === photoMsgId ? { ...msg, url: base64Image, image: base64Image } : msg));
                }
                
                showToast(isComic ? `Panel ${comicPanelInfo?.index || ''} complete!` : "Selfie received!", "success");
                
                // 4. Persistence
                const currentSid = await db.getItem('settings', `active_session_${persona.id}`) || 'default';
                const chatKey = `chat_${persona.id}_${currentSid}`;
                const saved = await db.getItem('chats', chatKey);
                
                if (saved) {
                    let updated = saved.map(msg => {
                        if (isComic && msg.id === aiMessageId && msg.isComicStrip) {
                            const newPanels = [...(msg.panels || [])];
                            if (newPanels[comicPanelInfo.index - 1]) newPanels[comicPanelInfo.index - 1].url = base64Image;
                            return { ...msg, panels: newPanels };
                        }
                        if (msg.id === photoMsgId) return { ...msg, url: base64Image, image: base64Image };
                        return msg;
                    });

                    if (isComic && comicPanelInfo) {
                        const panelId = `${aiMessageId}_panel_${comicPanelInfo.index}`;
                        if (!updated.some(m => m.id === panelId)) {
                             updated.push({
                                id: panelId, role: 'ai', isPhoto: true,
                                content: comicPanelInfo.caption || `Panel ${comicPanelInfo.index}`,
                                url: base64Image, image: base64Image, timestamp: new Date().toISOString()
                            });
                        } else {
                            updated = updated.map(m => m.id === panelId ? { ...m, url: base64Image, image: base64Image } : m);
                        }
                    }
                    await db.setItem('chats', chatKey, updated);
                }
            }
        } catch (e) {
            console.error('Image Generation Error:', e);
            showToast(e.message || "Image generation failed.");
        }
    }, [persona, setMessages, showToast]);

    const generateComicStrip = useCallback(async (messages) => {
        showToast("Drafting Storyboard...", "info");
        try {
            const panels = await generateComicPrompts(persona, messages);
            if (!panels || panels.length === 0) throw new Error("Narrative engine failed.");
            
            const comicMsgId = (Date.now()).toString() + "_comic";
            setMessages(prev => [...prev, { 
                id: comicMsgId, role: 'ai', isComicStrip: true, isComplete: false,
                panels: panels.map(p => ({ ...p, url: null }))
            }]);
            
            const preferredComicModel = localStorage.getItem('preferredComicModel') || 'disneyrealcartoonmix_v10.safetensors';
            const panelPromises = panels.map((p, i) => generateSelfie(p.visual, comicMsgId, 'square', preferredComicModel, '', '', 'none', 'natural', false, false, true, { index: i + 1, total: panels.length, caption: p.caption }));
            
            await Promise.all(panelPromises);
            setMessages(prev => prev.map(msg => msg.id === comicMsgId ? { ...msg, isComplete: true } : msg));
        } catch (e) {
            console.error(e);
            showToast("Comic generation failed.");
        }
    }, [persona, setMessages, showToast, generateSelfie]);

    return { generateSelfie, generateComicStrip };
};
