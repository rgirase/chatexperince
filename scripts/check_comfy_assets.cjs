const http = require('http');

async function getInfo(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:8000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        console.log("Checking ComfyUI Assets...");
        const objectInfo = await getInfo('/object_info');
        
        // Find CheckpointLoaderSimple options
        const ckptLoader = objectInfo['CheckpointLoaderSimple'] || objectInfo['CheckpointLoader'];
        if (ckptLoader) {
            console.log("\n--- AVAILABLE CHECKPOINTS ---");
            console.log(JSON.stringify(ckptLoader.input.required.ckpt_name[0], null, 2));
        }

        console.log("\n--- VIDEO NODES ---");
        const videoNodes = Object.keys(objectInfo).filter(k => k.includes('Video') || k.includes('VHS'));
        console.log(JSON.stringify(videoNodes, null, 2));
    } catch (e) {
        console.error("Error connecting to ComfyUI:", e.message);
    }
}

main();
