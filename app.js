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
        if (pageName === 'home') {
            initStoryCanvas();
        } else if (storyAnimId) {
            cancelAnimationFrame(storyAnimId);
        }
    } catch (error) {
        console.error(`Failed to load ${pageName}.html`, error);
        root.innerHTML = `<div class="p-10 text-red-500 font-mono">Error loading module: ${pageName}. Are you running via a local web server?</div>`;
    }
}

// Router Listener
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
 * 3. Background Neural Network Animation
 */
const bgCanvas = document.getElementById('neuralCanvas');
const bgCtx = bgCanvas.getContext('2d');
let bgNodes = [];

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
    requestAnimationFrame(renderBg);
}
renderBg();

/**
 * 4. Interactive Story Visualizer (MPC / YOLOv8 / XAI)
 */
let currentStoryStep = 1, storyAnimId = null, sCtx, storyCanvas, time = 0;

window.setStoryStep = function(step) {
    currentStoryStep = step;
    document.querySelectorAll('.story-step').forEach(el => {
        if(parseInt(el.getAttribute('data-step')) === step) el.classList.add('active');
        else el.classList.remove('active');
    });
    const txt = document.getElementById('vis-status'), vid = document.getElementById('videoContainer');
    if(step === 2) { vid.classList.remove('hidden'); txt.innerText = "SYS.MODE: YOLOV8_PERCEPTION_FEED"; } 
    else { vid.classList.add('hidden'); txt.innerText = step === 1 ? "SYS.MODE: KINEMATIC_MPC" : "SYS.MODE: XAI_DIAGNOSTICS"; }
    time = 0;
};

function initStoryCanvas() {
    storyCanvas = document.getElementById('storyCanvas');
    if(!storyCanvas) return;
    sCtx = storyCanvas.getContext('2d');
    function setSize() { const r = storyCanvas.parentElement.getBoundingClientRect(); storyCanvas.width = r.width; storyCanvas.height = r.height; }
    window.addEventListener('resize', setSize); setSize();
    
    function draw() {
        sCtx.clearRect(0, 0, storyCanvas.width, storyCanvas.height);
        const w = storyCanvas.width, h = storyCanvas.height; time += 0.02;

        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; sCtx.lineWidth = 1;
        for(let i=0; i<w; i+=40) { sCtx.beginPath(); sCtx.moveTo(i, 0); sCtx.lineTo(i, h); sCtx.stroke(); }
        for(let i=0; i<h; i+=40) { sCtx.beginPath(); sCtx.moveTo(0, i); sCtx.lineTo(w, i); sCtx.stroke(); }

        if (currentStoryStep === 1) { // MPC
            const carX = w/4, carY = h/2 + Math.sin(carX * 0.005 - time*2 - 0.5) * 80;
            sCtx.beginPath(); sCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; sCtx.lineWidth = 3;
            for(let x=0; x<w; x+=20) { let ry = h/2 + Math.sin(x*0.005 - time*2)*80; x===0 ? sCtx.moveTo(x, ry-60) : sCtx.lineTo(x, ry-60); }
            for(let x=0; x<w; x+=20) { let ry = h/2 + Math.sin(x*0.005 - time*2)*80; x===0 ? sCtx.moveTo(x, ry+60) : sCtx.lineTo(x, ry+60); }
            sCtx.stroke();
            
            sCtx.beginPath(); sCtx.setLineDash([10,15]); sCtx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            for(let x=0; x<w; x+=20) { let ry = h/2 + Math.sin(x*0.005 - time*2)*80; x===0 ? sCtx.moveTo(x, ry) : sCtx.lineTo(x, ry); }
            sCtx.stroke(); sCtx.setLineDash([]);

            sCtx.beginPath(); sCtx.strokeStyle = '#0ea5e9'; sCtx.lineWidth = 2; sCtx.moveTo(carX, carY);
            let predY = carY;
            for(let step=1; step<=15; step++) {
                let px = carX + step*15, targetY = h/2 + Math.sin(px*0.005 - time*2)*80;
                predY += (targetY - predY)*0.25; sCtx.lineTo(px, predY);
            }
            sCtx.stroke();

            sCtx.save(); sCtx.translate(carX, carY);
            sCtx.rotate(Math.atan2((h/2 + Math.sin((carX+5)*0.005 - time*2 - 0.5)*80) - carY, 5));
            sCtx.fillStyle = '#0ea5e9'; sCtx.fillRect(-15, -10, 30, 20); sCtx.restore();
            sCtx.fillStyle = '#0ea5e9'; sCtx.font = "10px monospace"; sCtx.fillText("MPC N=15", carX+30, carY-40);
        } else if (currentStoryStep === 2) { // YOLO Fallback
            sCtx.fillStyle = 'rgba(16, 185, 129, 0.15)'; 
            sCtx.beginPath(); sCtx.moveTo(w/4, h); sCtx.lineTo(w/2-20, h/2); sCtx.lineTo(w/2+20, h/2); sCtx.lineTo(3*w/4, h); sCtx.fill();
            let o1X = w/2 - 40 + Math.sin(time)*20, o1Y = h/2 + 50 + Math.cos(time)*10;
            sCtx.fillStyle = 'rgba(14, 165, 233, 0.4)'; sCtx.fillRect(o1X-10, o1Y, 80, 40);
            sCtx.strokeStyle = '#0ea5e9'; sCtx.strokeRect(o1X-10, o1Y, 80, 40);
        } else if (currentStoryStep === 3) { // XAI
            const cx = w/2, cy = h/2;
            sCtx.beginPath(); sCtx.arc(cx, cy, 30 + Math.sin(time*5)*5, 0, Math.PI*2);
            sCtx.fillStyle = '#ef4444'; sCtx.fill(); sCtx.font = "12px monospace"; sCtx.fillText("FAULT", cx-15, cy+50);
        }
        storyAnimId = requestAnimationFrame(draw);
    }
    draw();
}