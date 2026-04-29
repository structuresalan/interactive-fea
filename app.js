// --- Initialize Code Editor ---
const codeTextArea = document.getElementById('code-editor');
const editor = CodeMirror.fromTextArea(codeTextArea, {
    mode: "javascript",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4
});

// User's function (default is the broken stub)
let userCalculateDisplacement = function(F, K) { return 0; };

// --- DOM Elements ---
const forceSlider = document.getElementById('force-slider');
const stiffSlider = document.getElementById('stiff-slider');
const forceValLabel = document.getElementById('force-val');
const stiffValLabel = document.getElementById('stiff-val');
const calcOutput = document.getElementById('calc-output');
const errorMsg = document.getElementById('editor-error');
const canvas = document.getElementById('feaCanvas');
const ctx = canvas.getContext('2d');

// --- Event Listeners ---
forceSlider.addEventListener('input', updateState);
stiffSlider.addEventListener('input', updateState);

document.getElementById('run-code-btn').addEventListener('click', () => {
    const userCode = editor.getValue();
    errorMsg.textContent = ""; // Clear previous errors
    
    try {
        // Construct a safe evaluation wrapper that returns the user's function
        // The user code string is expected to define `function calculateDisplacement(F, K) { ... }`
        const evalCode = `
            ${userCode}
            if (typeof calculateDisplacement !== 'function') {
                throw new Error("Function 'calculateDisplacement' not found. Please do not rename it.");
            }
            return calculateDisplacement;
        `;
        
        const wrapperFunc = new Function(evalCode);
        userCalculateDisplacement = wrapperFunc();
        
        // Immediately trigger an update to show the effects of the new code
        updateState();
    } catch (e) {
        errorMsg.textContent = "Code Error: " + e.message;
    }
});

// --- Core Logic & Drawing ---
function updateState() {
    const F = parseFloat(forceSlider.value);
    const K = parseFloat(stiffSlider.value);
    
    forceValLabel.textContent = `${F} N`;
    stiffValLabel.textContent = `${K} N/m`;
    
    let dx = 0;
    try {
        // Try calling the user's compiled function
        dx = userCalculateDisplacement(F, K);
        if (typeof dx !== 'number' || isNaN(dx)) {
            throw new Error("Function must return a valid number");
        }
        errorMsg.textContent = ""; 
    } catch (e) {
        dx = 0;
        errorMsg.textContent = "Runtime Error: " + e.message;
    }
    
    calcOutput.innerHTML = `Displacement (&Delta;x) = ${dx.toFixed(2)} m`;
    
    drawVisual(F, K, dx);
}

function drawVisual(F, K, dx) {
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerY = canvas.height / 2;
    const wallX = 50;
    const baseSpringLen = (canvas.width / 2) - wallX;
    
    // Scale dx visually so we can see it easily on canvas
    const visualScale = 200; 
    const dxVisual = dx * visualScale;
    
    // Draw Wall
    ctx.fillStyle = "gray";
    ctx.fillRect(wallX - 30, centerY - 100, 30, 200);
    
    // Draw Spring (Original state faintly)
    drawSpring(ctx, wallX, wallX + baseSpringLen, centerY, "rgba(0, 0, 0, 0.1)");
    
    // Draw Spring (Deformed state)
    const endX = wallX + baseSpringLen + dxVisual;
    drawSpring(ctx, wallX, endX, centerY, "#2563eb");
    
    // Draw Node
    ctx.beginPath();
    ctx.arc(endX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626"; // Red node
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
    
    // Draw Force Arrow
    if (F !== 0) {
        drawArrow(ctx, endX + (F > 0 ? 15 : -15), centerY - 40, endX + (F > 0 ? 65 : -65), centerY - 40, "#dc2626");
        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${F} N`, endX + (F > 0 ? 40 : -40), centerY - 55);
    }
}

function drawSpring(ctx, startX, endX, y, color) {
    const numCoils = 15;
    const width = endX - startX;
    const coilWidth = width / numCoils;
    
    ctx.beginPath();
    ctx.moveTo(startX, y);
    
    for (let i = 0; i < numCoils; i++) {
        let x = startX + i * coilWidth;
        let nextX = startX + (i + 1) * coilWidth;
        let midX = (x + nextX) / 2;
        ctx.lineTo(midX, i % 2 === 0 ? y - 30 : y + 30);
        ctx.lineTo(nextX, y);
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    const headLen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Initial draw
updateState();
