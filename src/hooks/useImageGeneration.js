import { useState, useCallback, useRef } from 'react';
import * as db from '../services/db';
import { DEFAULT_SD_URL, DEFAULT_IMAGE_ENGINE, DEFAULT_COMFY_WORKFLOW } from '../config';

export const useImageGeneration = (persona, setMessages, showToast) => {
    const isMounted = useRef(true);

    const generateSelfie = useCallback(async (prompt, aiMessageId) => {
        const sdUrl = await db.getItem('settings', 'sdUrl') || DEFAULT_SD_URL;
        const imageEngine = await db.getItem('settings', 'imageEngine') || DEFAULT_IMAGE_ENGINE;

        const photoMsgId = aiMessageId + "_photo";
        setMessages(prev => [...prev, { id: photoMsgId, role: 'ai', isPhoto: true, content: '*Sends a photo*', url: null }]);

        const charAppearance = persona.prompt?.match(/APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)/is)?.[1] || "";
        const charIdentity = persona.prompt?.match(/You are\s*(.*?)(?=\n|$)/i)?.[1] || persona.name;
        
        const fullPrompt = `masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting, ${charIdentity}, ${charAppearance}, ${prompt}`;
        const negativePrompt = "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs, watermark, text, signature";

        try {
            let base64Image = null;

            if (imageEngine === 'a1111' || imageEngine === 'drawthings') {
                const response = await fetch(`${sdUrl.replace(/\/$/, '')}/sdapi/v1/txt2img`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        negative_prompt: negativePrompt,
                        steps: 20,
                        width: 512,
                        height: 768
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    base64Image = `data:image/png;base64,${data.images[0]}`;
                } else {
                    throw new Error(`${imageEngine === 'drawthings' ? 'Draw Things' : 'A1111'} API error.`);
                }
            } else if (imageEngine === 'comfyui') {
                let comfyWorkflow = await db.getItem('settings', 'comfyWorkflow');
                if (!comfyWorkflow || !comfyWorkflow.includes('3')) {
                    comfyWorkflow = JSON.stringify(DEFAULT_COMFY_WORKFLOW);
                }

                const workflowObj = JSON.parse(comfyWorkflow);
                if (workflowObj["6"]) workflowObj["6"].inputs.text = fullPrompt;
                if (workflowObj["3"]) workflowObj["3"].inputs.seed = Math.floor(Math.random() * 1000000);

                const queueRes = await fetch(`${sdUrl.replace(/\/$/, '')}/prompt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: workflowObj })
                });
                const queueData = await queueRes.json();
                if (!queueData.prompt_id) throw new Error("ComfyUI failure.");

                const promptId = queueData.prompt_id;
                let isComplete = false;
                let attempts = 0;
                while (!isComplete && attempts < 180) {
                    await new Promise(r => setTimeout(r, 2000));
                    attempts++;
                    const histRes = await fetch(`${sdUrl.replace(/\/$/, '')}/history/${promptId}`);
                    const histData = await histRes.json();
                    if (histData[promptId]) {
                        const outputs = histData[promptId].outputs;
                        for (const nodeId in outputs) {
                            if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                                const paramsObj = new URLSearchParams(outputs[nodeId].images[0]);
                                const viewRes = await fetch(`${sdUrl.replace(/\/$/, '')}/view?${paramsObj.toString()}`);
                                const blob = await viewRes.blob();
                                base64Image = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                isComplete = true;
                                break;
                            }
                        }
                    }
                }
                if (!isComplete) throw new Error("ComfyUI timeout.");
            }

            if (base64Image) {
                setMessages(prev => prev.map(msg => msg.id === photoMsgId ? { ...msg, url: base64Image } : msg));
                showToast("Selfie received!", "success");
                
                // Persistence
                const saved = await db.getItem('chats', `chat_${persona.id}`);
                if (saved) {
                    const updated = saved.map(msg => msg.id === photoMsgId ? { ...msg, url: base64Image } : msg);
                    await db.setItem('chats', `chat_${persona.id}`, updated);
                }
            }
        } catch (e) {
            console.error('Image Generation Error:', e);
            showToast(e.message || "Image generation failed.");
            setMessages(prev => prev.filter(msg => msg.id !== photoMsgId));
        }
    }, [persona, setMessages, showToast]);

    return { generateSelfie };
};
