// --- App State & Navigation ---
const navItems = document.querySelectorAll('#nav-list li');
const modules = document.querySelectorAll('.module');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        modules.forEach(m => m.classList.remove('active-module'));
        
        item.classList.add('active');
        const target = item.getAttribute('data-target');
        document.getElementById(target).classList.add('active-module');
        
        // Refresh codemirror instances when they become visible
        editors[target].refresh();
        updateStates();
    });
});

// --- Initialize CodeMirror Editors ---
const editors = {
    'module-1': CodeMirror.fromTextArea(document.getElementById('editor-m1'), { mode: "javascript", theme: "dracula", lineNumbers: true }),
    'module-2': CodeMirror.fromTextArea(document.getElementById('editor-m2'), { mode: "javascript", theme: "dracula", lineNumbers: true }),
    'module-3': CodeMirror.fromTextArea(document.getElementById('editor-m3'), { mode: "javascript", theme: "dracula", lineNumbers: true })
};

// --- Module Solutions ---
const solutions = {
    'module-1': `function calculateDisplacement(F, K) {\n    return F / K;\n}`,
    'module-2': `function getLocalMatrix(K) {\n    return [\n        [ K, -K],\n        [-K,  K]\n    ];\n}`,
    'module-3': `function getGlobalMatrix(K1, K2) {\n    return [\n        [ K1,     -K1,        0],\n        [-K1, K1 + K2,      -K2],\n        [  0,     -K2,       K2]\n    ];\n}`
};

// Bind Solution Buttons
document.getElementById('btn-sol-m1').addEventListener('click', () => { editors['module-1'].setValue(solutions['module-1']); updateModule1(); });
document.getElementById('btn-sol-m2').addEventListener('click', () => { editors['module-2'].setValue(solutions['module-2']); updateModule2(); });
document.getElementById('btn-sol-m3').addEventListener('click', () => { editors['module-3'].setValue(solutions['module-3']); updateModule3(); });

// Bind Run Buttons
document.getElementById('btn-run-m1').addEventListener('click', updateModule1);
document.getElementById('btn-run-m2').addEventListener('click', updateModule2);
document.getElementById('btn-run-m3').addEventListener('click', updateModule3);

// --- Global Evaluator ---
function evaluateUserCode(editorKey, funcName, errorEl) {
    const code = editors[editorKey].getValue();
    errorEl.textContent = "";
    try {
        const evalCode = `
            ${code}
            if (typeof ${funcName} !== 'function') throw new Error("Function '${funcName}' not found.");
            return ${funcName};
        `;
        return new Function(evalCode)();
    } catch (e) {
        errorEl.textContent = "Code Error: " + e.message;
        return null;
    }
}


// ==============================================
// MODULE 1 LOGIC
// ==============================================
const canvasM1 = document.getElementById('canvas-m1');
const ctxM1 = canvasM1.getContext('2d');
const F_m1 = document.getElementById('slider-F-m1');
const K_m1 = document.getElementById('slider-K-m1');

F_m1.addEventListener('input', updateModule1);
K_m1.addEventListener('input', updateModule1);

function updateModule1() {
    const F = parseFloat(F_m1.value);
    const K = parseFloat(K_m1.value);
    document.getElementById('val-F-m1').textContent = `${F} N`;
    document.getElementById('val-K-m1').textContent = `${K} N/m`;
    
    let dx = 0;
    const userFunc = evaluateUserCode('module-1', 'calculateDisplacement', document.getElementById('error-m1'));
    if (userFunc) {
        try { dx = userFunc(F, K); } catch(e) { document.getElementById('error-m1').textContent = e.message; }
    }
    
    document.getElementById('output-m1').innerHTML = `Displacement (&Delta;x) = ${(dx||0).toFixed(2)} m`;
    drawModule1Visual(F, K, dx || 0);
}

function drawModule1Visual(F, K, dx) {
    ctxM1.clearRect(0, 0, canvasM1.width, canvasM1.height);
    const centerY = canvasM1.height / 2;
    const wallX = 50;
    const baseSpringLen = (canvasM1.width / 2) - wallX;
    const visualScale = 200; 
    const dxVisual = dx * visualScale;
    
    // Draw Wall
    ctxM1.fillStyle = "gray";
    ctxM1.fillRect(wallX - 30, centerY - 100, 30, 200);
    
    // Draw Spring
    drawSpring(ctxM1, wallX, wallX + baseSpringLen, centerY, "rgba(0,0,0,0.1)"); // original
    const endX = wallX + baseSpringLen + dxVisual;
    drawSpring(ctxM1, wallX, endX, centerY, "#2563eb"); // deformed
    
    // Node
    ctxM1.beginPath(); ctxM1.arc(endX, centerY, 15, 0, Math.PI * 2);
    ctxM1.fillStyle = "#dc2626"; ctxM1.fill(); ctxM1.stroke();
    
    // Force Arrow
    if (F !== 0) {
        drawArrow(ctxM1, endX + (F > 0 ? 15 : -15), centerY - 40, endX + (F > 0 ? 65 : -65), centerY - 40, "#dc2626");
        ctxM1.fillText(`${F} N`, endX + (F > 0 ? 40 : -40), centerY - 55);
    }
}


// ==============================================
// MODULE 2 LOGIC
// ==============================================
const K_m2 = document.getElementById('slider-K-m2');
K_m2.addEventListener('input', updateModule2);

function updateModule2() {
    const K = parseFloat(K_m2.value);
    document.getElementById('val-K-m2').textContent = `${K} N/m`;
    
    let matrixHtml = `<div class="matrix-row"><span>?</span><span>?</span></div><div class="matrix-row"><span>?</span><span>?</span></div>`;
    
    const userFunc = evaluateUserCode('module-2', 'getLocalMatrix', document.getElementById('error-m2'));
    if (userFunc) {
        try {
            const mat = userFunc(K);
            if (mat && mat.length === 2 && mat[0].length === 2) {
                matrixHtml = `<div class="matrix-row"><span>${mat[0][0]}</span><span>${mat[0][1]}</span></div>
                              <div class="matrix-row"><span>${mat[1][0]}</span><span>${mat[1][1]}</span></div>`;
            }
        } catch(e) { document.getElementById('error-m2').textContent = e.message; }
    }
    
    document.getElementById('matrix-m2').innerHTML = matrixHtml;
}


// ==============================================
// MODULE 3 LOGIC
// ==============================================
const K1_m3 = document.getElementById('slider-K1-m3');
const K2_m3 = document.getElementById('slider-K2-m3');
K1_m3.addEventListener('input', updateModule3);
K2_m3.addEventListener('input', updateModule3);

function updateModule3() {
    const K1 = parseFloat(K1_m3.value);
    const K2 = parseFloat(K2_m3.value);
    document.getElementById('val-K1-m3').textContent = K1;
    document.getElementById('val-K2-m3').textContent = K2;
    
    let matrixHtml = `<div class="matrix-row"><span>?</span><span>?</span><span>?</span></div>
                      <div class="matrix-row"><span>?</span><span>?</span><span>?</span></div>
                      <div class="matrix-row"><span>?</span><span>?</span><span>?</span></div>`;
    
    const userFunc = evaluateUserCode('module-3', 'getGlobalMatrix', document.getElementById('error-m3'));
    if (userFunc) {
        try {
            const mat = userFunc(K1, K2);
            if (mat && mat.length === 3 && mat[0].length === 3) {
                matrixHtml = `<div class="matrix-row"><span>${mat[0][0]}</span><span>${mat[0][1]}</span><span>${mat[0][2]}</span></div>
                              <div class="matrix-row"><span>${mat[1][0]}</span><span>${mat[1][1]}</span><span>${mat[1][2]}</span></div>
                              <div class="matrix-row"><span>${mat[2][0]}</span><span>${mat[2][1]}</span><span>${mat[2][2]}</span></div>`;
            }
        } catch(e) { document.getElementById('error-m3').textContent = e.message; }
    }
    document.getElementById('matrix-m3').innerHTML = matrixHtml;
}


// --- Drawing Helpers ---
function drawSpring(ctx, startX, endX, y, color) {
    const numCoils = 15; const width = endX - startX; const coilWidth = width / numCoils;
    ctx.beginPath(); ctx.moveTo(startX, y);
    for (let i = 0; i < numCoils; i++) {
        let x = startX + i * coilWidth; let nextX = startX + (i + 1) * coilWidth; let midX = (x + nextX) / 2;
        ctx.lineTo(midX, i % 2 === 0 ? y - 30 : y + 30); ctx.lineTo(nextX, y);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
}
function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    const headLen = 10; const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY); ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
}

function updateStates() {
    updateModule1();
    updateModule2();
    updateModule3();
}

// Initial draw
setTimeout(() => updateStates(), 100);

