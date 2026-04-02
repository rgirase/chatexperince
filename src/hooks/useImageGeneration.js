import { useState, useCallback, useRef } from 'react';
import * as db from '../services/db';
import { DEFAULT_SD_URL, DEFAULT_IMAGE_ENGINE, DEFAULT_COMFY_WORKFLOW } from '../config';
import { CLOTHING_TYPES, COLORS, SKIN_TEXTURES, LIGHTING_MODES } from '../data/imageGenOptions';

export const useImageGeneration = (persona, setMessages, showToast) => {
    const isMounted = useRef(true);

    const generateSelfie = useCallback(async (prompt, aiMessageId, aspectRatio = 'portrait', selectedModel = null, clothing = '', color = '', skin = 'none', lighting = 'natural', realismHigh = false) => {
        const sdUrl = localStorage.getItem('sdUrl') || DEFAULT_SD_URL;
        const imageEngine = localStorage.getItem('imageEngine') || DEFAULT_IMAGE_ENGINE;

        const photoMsgId = aiMessageId + "_photo";
        setMessages(prev => [...prev, { id: photoMsgId, role: 'ai', isPhoto: true, content: '*Sends a photo*', url: null }]);

        const charAppearance = persona.prompt?.match(/APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)/is)?.[1] || "";
        const charIdentity = persona.prompt?.match(/You are\s*(.*?)(?=\n|$)/i)?.[1] || persona.name;
        
        // --- REALISM OVERHAUL (v3.0) ---
        // Score tags are better with weights on Pony
        const SCORE_TAGS = "score_9, score_8_up, score_7_up, ";
        const PHOTO_BOOSTERS = "(highly detailed skin textures:1.4), macro photography, skin pores, moles, Physically-Based Rendering, ray tracing, depth of field, sharp focus, (natural skin:1.2), ";
        const REALISM_LORA = realismHigh ? "<lora:Pony_Realism_2:0.6>, " : "";

        const PONY_PREFIX = `${SCORE_TAGS}${PHOTO_BOOSTERS}${REALISM_LORA}rating_explicit, masterpiece, photorealistic, 8k uhd, `;
        const isPonyModel = selectedModel?.toLowerCase().includes('pony');
        const finalPrefix = isPonyModel ? PONY_PREFIX : "masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting, ";

        // NEGATIVE PROMPT (STRONG SUPPRESSION)
        const PONY_NEGATIVE = "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs, watermark, text, signature, (clothing:0.2), (clothes:0.2), (plastic skin:1.3), (doll:1.2), (airbrushed:1.2), flat color, 3D render, CGI, video game";
        const negativePrompt = isPonyModel ? PONY_NEGATIVE : "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs, watermark, text, signature, (clothing:0.2), (clothes:0.2)";

        const charLoras = {
            'hostage_brat_valentina': '<lora:valentina_pony_v1:0.9>',
            'isabella_noble': '<lora:isabella_noble_pony:0.9>'
        };

        const charLora = charLoras[persona.id] || "";
        
        // --- SELECTIONS ---
        const selectedClothingObj = CLOTHING_TYPES.find(c => c.id === clothing);
        const selectedColorObj = COLORS.find(c => c.id === color);
        const selectedSkinObj = SKIN_TEXTURES.find(s => s.id === skin);
        const selectedLightingObj = LIGHTING_MODES.find(l => l.id === lighting);

        let clothingPart = "";
        if (selectedClothingObj && selectedClothingObj.id !== 'none') {
            const colorText = (selectedColorObj && selectedColorObj.id !== 'none') ? `${selectedColorObj.text} ` : "";
            clothingPart = `(${selectedClothingObj.text.replace('wearing ', `wearing ${colorText}`)}:1.4)`;
        }

        const skinPart = selectedSkinObj ? selectedSkinObj.text : "";
        const lightingPart = selectedLightingObj ? selectedLightingObj.text : "";

        const fullPrompt = `${finalPrefix}${charIdentity}, ${clothingPart ? clothingPart + ', ' : ''}${skinPart ? skinPart + ', ' : ''}${lightingPart ? lightingPart + ', ' : ''}${charAppearance}, ${charLora}, ${prompt}`;

        try {
            let base64Image = null;

            if (imageEngine === 'a1111' || imageEngine === 'drawthings') {
                let genWidth = 512;
                let genHeight = 768;
                if (aspectRatio === 'landscape') { genWidth = 768; genHeight = 512; }
                else if (aspectRatio === 'square') { genWidth = 512; genHeight = 512; }

                const response = await fetch(`${sdUrl.replace(/\/$/, '')}/sdapi/v1/txt2img`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        negative_prompt: negativePrompt,
                        steps: 20,
                        width: genWidth,
                        height: genHeight
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    base64Image = `data:image/png;base64,${data.images[0]}`;
                } else {
                    throw new Error(`${imageEngine === 'drawthings' ? 'Draw Things' : 'A1111'} API error.`);
                }
            } else if (imageEngine === 'comfyui') {
                let comfyWorkflow = localStorage.getItem('comfyWorkflow');
                const isPonyModel = selectedModel?.toLowerCase().includes('pony');
                if (!comfyWorkflow || !comfyWorkflow.includes('3')) {
                    comfyWorkflow = JSON.stringify(isPonyModel ? DEFAULT_PONY_WORKFLOW : DEFAULT_COMFY_WORKFLOW);
                }

                const targetPrompt = `${charIdentity}, ${clothingPart ? clothingPart + ', ' : ''}${charAppearance}, ${prompt}`;
                
                let parsedPrompt = targetPrompt;
                const loraRegex = /<lora:([^:>]+)(?::([0-9.]+))?>/g;
                let loraMatches = [];
                let match;
                while ((match = loraRegex.exec(targetPrompt)) !== null) {
                    loraMatches.push({ name: match[1], weight: match[2] ? parseFloat(match[2]) : 0.8 });
                    parsedPrompt = parsedPrompt.replace(match[0], '');
                }

                const workflowObj = JSON.parse(comfyWorkflow);

                if (selectedModel) {
                    const ckptNodeId = Object.keys(workflowObj).find(k => workflowObj[k].class_type === 'CheckpointLoaderSimple' || workflowObj[k].class_type === 'CheckpointLoader');
                    if (ckptNodeId) {
                        workflowObj[ckptNodeId].inputs.ckpt_name = selectedModel;
                    }
                }

                if (workflowObj["5"] && workflowObj["5"].class_type === "EmptyLatentImage") {
                    const isSD15 = workflowObj["5"].inputs.width === 512 || workflowObj["5"].inputs.height === 512 || workflowObj["5"].inputs.height === 768;
                    if (isSD15) {
                        workflowObj["5"].inputs.width = aspectRatio === 'landscape' ? 768 : (aspectRatio === 'square' ? 512 : 512);
                        workflowObj["5"].inputs.height = aspectRatio === 'landscape' ? 512 : (aspectRatio === 'square' ? 512 : 768);
                    } else {
                        workflowObj["5"].inputs.width = aspectRatio === 'landscape' ? 1216 : (aspectRatio === 'square' ? 1024 : 832);
                        workflowObj["5"].inputs.height = aspectRatio === 'landscape' ? 832 : (aspectRatio === 'square' ? 1024 : 1216);
                    }
                }

                // POSITIVE PROMPT
                if (workflowObj["6"]) {
                    const isPonyModel = selectedModel?.toLowerCase().includes('pony');
                    const comfyPrefix = isPonyModel ? PONY_PREFIX : "masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting, ";
                    
                    if (workflowObj["6"].inputs.text.includes('__PROMPT__')) {
                        workflowObj["6"].inputs.text = workflowObj["6"].inputs.text.replace('__PROMPT__', `${comfyPrefix}${parsedPrompt}`);
                    } else {
                        workflowObj["6"].inputs.text = `${comfyPrefix}${parsedPrompt}`;
                    }
                }

                // NEGATIVE PROMPT (NODE 7 IS STANDARD FOR NEGATIVE)
                if (workflowObj["7"]) {
                    const baseNeg = "lowres, bad quality, anime, cartoon, sketch, ugly, blurry, deformed, mutated, extra limbs, watermark, text, signature";
                    const clothingSuppression = clothingPart ? ", (clothing:0.1), (clothes:0.1)" : "";
                    workflowObj["7"].inputs.text = baseNeg + clothingSuppression;
                }

                // Dynamically inject LoRA nodes if tags were found
                if (loraMatches.length > 0) {
                    const ckptId = Object.keys(workflowObj).find(k => workflowObj[k].class_type === 'CheckpointLoaderSimple' || workflowObj[k].class_type === 'CheckpointLoader');
                    if (ckptId) {
                        let currentModelLink = [ckptId, 0];
                        let currentClipLink = [ckptId, 1];
                        
                        let loraIdCounter = 900;
                        for (const lora of loraMatches) {
                            const newId = (loraIdCounter++).toString();
                            workflowObj[newId] = {
                                class_type: "LoraLoader",
                                inputs: {
                                    lora_name: lora.name,
                                    strength_model: lora.weight,
                                    strength_clip: lora.weight,
                                    model: currentModelLink,
                                    clip: currentClipLink
                                }
                            };
                            currentModelLink = [newId, 0];
                            currentClipLink = [newId, 1];
                        }

                        // Redirect all nodes that referenced the base checkpoint directly
                        for (const [nodeId, nodeConfig] of Object.entries(workflowObj)) {
                            if (parseInt(nodeId) >= 900) continue;
                            if (!nodeConfig.inputs) continue;
                            for (const [inputKey, inputValue] of Object.entries(nodeConfig.inputs)) {
                                if (Array.isArray(inputValue)) {
                                    if (inputValue[0] === ckptId && inputValue[1] === 0) {
                                        workflowObj[nodeId].inputs[inputKey] = currentModelLink;
                                    } else if (inputValue[0] === ckptId && inputValue[1] === 1) {
                                        workflowObj[nodeId].inputs[inputKey] = currentClipLink;
                                    }
                                }
                            }
                        }
                    }
                }

                if (workflowObj["3"]) workflowObj["3"].inputs.seed = Math.floor(Math.random() * 1000000);

                const queueRes = await fetch(`${sdUrl.replace(/\/$/, '')}/prompt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: workflowObj })
                });
                const queueData = await queueRes.json();
                if (!queueData.prompt_id) throw new Error("ComfyUI failure.");

                const promptId = queueData.prompt_id;
                setMessages(prev => prev.map(msg => msg.id === photoMsgId ? { ...msg, comfyPromptId: promptId } : msg));
                
                let isComplete = false;
                let attempts = 0;
                while (!isComplete && attempts < 180) {
                    await new Promise(r => setTimeout(r, 2000));
                    attempts++;
                    try {
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
                                } else if (outputs[nodeId].gifs || outputs[nodeId].videos) {
                                    // Support for Animated/Video outputs
                                    const videoData = (outputs[nodeId].gifs || outputs[nodeId].videos)[0];
                                    const paramsObj = new URLSearchParams(videoData);
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
                    } catch (pollError) {
                        console.warn("ComfyUI polling blocked or timeout (normal during generation), retrying...", pollError);
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
