/**
 * ==========================================
 * 1. SPA ROUTING & STATE MANAGEMENT
 * ==========================================
 */
let storyAnimId = null;
let bgAnimId = null;

async function loadPage(pageName) {
    const root = document.getElementById('app-root');
    try {
        // Fetch HTML module
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) throw new Error('Network response was not ok');
        root.innerHTML = await response.text();
        
        // Update Navigation Active States
        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.getAttribute('data-target') === pageName) {
                link.classList.add('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.remove('text-slate-500', 'border-transparent');
            } else {
                link.classList.remove('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.add('text-slate-500', 'border-transparent');
            }
        });

        // Reinitialize Observers
        initScrollObserver();
        
        // Handle Canvas Animation Lifecycle
        if (pageName === 'home') {
            // Slight delay ensures the DOM has injected the canvas element before initializing
            setTimeout(initStoryCanvas, 50); 
        } else if (storyAnimId) {
            // Kill the canvas loop when navigating away to prevent memory leaks/flickering
            cancelAnimationFrame(storyAnimId); 
            storyAnimId = null;
        }
    } catch (error) {
        console.error(`Failed to load ${pageName}.html`, error);
        root.innerHTML = `<div class="p-10 text-red-500 font-mono font-bold">System Error: Failed to load module '${pageName}'. Are you running via a local web server (e.g., VS Code Live Server)?</div>`;
    }
}

// Global Listeners for Navigation
window.addEventListener('hashchange', () => loadPage(window.location.hash.substring(1) || 'home'));
document.addEventListener('DOMContentLoaded', () => loadPage(window.location.hash.substring(1) || 'home'));


/**
 * ==========================================
 * 2. SCROLL REVEAL ENGINE
 * ==========================================
 */
function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
}


/**
 * ==========================================
 * 3. AMBIENT BACKGROUND NEURAL NETWORK
 * ==========================================
 */
const bgCanvas = document.getElementById('neuralCanvas');
if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let bgNodes = [];

    function setBgSize() { 
        bgCanvas.width = window.innerWidth; 
        bgCanvas.height = window.innerHeight; 
    }
    window.addEventListener('resize', setBgSize); 
    setBgSize();

    class BgNode {
        constructor() {
            this.x = Math.random() * bgCanvas.width; 
            this.y = Math.random() * bgCanvas.height;
            this.dx = (Math.random() - 0.5) * 0.3; 
            this.dy = (Math.random() - 0.5) * 0.3; 
            this.r = Math.random() * 1.5 + 1.5;
        }
        update() {
            this.x += this.dx; this.y += this.dy;
            if (this.x < 0 || this.x > bgCanvas.width) this.dx *= -1;
            if (this.y < 0 || this.y > bgCanvas.height) this.dy *= -1;
        }
        draw() { 
            bgCtx.beginPath(); 
            bgCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2); 
            bgCtx.fillStyle = 'rgba(2, 132, 199, 0.25)'; 
            bgCtx.fill(); 
        }
    }

    // Populate network nodes
    for(let i=0; i < Math.min(Math.floor(bgCanvas.width / 14), 90); i++) bgNodes.push(new BgNode());

    function renderBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        for(let i=0; i<bgNodes.length; i++) {
            bgNodes[i].update(); 
            bgNodes[i].draw();
            // Draw connection lines
            for(let j=i+1; j<bgNodes.length; j++) {
                const dx = bgNodes[i].x - bgNodes[j].x;
                const dy = bgNodes[i].y - bgNodes[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 140) {
                    bgCtx.beginPath(); 
                    bgCtx.moveTo(bgNodes[i].x, bgNodes[i].y); 
                    bgCtx.lineTo(bgNodes[j].x, bgNodes[j].y);
                    bgCtx.strokeStyle = `rgba(2, 132, 199, ${0.12 * (1 - dist/140)})`; 
                    bgCtx.stroke();
                }
            }
        }
        bgAnimId = requestAnimationFrame(renderBg);
    }
    renderBg();
}


/**
 * ==========================================
 * 4. INTERACTIVE STORY VISUALIZER (CANVAS API)
 * ==========================================
 */
let currentStoryStep = 1;
let time = 0;

// Expose stepper function globally for HTML onclick events
window.setStoryStep = function(step) {
    currentStoryStep = step;
    
    // Toggle UI styles
    document.querySelectorAll('.story-step').forEach(el => {
        if(parseInt(el.getAttribute('data-step')) === step) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Update HUD Text
    const txt = document.getElementById('vis-status');
    if (txt) {
        if (step === 2) txt.innerText = "SYS.MODE: VISION_DNN_PERCEPTION";
        else if (step === 3) txt.innerText = "SYS.MODE: XAI_DIAGNOSTICS";
        else txt.innerText = "SYS.MODE: KINEMATIC_CONTROL";
    }
};

function initStoryCanvas() {
    const canvas = document.getElementById('storyCanvas');
    if(!canvas) return;
    
    // Safety check: Kill existing loop to prevent hyper-speed rendering
    if (storyAnimId) cancelAnimationFrame(storyAnimId);

    const ctx = canvas.getContext('2d');
    let cw, ch;
    
    // Retina-display scaling setup to prevent blurriness
    function setSize() { 
        const rect = canvas.parentElement.getBoundingClientRect(); 
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr; 
        canvas.height = rect.height * dpr; 
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        cw = rect.width;
        ch = rect.height;
    }
    window.addEventListener('resize', setSize); 
    setSize(); 
    
    function draw() {
        ctx.clearRect(0, 0, cw, ch);
        time += 0.02;

        // Draw Base Cyber-Grid (Shared across all phases)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
        ctx.lineWidth = 1;
        for(let i=0; i<cw; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, ch); ctx.stroke(); }
        for(let i=0; i<ch; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(cw, i); ctx.stroke(); }

        if (currentStoryStep === 1) { 
            // ----------------------------------------------------
            // PHASE 1: MPC KINEMATICS (Ego-Vehicle & Curvy Road)
            // ----------------------------------------------------
            
            // Math for dynamic compound curved road
            const getRoadY = (x, t) => ch/2 + Math.sin(x * 0.004 - t * 2.5) * 90 + Math.cos(x * 0.002 - t) * 40;
            
            // Draw Outer Road Boundaries
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 3;
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? ctx.moveTo(x, ry-70) : ctx.lineTo(x, ry-70); }
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? ctx.moveTo(x, ry+70) : ctx.lineTo(x, ry+70); }
            ctx.stroke();
            
            // Draw Reference Trajectory (Centerline Target)
            ctx.beginPath(); ctx.setLineDash([10,15]); ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? ctx.moveTo(x, ry) : ctx.lineTo(x, ry); }
            ctx.stroke(); ctx.setLineDash([]);

            // Define Ego-Vehicle State
            const carX = cw * 0.2; // Fixed treadmill position
            const carY = getRoadY(carX, time) + Math.sin(time * 4) * 15; // Disturbance injected
            const nextY = getRoadY(carX + 10, time);
            const headingAngle = Math.atan2(nextY - carY, 10);

            // Draw MPC Prediction Horizon (N-steps forward)
            ctx.beginPath(); 
            ctx.strokeStyle = '#f59e0b'; // Amber
            ctx.lineWidth = 2; 
            ctx.moveTo(carX, carY);
            
            let simX = carX;
            let simY = carY;
            const horizonSteps = 20; 
            
            // Connect horizon line
            for(let step=1; step<=horizonSteps; step++) {
                simX += 15; 
                let targetY = getRoadY(simX, time);
                simY += (targetY - simY) * 0.18; // MPC Optimizer converging to reference
                ctx.lineTo(simX, simY);
            }
            ctx.stroke();
            
            // Plot discrete nodes on the horizon
            simX = carX; simY = carY;
            for(let step=1; step<=horizonSteps; step++) {
                simX += 15;
                let targetY = getRoadY(simX, time);
                simY += (targetY - simY) * 0.18; 
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(simX - 2, simY - 2, 4, 4);
            }

            // Draw Ego-Vehicle Box
            ctx.save(); 
            ctx.translate(carX, carY);
            ctx.rotate(headingAngle);
            
            // Chassis Box
            ctx.fillStyle = '#0f172a'; 
            ctx.fillRect(-20, -12, 40, 24); 
            ctx.strokeStyle = '#0ea5e9'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(-20, -12, 40, 24);
            
            // Forward Heading Vector
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(35, 0);
            ctx.strokeStyle = '#10b981'; 
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            
            // System Tags
            ctx.fillStyle = '#0ea5e9'; ctx.font = "10px monospace"; 
            ctx.fillText("EGO-VEHICLE", carX - 25, carY - 25);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText("PREDICTION HORIZON (N=20)", carX + 60, carY - 45);
            
        } else if (currentStoryStep === 2) { 
            // ----------------------------------------------------
            // PHASE 2: VISION DNNs
            // ----------------------------------------------------
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; 
            ctx.beginPath(); ctx.moveTo(cw/4, ch); ctx.lineTo(cw/2-20, ch/2); ctx.lineTo(cw/2+20, ch/2); ctx.lineTo(3*cw/4, ch); ctx.fill();
            
            let o1X = cw/2 - 40 + Math.sin(time)*20, o1Y = ch/2 + 50 + Math.cos(time)*10;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.2)'; 
            ctx.fillRect(o1X-10, o1Y, 80, 40);
            ctx.strokeStyle = '#0ea5e9'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(o1X-10, o1Y, 80, 40);
            
            ctx.fillStyle = '#0ea5e9'; 
            ctx.font = "10px monospace"; 
            ctx.fillText("vehicle: 98%", o1X-10, o1Y - 5);
            
        } else if (currentStoryStep === 3) { 
            // ----------------------------------------------------
            // PHASE 3: XAI DIAGNOSTICS
            // ----------------------------------------------------
            const cx = cw/2, cy = ch/2;
            
            ctx.beginPath(); 
            ctx.arc(cx, cy, 30 + Math.sin(time*5)*5, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)'; 
            ctx.fill(); 
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(cx, cy); ctx.lineTo(cx - 80, cy - 50);
            ctx.moveTo(cx, cy); ctx.lineTo(cx + 80, cy - 30);
            ctx.moveTo(cx, cy); ctx.lineTo(cx - 40, cy + 80);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.stroke();

            ctx.fillStyle = '#ef4444'; 
            ctx.font = "bold 12px monospace"; 
            ctx.fillText("VULNERABILITY DETECTED", cx-75, cy+50);
        }
        
        // Loop recursively
        storyAnimId = requestAnimationFrame(draw);
    }
    
    // Start engine
    draw();
}