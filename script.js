// Agent Slime - AI Agent Simulation Game

class SlimeAgent {
constructor(id, x, y) {
this.id = id;
this.x = x;
this.y = y;
this.vx = 0;
this.vy = 0;
this.level = 1;
this.exp = 0;
this.color = ['#7dd3fc', '#f9a8d4', '#c084fc', '#fcd34d'][Math.floor(Math.random() * 4)];
this.shape = 'round';
this.size = 20;
this.targetX = x;
this.targetY = y;
this.state = 'idle';
this.gatherSpeed = 1;
this.energyGen = 1;
this.lastUpdate = Date.now();
}

update() {
const now = Date.now();
const dt = (now - this.lastUpdate) / 1000;
this.lastUpdate = now;

if (this.state === 'idle') {
if (Math.random() < 0.02) {
this.targetX = Math.random() * (window.innerWidth - 40) + 20;
this.targetY = Math.random() * (window.innerHeight * 0.4 - 40) + 20;
this.state = 'moving';
}
} else if (this.state === 'moving') {
const dx = this.targetX - this.x;
const dy = this.targetY - this.y;
const dist = Math.sqrt(dx * dx + dy * dy);

if (dist < 5) {
this.state = 'gathering';
setTimeout(() => { this.state = 'idle'; }, 2000 / this.gatherSpeed);
} else {
this.vx = (dx / dist) * 50 * dt;
this.vy = (dy / dist) * 50 * dt;
this.x += this.vx;
this.y += this.vy;
}
}

if (this.state === 'gathering') {
return this.energyGen * dt;
}
return 0;
}

draw(ctx) {
ctx.save();
ctx.translate(this.x, this.y);
ctx.shadowColor = this.color;
ctx.shadowBlur = 15;
ctx.fillStyle = this.color;
ctx.beginPath();
ctx.arc(0, 0, this.size, 0, Math.PI * 2);
ctx.fill();
ctx.shadowBlur = 0;
ctx.fillStyle = 'rgba(255,255,255,0.3)';
ctx.beginPath();
ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#1a1a2e';
ctx.beginPath();
ctx.arc(-this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2);
ctx.arc(this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2);
ctx.fill();
if (this.state === 'gathering') {
ctx.fillStyle = '#fcd34d';
ctx.font = `${this.size}px Arial`;
ctx.textAlign = 'center';
ctx.fillText('+', 0, -this.size - 5);
}
ctx.restore();
}
}

class GameEngine {
constructor() {
this.canvas = document.getElementById('game-canvas');
this.ctx = this.canvas.getContext('2d');
this.slimes = [];
this.energy = 0;
this.crystals = 0;
this.boostActive = false;
this.lastSave = Date.now();
this.missions = this.initMissions();
this.skills = this.initSkills();
this.setupCanvas();
this.loadGame();
this.initSlimes();
this.setupEvents();
this.loop();
}

setupCanvas() {
const container = this.canvas.parentElement;
this.canvas.width = container.clientWidth;
this.canvas.height = container.clientHeight;
}

initSlimes() {
for (let i = 0; i < 3; i++) this.addSlime();
}

addSlime() {
const id = this.slimes.length;
const x = Math.random() * (this.canvas.width - 100) + 50;
const y = Math.random() * (this.canvas.height - 100) + 50;
this.slimes.push(new SlimeAgent(id, x, y));
this.updateSlimeList();
}

initMissions() {
return [
{ id: 1, title: '初めての収集', desc: 'エネルギーを100溜める', target: 100, current: 0, reward: 50, completed: false },
{ id: 2, title: 'スライム増殖', desc: 'スライムを5体にする', target: 5, current: 3, reward: 100, completed: false },
{ id: 3, title: 'スキル習得', desc: 'スキルを1つ解放する', target: 1, current: 0, reward: 200, completed: false },
];
}

initSkills() {
return [
{ id: 'speed1', name: '高速移動 I', icon: '⚡', level: 0, max: 3, cost: 50, unlocked: true, effect: 'gatherSpeed' },
{ id: 'gen1', name: '効率化 I', icon: '💎', level: 0, max: 3, cost: 100, unlocked: false, effect: 'energyGen' },
{ id: 'multi1', name: '倍化 I', icon: '✨', level: 0, max: 1, cost: 500, unlocked: false, effect: 'multiplier' },
];
}

setupEvents() {
window.addEventListener('resize', () => this.setupCanvas());
document.getElementById('game-canvas').addEventListener('click', () => this.activateBoost());

document.querySelectorAll('.nav-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
const tab = btn.dataset.tab;
document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
document.getElementById(`tab-${tab}`).classList.remove('hidden');
});
});

document.getElementById('boost-btn').addEventListener('click', () => {
this.activateBoost();
document.getElementById('overlay-ui').classList.add('hidden');
});

this.updateUI();
this.updateMissions();
this.updateSkills();
this.initCustomize();
}

activateBoost() {
if (this.crystals >= 10 && !this.boostActive) {
this.crystals -= 10;
this.boostActive = true;
this.slimes.forEach(s => s.gatherSpeed *= 2);
setTimeout(() => {
this.boostActive = false;
this.slimes.forEach(s => s.gatherSpeed /= 2);
}, 10000);
this.updateUI();
}
}

loop() {
this.ctx.fillStyle = '#1a1a2e';
this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
this.ctx.strokeStyle = '#252542';
for (let i = 0; i < this.canvas.width; i += 50) {
this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke();
}
for (let i = 0; i < this.canvas.height; i += 50) {
this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke();
}

let energyGained = 0;
this.slimes.forEach(slime => {
energyGained += slime.update();
slime.draw(this.ctx);
});

this.energy += energyGained;
if (this.energy >= 1000) {
this.crystals += Math.floor(this.energy / 1000);
this.energy = this.energy % 1000;
}

this.checkMissions();

if (Date.now() - this.lastSave > 30000) {
this.saveGame();
this.lastSave = Date.now();
}

this.updateUI();
requestAnimationFrame(() => this.loop());
}

updateUI() {
document.getElementById('energy-display').textContent = Math.floor(this.energy);
document.getElementById('crystal-display').textContent = this.crystals;
document.getElementById('custom-points').textContent = this.crystals;
}

updateSlimeList() {
const list = document.getElementById('slime-list');
list.innerHTML = this.slimes.map((s, i) => `
<div class="slime-card ${i === 0 ? 'active' : ''}" onclick="game.selectSlime(${i})">
<div class="slime-avatar" style="background: ${s.color}"></div>
<div class="slime-name">Agent-${i + 1}</div>
<div class="slime-level">Lv.${s.level}</div>
</div>
`).join('');
}

selectSlime(index) {
document.querySelectorAll('.slime-card').forEach((c, i) => {
c.classList.toggle('active', i === index);
});
}

checkMissions() {
this.missions.forEach(m => {
if (!m.completed) {
if (m.id === 1) m.current = Math.floor(this.energy);
if (m.id === 2) m.current = this.slimes.length;
if (m.id === 3) m.current = this.skills.filter(s => s.level > 0).length;
if (m.current >= m.target) {
m.completed = true;
this.crystals += m.reward;
}
}
});
this.updateMissions();
}

updateMissions() {
const list = document.getElementById('mission-list');
list.innerHTML = this.missions.map(m => `
<div class="mission-card ${m.completed ? 'completed' : ''}">
<div class="mission-title">${m.title}</div>
<div class="mission-desc">${m.desc}</div>
<div class="mission-reward">💰 ${m.reward}</div>
</div>
`).join('');
}

updateSkills() {
const grid = document.getElementById('skill-grid');
grid.innerHTML = this.skills.map(s => {
const canUnlock = s.unlocked && this.crystals >= s.cost && s.level < s.max;
return `
<div class="skill-node ${s.level > 0 ? 'unlocked' : ''} ${s.level >= s.max ? 'maxed' : ''}" 
     onclick="game.upgradeSkill('${s.id}')" style="opacity:${s.unlocked?1:0.3}">
<div class="skill-icon">${s.icon}</div>
<div class="skill-name">${s.name}</div>
<div class="skill-level">Lv.${s.level}/${s.max}</div>
</div>
`;
}).join('');
}

upgradeSkill(skillId) {
const skill = this.skills.find(s => s.id === skillId);
if (skill && skill.unlocked && this.crystals >= skill.cost && skill.level < skill.max) {
this.crystals -= skill.cost;
skill.level++;
if (skill.effect === 'gatherSpeed') {
this.slimes.forEach(s => s.gatherSpeed += 0.2);
}
if (skill.effect === 'energyGen') {
this.slimes.forEach(s => s.energyGen += 0.5);
}
if (skill.id === 'multi1') {
this.slimes.forEach(s => s.energyGen *= 2);
}
this.updateSkills();
this.updateUI();
}
}

initCustomize() {
const colors = ['#7dd3fc', '#f9a8d4', '#c084fc', '#fcd34d', '#a78bfa', '#34d399'];
const colorGrid = document.getElementById('color-grid');
colorGrid.innerHTML = colors.map(c => `
<div class="color-option" style="background:${c}" onclick="game.selectColor('${c}')"></div>
`).join('');

const shapes = ['round', 'square', 'star'];
const shapeGrid = document.getElementById('shape-grid');
shapeGrid.innerHTML = shapes.map(s => `
<div class="shape-option" onclick="game.selectShape('${s}')">${s}</div>
`).join('');
}

selectColor(color) {
if (this.slimes.length > 0) {
this.slimes[0].color = color;
this.updateSlimeList();
}
}

selectShape(shape) {
if (this.slimes.length > 0) {
this.slimes[0].shape = shape;
}
}

saveGame() {
const data = {
energy: this.energy,
crystals: this.crystals,
slimes: this.slimes.map(s => ({ level: s.level, color: s.color, shape: s.shape })),
skills: this.skills,
missions: this.missions
};
localStorage.setItem('agentSlime_save', JSON.stringify(data));
}

loadGame() {
const saved = localStorage.getItem('agentSlime_save');
if (saved) {
const data = JSON.parse(saved);
this.energy = data.energy || 0;
this.crystals = data.crystals || 0;
if (data.skills) this.skills = data.skills;
if (data.missions) this.missions = data.missions;
}
}
}

const game = new GameEngine();
