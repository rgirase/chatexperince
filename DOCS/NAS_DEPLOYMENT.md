# Hosting on Ugreen NAS DXP 4800 Plus

Your Ugreen NAS is an excellent choice for hosting the **Web App** (the user interface and logic). This guide recommended a **Hybrid Setup** for the best performance with AI image generation.

## Recommended Architecture
1. **Web App (Vite/React)**: Run this on your **NAS** using Docker. It will be online 24/7 and use very little power.
2. **AI Engine (LM Studio / ComfyUI)**: Run these on your **Main PC** (assuming it has a better GPU). The web app on the NAS will "talk" to your PC over your home network.

---

## 1. Prepare Docker Files
The necessary `Dockerfile` and `docker-compose.yml` have already been created in the project root.

### Dockerfile
The Dockerfile uses a multi-stage build to compile the React app and serve it with Nginx.

### docker-compose.yml
The compose file maps port 8080 on the NAS to the application.

---

## 2. Deployment Steps
1. **Copy Files**: Transfer your project folder (containing `Dockerfile` and `docker-compose.yml`) to a folder on your NAS (e.g., `/volume1/docker/chatexperience`).
2. **UGOS Docker App**:
   - Open the **Docker** app on your Ugreen NAS.
   - Go to **Project** (or Compose) and create a new project.
   - Select the folder where you uploaded the files.
   - It will automatically detect the `docker-compose.yml`. Click **Build/Start**.
3. **Access**: Once running, you can access the app at `http://[NAS-IP-ADDRESS]:8080`.

---

## 3. Configuring AI Endpoints
Since the app is now on the NAS, you need to tell it where your AI models are running (on your PC):
1. Open the app in your browser via the NAS IP.
2. The app uses the following settings (configurable via the UI or LocalStorage):
   - **LM Studio URL**: `http://[YOUR-PC-IP]:1234`
   - **ComfyUI URL**: `http://[YOUR-PC-IP]:8188`

> [!TIP]
> Make sure your PC's firewall allows incoming connections on ports 1234 and 8188 from your local network.

> [!WARNING]
> While you *can* run ComfyUI on the NAS via Docker, the integrated Intel GPU will be very slow (minutes per image). Keeping it on your PC is much faster for interactive roleplay.
