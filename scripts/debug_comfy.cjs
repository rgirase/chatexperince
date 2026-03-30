const http = require('http');
const promptId = 'e69fef19-1748-4efb-bab9-dca89a100c7d';
const url = `http://127.0.0.1:8000/history/${promptId}`;

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const history = JSON.parse(data);
        const item = history[promptId];
        console.log("ALL OUTPUT KEYS:", Object.keys(item.outputs || {}));
        if (item.outputs && item.outputs["13"]) {
            console.log("NODE 13 OUTPUT:", JSON.stringify(item.outputs["13"], null, 2));
        } else {
            console.log("NODE 13 NOT FOUND IN OUTPUTS");
        }
        if (item.status && item.status.execution_error) {
            const err = item.status.execution_error;
            console.log("EXCEPTION MESSAGE:", err.exception_message);
        }
    });
});
