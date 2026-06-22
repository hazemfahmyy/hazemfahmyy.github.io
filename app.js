/**
 * ==========================================
 * 1. SPA ROUTING & STATE MANAGEMENT
 * ==========================================
 */
let storyAnimId = null;
let bgAnimId = null;
let storyLoopToken = 0; // Absolute guard against concurrent/ghost animation loops
let bgLoopToken = 0;

async function loadPage(pageName) {
    const root = document.getElementById('app-root');
    
    // Instantly terminate and invalidate any existing animation loops
    storyLoopToken++; 
    bgLoopToken++;
    if (storyAnimId) { cancelAnimationFrame(storyAnimId); storyAnimId = null; }
    if (bgAnimId) { cancelAnimationFrame(bgAnimId); bgAnimId = null; }

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
            initStoryCanvas(); 
            initBgCanvas();
        }
    } catch (error) {
        console.error(`Failed to load ${pageName}.html`, error);
        root.innerHTML = `<div class="p-10 text-red-500 font-mono font-bold">System Error: Failed to load module '${pageName}'. Are you running via a local web server?</div>`;
    }
}

// Router Event Hooks
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
function initBgCanvas() {
    const bgCanvas = document.getElementById('neuralCanvas');
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    let bgNodes = [];
    
    const myBgToken = bgLoopToken;

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
        if (step === 2) txt.innerText = "SYS.MODE: YOLOV8_SEGMENTATION_PIPELINE";
        else if (step === 3) txt.innerText = "SYS.MODE: XAI_LRP_BACKPROPAGATION";
        else txt.innerText = "SYS.MODE: MPC_KINEMATICS";
    }
};

function initStoryCanvas() {
    const canvas = document.getElementById('storyCanvas');
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    let cw, ch;
    
    const myStoryToken = storyLoopToken; 

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
        if (myStoryToken !== storyLoopToken) return; 
        
        ctx.clearRect(0, 0, cw, ch);
        time += 0.02;

        // Draw Base Cyber-Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
        ctx.lineWidth = 1;
        for(let i=0; i<cw; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, ch); ctx.stroke(); }
        for(let i=0; i<ch; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(cw, i); ctx.stroke(); }

        if (currentStoryStep === 1) { 
            // ----------------------------------------------------
            // PHASE 1: MPC KINEMATICS (Dynamic Real-Time Highway Flow)
            // ----------------------------------------------------
            // Compute a horizontal scroll offset based on speed
            const scrollX = time * 140; 
            
            // Road Math shifts X linearly, moving curves perfectly from right to left
            const getRoadY = (x) => ch/2 + Math.sin((x + scrollX) * 0.007) * 45 + Math.cos((x + scrollX) * 0.003) * 20;
            
            // Outer Road Left/Right Boundaries
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 3;
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry-50) : ctx.lineTo(x, ry-50); }
            ctx.stroke();
            
            ctx.beginPath();
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry+50) : ctx.lineTo(x, ry+50); }
            ctx.stroke();
            
            // Centerline Track
            ctx.save();
            ctx.beginPath(); 
            ctx.setLineDash([12, 18]); 
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 2;
            for(let x=0; x<cw; x+=10) { let ry = getRoadY(x); x===0 ? ctx.moveTo(x, ry) : ctx.lineTo(x, ry); }
            ctx.stroke(); 
            ctx.restore();

            // Ego-Vehicle Calculations
            const carX = cw * 0.25; 
            const carY = getRoadY(carX); 
            const lookAheadY = getRoadY(carX + 8);
            // Dynamic heading angle shifts fluidly to follow road profile slope
            const headingAngle = Math.atan2(lookAheadY - carY, 8);

            // Draw Adaptive MPC Horizon Preview Path
            // Calculates points forward in coordinate space to visualize upcoming trajectory
            ctx.beginPath(); 
            ctx.strokeStyle = '#f59e0b'; 
            ctx.lineWidth = 2.5; 
            ctx.moveTo(carX, carY);
            for(let step=1; step<=25; step++) {
                let simX = carX + (step * 11);
                ctx.lineTo(simX, getRoadY(simX));
            }
            ctx.stroke();

            // Ego-Vehicle Chassis rendering
            ctx.save(); 
            ctx.translate(carX, carY);
            ctx.rotate(headingAngle);
            ctx.fillStyle = '#0f172a'; 
            ctx.fillRect(-20, -11, 40, 22); 
            ctx.strokeStyle = '#0ea5e9'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(-20, -11, 40, 22);
            
            // Forward Orientation Indicator Vector
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(35, 0);
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
            
            // Diagnostic HUD Overlay Metadata
            ctx.fillStyle = '#0ea5e9'; ctx.font = "10px monospace"; 
            ctx.fillText("EGO_ACTUATOR_NODE", carX - 30, carY - 25);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText("MPC_PREDICTION_HORIZON (N=25)", carX + 40, carY - 40);
            
        } else if (currentStoryStep === 2) { 
            // ----------------------------------------------------
            // PHASE 2: YOLOv8 SEMANTIC SEGMENTATION & CLASSIFICATION
            // ----------------------------------------------------
            let carX = cw/2 - 80 + Math.sin(time)*30;
            let carY = ch/2 + Math.cos(time*0.5)*15;
            
            let tX = cw/4 + Math.cos(time*0.8)*20;
            let tY = ch/2 + 70 + Math.sin(time*1.2)*10;

            // 1. Car Shape
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(carX, carY+15); ctx.lineTo(carX+20, carY); ctx.lineTo(carX+70, carY); ctx.lineTo(carX+90, carY+15); ctx.lineTo(carX+90, carY+35); ctx.lineTo(carX, carY+35);
            ctx.fill();
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(carX+10, carY+30, 20, 10); ctx.fillRect(carX+60, carY+30, 20, 10);

            // 2. Truck Shape
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(tX, tY+10); ctx.lineTo(tX+30, tY+10); ctx.lineTo(tX+40, tY); ctx.lineTo(tX+120, tY); ctx.lineTo(tX+120, tY+40); ctx.lineTo(tX, tY+40);
            ctx.fill();
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(tX+15, tY+35, 20, 12); ctx.fillRect(tX+80, tY+35, 20, 12);

            // YOLO Graphics Overlays
            ctx.fillStyle = 'rgba(14, 165, 233, 0.4)'; 
            ctx.beginPath();
            ctx.moveTo(carX, carY+15); ctx.lineTo(carX+20, carY); ctx.lineTo(carX+70, carY); ctx.lineTo(carX+90, carY+15); ctx.lineTo(carX+90, carY+35); ctx.lineTo(carX, carY+35);
            ctx.fill();
            ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
            ctx.strokeRect(carX-2, carY-2, 94, 44); 
            ctx.fillStyle = '#0ea5e9'; ctx.fillRect(carX-2, carY-18, 70, 16); 
            ctx.fillStyle = '#fff'; ctx.font = "bold 10px monospace"; ctx.fillText("car 0.98", carX+2, carY-6);

            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)'; 
            ctx.beginPath();
            ctx.moveTo(tX, tY+10); ctx.lineTo(tX+30, tY+10); ctx.lineTo(tX+40, tY); ctx.lineTo(tX+120, tY); ctx.lineTo(tX+120, tY+40); ctx.lineTo(tX, tY+40);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
            ctx.strokeRect(tX-2, tY-2, 124, 49); 
            ctx.fillStyle = '#f59e0b'; ctx.fillRect(tX-2, tY-18, 85, 16); 
            ctx.fillStyle = '#fff'; ctx.font = "bold 10px monospace"; ctx.fillText("truck 0.91", tX+2, tY-6);

        } else if (currentStoryStep === 3) { 
            // ----------------------------------------------------
            // PHASE 3: XAI DIAGNOSTICS (Layer-wise Relevance Backprop)
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

            // Draw Connections
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

            // Draw Nodes
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