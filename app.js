/**
 * 1. SPA Routing Logic
 */
async function loadPage(pageName) {
    const root = document.getElementById('app-root');
    try {
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.text();
        root.innerHTML = html;
        
        // Update nav UI active states
        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.getAttribute('data-target') === pageName) {
                link.classList.add('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.remove('text-slate-500', 'border-transparent');
            } else {
                link.classList.remove('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.add('text-slate-500', 'border-transparent');
            }
        });

        // Reinitialize module-specific JS
        initScrollObserver();
        
        // Handle Animation State Contexts
        if (pageName === 'home') {
            initStoryCanvas();
        } else if (storyAnimId) {
            // KILL ghost loops when leaving the home page to prevent memory leaks
            cancelAnimationFrame(storyAnimId); 
            storyAnimId = null;
        }
    } catch (error) {
        console.error(`Failed to load ${pageName}.html`, error);
        root.innerHTML = `<div class="p-10 text-red-500 font-mono">Error loading module: ${pageName}. Are you running via a local web server?</div>`;
    }
}

// Router Listeners
window.addEventListener('hashchange', () => {
    let hash = window.location.hash.substring(1) || 'home';
    loadPage(hash);
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    let hash = window.location.hash.substring(1) || 'home';
    loadPage(hash);
});


/**
 * 2. Scroll Reveal Engine
 */
function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
}


/**
 * 3. Background Neural Network Animation (Runs Globally)
 */
const bgCanvas = document.getElementById('neuralCanvas');
let bgCtx = null;
let bgNodes = [];
let bgAnimId = null;

if (bgCanvas) {
    bgCtx = bgCanvas.getContext('2d');
    function setBgSize() { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; }
    window.addEventListener('resize', setBgSize); setBgSize();

    class BgNode {
        constructor() {
            this.x = Math.random() * bgCanvas.width; this.y = Math.random() * bgCanvas.height;
            this.dx = (Math.random() - 0.5) * 0.3; this.dy = (Math.random() - 0.5) * 0.3; this.r = Math.random() * 1.5 + 1.5;
        }
        update() {
            this.x += this.dx; this.y += this.dy;
            if (this.x < 0 || this.x > bgCanvas.width) this.dx *= -1;
            if (this.y < 0 || this.y > bgCanvas.height) this.dy *= -1;
        }
        draw() { bgCtx.beginPath(); bgCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2); bgCtx.fillStyle = 'rgba(2, 132, 199, 0.25)'; bgCtx.fill(); }
    }

    for(let i=0; i < Math.min(Math.floor(bgCanvas.width / 14), 90); i++) bgNodes.push(new BgNode());

    function renderBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        for(let i=0; i<bgNodes.length; i++) {
            bgNodes[i].update(); bgNodes[i].draw();
            for(let j=i+1; j<bgNodes.length; j++) {
                const dx = bgNodes[i].x - bgNodes[j].x, dy = bgNodes[i].y - bgNodes[j].y;
                if(Math.sqrt(dx*dx + dy*dy) < 140) {
                    bgCtx.beginPath(); bgCtx.moveTo(bgNodes[i].x, bgNodes[i].y); bgCtx.lineTo(bgNodes[j].x, bgNodes[j].y);
                    bgCtx.strokeStyle = 'rgba(2, 132, 199, 0.05)'; bgCtx.stroke();
                }
            }
        }
        bgAnimId = requestAnimationFrame(renderBg);
    }
    renderBg();
}


/**
 * 4. Interactive Story Visualizer (Robust Canvas API version)
 */
let currentStoryStep = 1, storyAnimId = null, sCtx, storyCanvas, time = 0;

// Expose stepper function globally so HTML onclick="" handlers can trigger it
window.setStoryStep = function(step) {
    currentStoryStep = step;
    
    // Manage UI active states
    document.querySelectorAll('.story-step').forEach(el => {
        if(parseInt(el.getAttribute('data-step')) === step) el.classList.add('active');
        else el.classList.remove('active');
    });

    // Update HUD Status Text
    const txt = document.getElementById('vis-status');
    if (txt) {
        if (step === 2) {
            txt.innerText = "SYS.MODE: VISION_DNN_PERCEPTION";
        } else if (step === 3) {
            txt.innerText = "SYS.MODE: XAI_DIAGNOSTICS";
        } else {
            txt.innerText = "SYS.MODE: KINEMATIC_CONTROL";
        }
    }
};

function initStoryCanvas() {
    storyCanvas = document.getElementById('storyCanvas');
    if(!storyCanvas) return;
    
    // PREVENT GLITCHING: Kill any existing animation loops before starting a new one
    if (storyAnimId) {
        cancelAnimationFrame(storyAnimId);
    }

    sCtx = storyCanvas.getContext('2d');
    let cw, ch;
    
    function setSize() { 
        const rect = storyCanvas.parentElement.getBoundingClientRect(); 
        
        // PREVENT BLURRINESS: Scale to device pixel ratio for Retina screens
        const dpr = window.devicePixelRatio || 1;
        storyCanvas.width = rect.width * dpr; 
        storyCanvas.height = rect.height * dpr; 
        sCtx.scale(dpr, dpr);
        storyCanvas.style.width = `${rect.width}px`;
        storyCanvas.style.height = `${rect.height}px`;
        cw = rect.width;
        ch = rect.height;
    }
    
    window.addEventListener('resize', setSize); 
    setSize(); // Initial sizing call
    
    function draw() {
        sCtx.clearRect(0, 0, cw, ch);
        time += 0.02;

        // Draw Base Cyber-Grid
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
        sCtx.lineWidth = 1;
        for(let i=0; i<cw; i+=40) { sCtx.beginPath(); sCtx.moveTo(i, 0); sCtx.lineTo(i, ch); sCtx.stroke(); }
        for(let i=0; i<ch; i+=40) { sCtx.beginPath(); sCtx.moveTo(0, i); sCtx.lineTo(cw, i); sCtx.stroke(); }

        if (currentStoryStep === 1) { 
            // PHASE 1: MPC Kinematics
            
            // 1. Dynamic Curvy Road Math Function (Compound Sine Waves)
            const getRoadY = (x, t) => ch/2 + Math.sin(x * 0.004 - t * 2.5) * 90 + Math.cos(x * 0.002 - t) * 40;
            
            // 2. Draw Road Boundaries
            sCtx.beginPath(); sCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; sCtx.lineWidth = 3;
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? sCtx.moveTo(x, ry-70) : sCtx.lineTo(x, ry-70); }
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? sCtx.moveTo(x, ry+70) : sCtx.lineTo(x, ry+70); }
            sCtx.stroke();
            
            // 3. Draw Reference Trajectory (Centerline Target)
            sCtx.beginPath(); sCtx.setLineDash([10,15]); sCtx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            for(let x=0; x<cw; x+=20) { let ry = getRoadY(x, time); x===0 ? sCtx.moveTo(x, ry) : sCtx.lineTo(x, ry); }
            sCtx.stroke(); sCtx.setLineDash([]);

            // 4. Ego-Vehicle State Definition
            const carX = cw * 0.2; // Keep car fixed on X-axis (treadmill effect)
            // Introduce a slight continuous mathematical disturbance so the MPC visibly has to correct it
            const carY = getRoadY(carX, time) + Math.sin(time * 4) * 15; 
            const nextY = getRoadY(carX + 10, time);
            const headingAngle = Math.atan2(nextY - carY, 10);

            // 5. Draw MPC Prediction Horizon (N-steps forward)
            sCtx.beginPath(); 
            sCtx.strokeStyle = '#f59e0b'; // Amber for prediction lines
            sCtx.lineWidth = 2; 
            sCtx.moveTo(carX, carY);
            
            let simX = carX;
            let simY = carY;
            const horizonSteps = 20; // N=20
            
            // Plot the line
            for(let step=1; step<=horizonSteps; step++) {
                simX += 15; // Step distance
                let targetY = getRoadY(simX, time);
                // Simulate MPC optimizer converging back to the target reference line
                simY += (targetY - simY) * 0.18; 
                sCtx.lineTo(simX, simY);
            }
            sCtx.stroke();
            
            // Plot discrete nodes on the horizon line
            simX = carX; simY = carY;
            for(let step=1; step<=horizonSteps; step++) {
                simX += 15;
                let targetY = getRoadY(simX, time);
                simY += (targetY - simY) * 0.18; 
                sCtx.fillStyle = '#f59e0b';
                sCtx.fillRect(simX - 2, simY - 2, 4, 4);
            }

            // 6. Draw Ego-Vehicle Box
            sCtx.save(); 
            sCtx.translate(carX, carY);
            sCtx.rotate(headingAngle);
            
            // Vehicle Chassis (Moving Box)
            sCtx.fillStyle = '#0f172a'; // Dark slate interior
            sCtx.fillRect(-20, -12, 40, 24); 
            sCtx.strokeStyle = '#0ea5e9'; // Cyan glowing border
            sCtx.lineWidth = 2;
            sCtx.strokeRect(-20, -12, 40, 24);
            
            // Heading Vector (Ego's direct forward orientation)
            sCtx.beginPath();
            sCtx.moveTo(0, 0);
            sCtx.lineTo(35, 0);
            sCtx.strokeStyle = '#10b981'; // Emerald green
            sCtx.lineWidth = 2;
            sCtx.stroke();
            
            sCtx.restore();
            
            // 7. System Tracking Labels
            sCtx.fillStyle = '#0ea5e9'; sCtx.font = "10px monospace"; 
            sCtx.fillText("EGO-VEHICLE", carX - 25, carY - 25);
            sCtx.fillStyle = '#f59e0b';
            sCtx.fillText("PREDICTION HORIZON (N=20)", carX + 60, carY - 45);
            
        } else if (currentStoryStep === 2) { 
            // PHASE 2: Vision DNNs
            
            // Road Segmentation Mask
            sCtx.fillStyle = 'rgba(16, 185, 129, 0.15)'; 
            sCtx.beginPath(); sCtx.moveTo(cw/4, ch); sCtx.lineTo(cw/2-20, ch/2); sCtx.lineTo(cw/2+20, ch/2); sCtx.lineTo(3*cw/4, ch); sCtx.fill();
            
            // Actor 1: Bounding Box & Poly Mask
            let o1X = cw/2 - 40 + Math.sin(time)*20, o1Y = ch/2 + 50 + Math.cos(time)*10;
            sCtx.fillStyle = 'rgba(14, 165, 233, 0.2)'; 
            sCtx.fillRect(o1X-10, o1Y, 80, 40);
            sCtx.strokeStyle = '#0ea5e9'; 
            sCtx.lineWidth = 2;
            sCtx.strokeRect(o1X-10, o1Y, 80, 40);
            
            // Confidence Label
            sCtx.fillStyle = '#0ea5e9'; 
            sCtx.font = "10px monospace"; 
            sCtx.fillText("vehicle: 98%", o1X-10, o1Y - 5);
            
        } else if (currentStoryStep === 3) { 
            // PHASE 3: Functional Safety & XAI
            const cx = cw/2, cy = ch/2;
            
            // Alert Node
            sCtx.beginPath(); 
            sCtx.arc(cx, cy, 30 + Math.sin(time*5)*5, 0, Math.PI*2);
            sCtx.fillStyle = 'rgba(239, 68, 68, 0.6)'; 
            sCtx.fill(); 
            sCtx.strokeStyle = '#ef4444';
            sCtx.lineWidth = 2;
            sCtx.stroke();
            
            // Diagnostic Laser Lines
            sCtx.beginPath();
            sCtx.moveTo(cx, cy); sCtx.lineTo(cx - 80, cy - 50);
            sCtx.moveTo(cx, cy); sCtx.lineTo(cx + 80, cy - 30);
            sCtx.moveTo(cx, cy); sCtx.lineTo(cx - 40, cy + 80);
            sCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            sCtx.stroke();

            // Terminal Alert Text
            sCtx.fillStyle = '#ef4444'; 
            sCtx.font = "bold 12px monospace"; 
            sCtx.fillText("VULNERABILITY DETECTED", cx-75, cy+50);
        }
        
        storyAnimId = requestAnimationFrame(draw);
    }
    
    // Kick off the drawing loop
    draw();
}
