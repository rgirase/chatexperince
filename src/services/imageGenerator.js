import * as db from './db';
import { DEFAULT_SD_URL, DEFAULT_IMAGE_ENGINE, DEFAULT_COMFY_WORKFLOW, DEFAULT_PONY_WORKFLOW } from '../config';
import { CLOTHING_TYPES, COLORS, SKIN_TEXTURES, LIGHTING_MODES, PIERCING_TYPES, TATTOO_TYPES } from '../data/imageGenOptions';

/**
 * Standalone Image Generation Service
 * Handles the communication with ComfyUI/SD outside of React context.
 */
export const generateImage = async (params) => {
    const {
        persona,
        prompt,
        aspectRatio = 'portrait',
        isComic = false,
        activeModel = null,
        clothing = '',
        color = '',
        skin = 'none',
        lighting = 'natural',
        realismHigh = false,
        isAnimated = false,
        piercing = 'none',
        tattoo = 'none',
        isRefinement = false,
        refinementImageId = null,
        refinementImage = null, // Base64 image data
        refinementStrength = 0.5,
        onStatus = null
    } = params;

    const sdUrl = localStorage.getItem('sdUrl') || DEFAULT_SD_URL;
    const imageEngine = localStorage.getItem('imageEngine') || DEFAULT_IMAGE_ENGINE;
    
    // Core prompt construction (Sync with useImageGeneration.js)
    const charAppearance = persona.prompt?.match(/APPEARANCE:\s*(.*?)(?=\n|BACKSTORY:|$)/is)?.[1] || "";
    const charIdentity = persona.prompt?.match(/You are\s*(.*?)(?=\n|$)/i)?.[1] || persona.name.split('(')[0].trim();
    
    // --- REALISM & COMIC OVERHAUL ---
    const SCORE_TAGS = "score_9, score_8_up, score_7_up, ";
    const PHOTO_BOOSTERS = "(highly detailed skin textures:1.4), macro photography, skin pores, skin textures, Physically-Based Rendering, ray tracing, depth of field, sharp focus, (natural skin:1.2), ";
    const COMIC_BOOSTERS = "comic book style, bold lines, cel shaded, highly detailed illustration, vibrant colors, (ink outlines:1.2), masterpiece, (environmental storytelling:1.3), vivid background, ";
    const REALISM_LORA = realismHigh && !isComic ? "<lora:Pony_Realism_2:0.6>, " : "";

    const PONY_PREFIX = isComic ? COMIC_BOOSTERS : `${SCORE_TAGS}${PHOTO_BOOSTERS}${REALISM_LORA}photo (medium), 8k, high quality, cinematic, rating_explicit, masterpiece, photorealistic, 8k uhd, `;
    const isPonyModel = activeModel && (activeModel.toLowerCase().includes('pony') || activeModel.toLowerCase().includes('lust') || activeModel.toLowerCase().includes('alchemist'));
    const finalPrefix = isPonyModel ? PONY_PREFIX : (isComic ? COMIC_BOOSTERS : "photo (medium), 8k, high quality, cinematic, masterpiece, best quality, highly photorealistic, 8k uhd, cinematic lighting, ");

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
    const selectedPiercingObj = PIERCING_TYPES.find(p => p.id === piercing);
    const selectedTattooObj = TATTOO_TYPES.find(t => t.id === tattoo);

    let clothingPart = "";
    if (selectedClothingObj && selectedClothingObj.id !== 'none') {
        const colorText = (selectedColorObj && selectedColorObj.id !== 'none') ? `${selectedColorObj.text} ` : "";
        clothingPart = `(${selectedClothingObj.text.replace('wearing ', `wearing ${colorText}`)}:1.4)`;
    }

    const skinPart = (selectedSkinObj && !isComic) ? selectedSkinObj.text : "";
    const lightingPart = selectedLightingObj ? selectedLightingObj.text : "";
    const piercingPart = (selectedPiercingObj && selectedPiercingObj.id !== 'none') ? `(${selectedPiercingObj.text}:1.4)` : "";
    const tattooPart = (selectedTattooObj && selectedTattooObj.id !== 'none') ? `(${selectedTattooObj.text}:1.5)` : "";

    const fullPrompt = `${finalPrefix}${charIdentity}, ${clothingPart ? clothingPart + ', ' : ''}${skinPart ? skinPart + ', ' : ''}${lightingPart ? lightingPart + ', ' : ''}${piercingPart ? piercingPart + ', ' : ''}${tattooPart ? tattooPart + ', ' : ''}${charAppearance}, ${charLora}, ${prompt}`;

    try {
        if (imageEngine === 'comfyui') {
            // Helper to upload image if refining
            let uploadedFilename = null;
            if (isRefinement && refinementImage) {
                try {
                    const uploadFormData = new FormData();
                    // Convert base64 to blob
                    const base64Data = refinementImage.split(',')[1] || refinementImage;
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/png' });
                    
                    uploadFormData.append('image', blob, `refinement_${Date.now()}.png`);
                    uploadFormData.append('overwrite', 'true');

                    const uploadRes = await fetch(`${sdUrl.replace(/\/$/, '')}/upload/image`, {
                        method: 'POST',
                        body: uploadFormData
                    });
                    const uploadData = await uploadRes.json();
                    uploadedFilename = uploadData.name;
                } catch (err) {
                    console.error("Image upload failed for refinement:", err);
                }
            }

            const comfyWorkflow = JSON.parse(JSON.stringify(isPonyModel ? DEFAULT_PONY_WORKFLOW : DEFAULT_COMFY_WORKFLOW));
            const findNodeByType = (type) => Object.keys(comfyWorkflow).find(k => comfyWorkflow[k].class_type === type);
            const ckptId = findNodeByType('CheckpointLoaderSimple') || findNodeByType('CheckpointLoader');
            const samplerId = findNodeByType('KSampler');
            const latentId = findNodeByType('EmptyLatentImage');
            
            if (activeModel && ckptId) {
                comfyWorkflow[ckptId].inputs.ckpt_name = activeModel;
            }

            if (latentId && comfyWorkflow[latentId]) {
                const isSD15 = comfyWorkflow[latentId].inputs.width === 512 || comfyWorkflow[latentId].inputs.height === 512;
                if (isSD15) {
                    comfyWorkflow[latentId].inputs.width = aspectRatio === 'landscape' ? 768 : (aspectRatio === 'square' ? 512 : 512);
                    comfyWorkflow[latentId].inputs.height = aspectRatio === 'landscape' ? 512 : (aspectRatio === 'square' ? 512 : 768);
                } else {
                    comfyWorkflow[latentId].inputs.width = aspectRatio === 'landscape' ? 1216 : (aspectRatio === 'square' ? 1024 : 832);
                    comfyWorkflow[latentId].inputs.height = aspectRatio === 'landscape' ? 832 : (aspectRatio === 'square' ? 1024 : 1216);
                }
            }

            if (comfyWorkflow["6"]) comfyWorkflow["6"].inputs.text = fullPrompt;
            if (comfyWorkflow["3"]) {
                comfyWorkflow["3"].inputs.seed = Math.floor(Math.random() * 1000000);
                if (isRefinement) {
                    comfyWorkflow["3"].inputs.denoise = refinementStrength;
                }
            }

            // REFINEMENT NODE INJECTION
            if (isRefinement && uploadedFilename && samplerId) {
                // Remove EmptyLatentImage
                if (latentId) delete comfyWorkflow[latentId];

                // Add LoadImage node
                comfyWorkflow["100"] = {
                    class_type: "LoadImage",
                    inputs: { image: uploadedFilename }
                };

                // Add VAEEncode node
                comfyWorkflow["101"] = {
                    class_type: "VAEEncode",
                    inputs: {
                        pixels: ["100", 0],
                        vae: [ckptId || "4", 2]
                    }
                };

                // Connect to Sampler
                comfyWorkflow[samplerId].inputs.latent_image = ["101", 0];
            }

            const queueRes = await fetch(`${sdUrl.replace(/\/$/, '')}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: comfyWorkflow })
            });

            const queueData = await queueRes.json();
            if (!queueData.prompt_id) throw new Error("Queue failed.");

            const promptId = queueData.prompt_id;
            if (onStatus) onStatus(promptId);
            
            let attempts = 0;
            while (attempts < 60) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
                const histRes = await fetch(`${sdUrl.replace(/\/$/, '')}/history/${promptId}`);
                const histData = await histRes.json();
                
                if (histData[promptId]) {
                    const outputs = histData[promptId].outputs;
                    let foundMedia = null;
                    for (const nodeId in outputs) {
                        if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                            foundMedia = outputs[nodeId].images[0];
                            break;
                        }
                    }
                    if (foundMedia) {
                        const paramsObj = new URLSearchParams(foundMedia);
                        const viewRes = await fetch(`${sdUrl.replace(/\/$/, '')}/view?${paramsObj.toString()}`);
                        const blob = await viewRes.blob();
                        return await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    }
                }
            }
            throw new Error("Generation timed out.");
        }
    } catch (e) {
        throw e;
    }
};
