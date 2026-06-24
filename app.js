/**
 * ==========================================
 * 1. SPA ROUTING & STATE MANAGEMENT
 * ==========================================
 */
let storyAnimId = null;
let bgAnimId = null;
let storyLoopToken = 0; 
let bgLoopToken = 0;

// Track active window event handlers to prevent catastrophic memory leaks across page swaps
let activeWindowListeners = [];

function clearWindowListeners() {
    activeWindowListeners.forEach(item => {
        window.removeEventListener(item.type, item.listener);
    });
    activeWindowListeners = [];
}

async function loadPage(pageName) {
    const root = document.getElementById('app-root');
    
    // Instantly terminate and invalidate any existing animation loops
    storyLoopToken++; 
    bgLoopToken++;
    if (storyAnimId) { cancelAnimationFrame(storyAnimId); storyAnimId = null; }
    if (bgAnimId) { cancelAnimationFrame(bgAnimId); bgAnimId = null; }

    // Flush out dangling global resize triggers from previously destroyed page elements
    clearWindowListeners();

    try {
        const response = await fetch(`${pageName}.html`);
        if (!response.ok) throw new Error('Network response was not ok');
        root.innerHTML = await response.text();
        
        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.getAttribute('data-target') === pageName) {
                link.classList.add('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.remove('text-slate-500', 'border-transparent');
            } else {
                link.classList.remove('text-sky-600', 'bg-sky-50', 'border-sky-100');
                link.classList.add('text-slate-500', 'border-transparent');
            }
        });

        initScrollObserver();
        
        if (pageName === 'home') {
            requestAnimationFrame(() => {
                initStoryCanvas();
                initBgCanvas();
            });
        }
    } catch (error) {
        console.error(`Failed to load ${pageName}.html`, error);
        root.innerHTML = `<div class="p-10 text-red-500 font-mono font-bold">System Error: Failed to load module '${pageName}'. Are you running via a local web server?</div>`;
    }
}

// Fixed Router Event Hooks
window.addEventListener('hashchange', (e) => {
    let hash = window.location.hash.substring(1) || 'home';
    
    if (document.getElementById(hash)) {
        return; // Safe exit out to handle native CSS smooth scroll targets smoothly
    }
    
    loadPage(hash);
});

document.addEventListener('DOMContentLoaded', () => {
    let hash = window.location.hash.substring(1) || 'home';
    if (!document.getElementById(hash)) {
        loadPage(hash);
    }
});

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
 * SCROLL-TO-TOP TELEMETRY TRIGGER
 * ==========================================
 */
document.addEventListener("DOMContentLoaded", () => {
    const topButton = document.getElementById("scrollToTopBtn");
    if (!topButton) return;

    // Show button when page drops past 400 vertical viewport pixels
    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
            topButton.classList.remove("opacity-0", "pointer-events-none", "scale-75");
            topButton.classList.add("opacity-100", "pointer-events-all", "scale-100");
        } else {
            topButton.classList.remove("opacity-100", "pointer-events-all", "scale-100");
            topButton.classList.add("opacity-0", "pointer-events-none", "scale-75");
        }
    });

    // Execute smooth scrolling mechanics on trigger activation
    topButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
/**
 * ==========================================
 * 3. AMBIENT BACKGROUND NEURAL NETWORK
 * ==========================================
 */
function initBgCanvas() {
    const bgCanvas = document.getElementById('neuralCanvas');
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    let bgNodes = [];
    
    const myBgToken = bgLoopToken;

    function setBgSize() { 
        if (!bgCanvas) return;
        bgCanvas.width = window.innerWidth; 
        bgCanvas.height = window.innerHeight; 
    }
    
    // Register event handler with architectural tracker
    window.addEventListener('resize', setBgSize); 
    activeWindowListeners.push({ type: 'resize', listener: setBgSize });
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

    for(let i=0; i < Math.min(Math.floor(bgCanvas.width / 14), 90); i++) bgNodes.push(new BgNode());

    function renderBg() {
        if (myBgToken !== bgLoopToken) return; 
        
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        for(let i=0; i<bgNodes.length; i++) {
            bgNodes[i].update(); 
            bgNodes[i].draw();
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

window.setStoryStep = function(step) {
    currentStoryStep = step;
    
    document.querySelectorAll('.story-step').forEach(el => {
        if(parseInt(el.getAttribute('data-step')) === step) el.classList.add('active');
        else el.classList.remove('active');
    });

    const txt = document.getElementById('vis-status');
    if (txt) {
        if (step === 2) txt.innerText = "SYS.MODE: XAI";
        else if (step === 3) txt.innerText = "SYS.MODE: XAI_LRP_BACKPROPAGATION";
        else txt.innerText = "SYS.MODE: MPC_KINEMATICS";
    }
};

function initStoryCanvas() {
    const canvas = document.getElementById('storyCanvas');
    if(!canvas) return;

    // Explicitly bind click event listeners to make chapters interactive
    document.querySelectorAll('.story-step').forEach(el => {
        el.onclick = function() {
            const step = parseInt(this.getAttribute('data-step'));
            window.setStoryStep(step);
        };
    });

    const ctx = canvas.getContext('2d');
    let cw = 0, ch = 0;
    
    const myStoryToken = storyLoopToken; 

    function setSize() { 
        if (!canvas || !canvas.parentElement) return;
        const rect = canvas.parentElement.getBoundingClientRect(); 
        const dpr = window.devicePixelRatio || 1;
        
        cw = rect.width;
        ch = rect.height;
        
        canvas.width = cw * dpr; 
        canvas.height = ch * dpr; 
        ctx.scale(dpr, dpr);
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
    }
    
    // Safe memory-managed tracking registration
    window.addEventListener('resize', setSize); 
    activeWindowListeners.push({ type: 'resize', listener: setSize });
    
    setSize(); 
    
    function draw() {
        if (myStoryToken !== storyLoopToken) return; 
        
        // Anti-Thrashing Optimization Strategy:
        // Safely check dimensions without causing forced-layout render blocking loop locks.
        if ((cw === 0 || ch === 0) && canvas.parentElement) {
            const currentRect = canvas.parentElement.getBoundingClientRect();
            if (currentRect.width > 0 && currentRect.height > 0) {
                setSize();
            }
        }

        // Keep loop ticking alive safely even if rendering panel boundaries collapse
        if (cw === 0 || ch === 0) {
            storyAnimId = requestAnimationFrame(draw);
            return;
        }
        
        ctx.clearRect(0, 0, cw, ch);
        time += 0.02;

        // Draw Base Cyber-Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
        ctx.lineWidth = 1;
        for(let i=0; i<cw; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, ch); ctx.stroke(); }
        for(let i=0; i<ch; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(cw, i); ctx.stroke(); }
if (currentStoryStep === 1) { 
            // ----------------------------------------------------
            // PHASE 1: MPC KINEMATICS (Discrete Control Loop Simulation)
            // ----------------------------------------------------
            // Static lane center definition
            const getRoadY = (x) => ch/2 + Math.sin(x * 0.007) * 45 + Math.cos(x * 0.003) * 20;
            
            // Draw static top boundary
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 3;
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry-50) : ctx.lineTo(x, ry-50); }
            ctx.stroke();
            
            // Draw static bottom boundary
            ctx.beginPath();
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry+50) : ctx.lineTo(x, ry+50); }
            ctx.stroke();
            
            // Draw static centerline
            ctx.save();
            ctx.beginPath(); 
            ctx.setLineDash([12, 18]); 
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 2;
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry) : ctx.lineTo(x, ry); }
            ctx.stroke(); 
            ctx.restore();

            // Continuous forward longitudinal progress
            const carX = (time * 140) % (cw + 400) - 100; 

            // DISCRETE CONTROLLER MATH: Simulate a 4Hz control loop update interval
            const controlHz = 4.0; 
            const currentCycle = Math.floor(time * controlHz);
            const cycleProgress = (time * controlHz) % 1; // Linear progress (0 to 1) inside current timestep
            
            // Function to generate pseudo-random tracking target offsets away from the centerline
            const getTargetOffset = (c) => Math.sin(c * 1.3) * 15 + Math.cos(c * 0.7) * 6;
            
            const prevTarget = getTargetOffset(currentCycle - 1);
            const currentTarget = getTargetOffset(currentCycle);
            
            // Aggressive cubic ease-out curve models the sudden response of the steering actuator adjusting at step start
            const steerEase = 1 - Math.pow(1 - cycleProgress, 3);
            const lateralOffset = prevTarget + (currentTarget - prevTarget) * steerEase;
            
            // Establish actual off-center vehicle Y coordinate
            const carY = getRoadY(carX) + lateralOffset; 

            // CALCULATE HEADING: Look an infinitesimal step ahead in time to match actual composite velocity vector
            const dt = 0.015;
            const nextTime = time + dt;
            const nextCarX = (nextTime * 140) % (cw + 400) - 100;
            const nextCycle = Math.floor(nextTime * controlHz);
            const nextProgress = (nextTime * controlHz) % 1;
            const nextEase = 1 - Math.pow(1 - nextProgress, 3);
            const nextLateralOffset = getTargetOffset(nextCycle - 1) + (getTargetOffset(nextCycle) - getTargetOffset(nextCycle - 1)) * nextEase;
            const nextCarY = getRoadY(nextCarX) + nextLateralOffset;
            
            const headingAngle = Math.atan2(nextCarY - carY, nextCarX - carX);

            // DRAW MPC HORIZON: Plots path showing the vehicle predicting recovery back onto the centerline
            ctx.beginPath(); 
            ctx.strokeStyle = '#f59e0b'; 
            ctx.lineWidth = 2.5; 
            ctx.moveTo(carX, carY);
            for(let step=1; step<=25; step++) {
                let simX = carX + (step * 11);
                let horizonRatio = step / 25;
                // The mathematical horizon model plans an exponential convergence curve back to center (offset -> 0)
                let predictedOffset = lateralOffset * Math.pow(1 - horizonRatio, 1.6);
                ctx.lineTo(simX, getRoadY(simX) + predictedOffset);
            }
            ctx.stroke();

            // Translate and rotate the Ego vehicle chassis
            ctx.save(); 
            ctx.translate(carX, carY);
            ctx.rotate(headingAngle);
            ctx.fillStyle = '#0f172a'; 
            ctx.fillRect(-20, -11, 40, 22); 
            ctx.strokeStyle = '#0ea5e9'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(-20, -11, 40, 22);
            
            // Directional heading vector pointer
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(35, 0);
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
            
            // Dynamic HUD Text overlays following the off-center vehicle
            ctx.fillStyle = '#0ea5e9'; ctx.font = "10px monospace"; 
            ctx.fillText("EGO_ACTUATOR_NODE", carX - 30, carY - 25);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText("MPC_PREDICTION_HORIZON (N=25)", carX + 40, carY - 40);
         } else if (currentStoryStep === 2) { 
            // ----------------------------------------------------
            // PHASE 3: XAI DIAGNOSTICS
            // ----------------------------------------------------
            const layers = [5, 7, 7, 2]; 
            const layerSpacing = cw / (layers.length + 1);
            const nodeSpacing = 35;
            let nodes = [];
            
            layers.forEach((count, i) => {
                for(let j=0; j<count; j++) {
                    nodes.push({
                        layer: i,
                        index: j,
                        x: layerSpacing * (i + 1),
                        y: ch/2 - ((count-1)*nodeSpacing)/2 + j*nodeSpacing,
                        relevance: (i === 3 && j === 0) ? 1.0 : 
                                   (i === 2 && (j === 2 || j === 4)) ? 0.8 :
                                   (i === 1 && (j === 3 || j === 5)) ? 0.6 :
                                   (i === 0 && j === 1) ? 1.0 : 0.0 
                    });
                }
            });

            nodes.forEach(n1 => {
                nodes.forEach(n2 => {
                    if (n2.layer === n1.layer + 1) {
                        ctx.beginPath();
                        ctx.moveTo(n1.x, n1.y);
                        ctx.lineTo(n2.x, n2.y);
                        
                        const isRelevanceEdge = (
                            (n1.layer === 0 && n1.index === 1 && (n2.index === 3 || n2.index === 5)) ||
                            (n1.layer === 1 && (n1.index === 3 || n1.index === 5) && (n2.index === 2 || n2.index === 4)) ||
                            (n1.layer === 2 && (n1.index === 2 || n1.index === 4) && n2.index === 0)
                        );

                        if (isRelevanceEdge) {
                            ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(time*6)*0.4})`;
                            ctx.lineWidth = 3;
                        } else {
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                            ctx.lineWidth = 1;
                        }
                        ctx.stroke();
                    }
                });
            });

            nodes.forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 8, 0, Math.PI*2);
                
                if (n.relevance > 0.5) {
                    ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + Math.sin(time*6)*0.4})`;
                    ctx.fill();
                    ctx.strokeStyle = '#f87171';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#0f172a';
                    ctx.fill();
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                if (n.layer === 3 && n.index === 0) {
                    ctx.fillStyle = '#ef4444'; ctx.font = "bold 10px monospace";
                    ctx.fillText("OUTPUT: MISCLASSIFICATION", n.x + 15, n.y + 4);
                }
                if (n.layer === 0 && n.index === 1) {
                    ctx.fillStyle = '#ef4444'; ctx.font = "bold 10px monospace";
                    ctx.fillText("LRP ROOT CAUSE", n.x - 100, n.y + 4);
                }
            });
        }
        
        storyAnimId = requestAnimationFrame(draw);
    }
    
    draw();
}