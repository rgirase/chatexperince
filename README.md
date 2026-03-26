# Chat Experience

A high-fidelity AI roleplay application with dynamic persona generation, memory systems, and image generation.

## 🚀 Getting Started

### Local Development
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Ensure **LM Studio** and **ComfyUI** are running locally.

### 🌐 Deploying to NAS
This project includes full support for deployment on specialized NAS hardware like the **Ugreen DXP 4800 Plus**.

- [NAS Deployment Guide](./DOCS/NAS_DEPLOYMENT.md)
- [Dockerfile](./Dockerfile)
- [Docker Compose](./docker-compose.yml)

## 🛠️ Technology Stack
- **Frontend**: React, Vite, Framer Motion
- **Icons**: Lucide React
- **AI**: LM Studio (LLM), ComfyUI (SDXL)
- **Database**: IndexedDB (Local)

## 📁 Project Structure
- `src/data/characters`: Persona definitions
- `src/components`: UI components
- `src/services/llm.js`: AI integration layer
- `scripts/`: Maintenance and asset generation tools
