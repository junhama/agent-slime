// Agent Slime V2 - AI Agent Simulation Game with Monetization

class SlimeAgent {
  constructor(id, x, y) {
    this.id = id; this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.level = 1; this.exp = 0;
    this.color = ['#7dd3fc', '#f9a8d4', '#c084fc', '#fcd34d'][Math.floor(Math.random() * 4)];
    this.shape = 'round'; this.size = 20;
    this.targetX = x; this.targetY = y; this.state = 'idle';
    this.gatherSpeed = 1; this.energyGen = 1; this.lastUpdate = Date.now(); this.skin = null;
  }
  update() {
    const now = Date.now(), dt = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    if (this.state === 'idle') {
      if (Math.random() < 0.02) {
        this.targetX = Math.random() * (window.innerWidth - 40) + 20;
        this.targetY = Math.random() * (window.innerHeight * 0.4 - 40) + 20;
        this.state = 'moving';
      }
    } else if (this.state === 'moving') {
      const dx = this.targetX - this.x, dy = this.targetY - this.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        this.state = 'gathering';
        setTimeout(() => this.state = 'idle', 2000 / this.gatherSpeed);
      } else {
        this.vx = (dx / dist) * 50 * dt; this.vy = (dy / dist) * 50 * dt;
        this.x += this.vx; this.y += this.vy;
      }
    }
    if (this.state === 'gathering') return this.energyGen * dt * (this.skin === 'golden' ? 1.5 : 1);
    return 0;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    let drawColor = this.color;
    if (this.skin === 'golden') drawColor = '#FFD700';
    else if (this.skin === 'rainbow') drawColor = `hsl(${(Date.now() / 10) % 360}, 70%, 60%)`;
    else if (this.skin === 'cosmic') drawColor = '#6B46C1';
    ctx.shadowColor = drawColor; ctx.shadowBlur = 15; ctx.fillStyle = drawColor;
    ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    if (this.skin === 'golden') { ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (this.skin === 'cosmic') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 3; i++) {
        const angle = (Date.now() / 1000 + i * 2) % (Math.PI * 2);
        ctx.beginPath(); ctx.arc(Math.cos(angle) * 10, Math.sin(angle) * 10, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(-this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.arc(this.size * 0.3, 0, this.size * 0.2, 0, Math.PI * 2); ctx.fill();
    if (this.state === 'gathering') {
      ctx.fillStyle = '#fcd34d'; ctx.font = `${this.size}px Arial`; ctx.textAlign = 'center';
      ctx.fillText('+', 0, -this.size - 5);
    }
    ctx.restore();
  }
}

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.slimes = []; this.energy = 0; this.crystals = 0; this.boostActive = false;
    this.lastSave = Date.now(); this.missions = this.initMissions(); this.skills = this.initSkills();
    this.ownedSkins = []; this.premium = { active: false, expiresAt: null };
    this.achievements = this.initAchievements(); this.boostCount = 0;
    this.setupCanvas(); this.loadGame(); this.initSlimes(); this.setupEvents();
    this.initShop(); this.initPremium(); this.initShare(); this.initAd(); this.initAchievementsUI();
    this.checkDailyPremium(); this.loop();
  }
  setupCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth; this.canvas.height = container.clientHeight;
  }
  initSlimes() { for (let i = 0; i < 3; i++) this.addSlime(); }
  addSlime() {
    const id = this.slimes.length, x = Math.random() * (this.canvas.width - 100) + 50;
    const y = Math.random() * (this.canvas.height - 100) + 50;
    const slime = new SlimeAgent(id, x, y);
    if (id === 0 && this.ownedSkins.length > 0) slime.skin = this.ownedSkins[0];
    this.slimes.push(slime); this.updateSlimeList();
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
  initAchievements() {
    return [
      { id: 'collector', title: 'コレクター', desc: 'スライムを5体にする', target: 5, current: 0, reward: 100, unlocked: false },
      { id: 'crystal1000', title: 'クリスタルマスター', desc: '1000クリスタル獲得', target: 1000, current: 0, reward: 200, unlocked: false },
      { id: 'skinchanger', title: 'ファッショニスタ', desc: 'スキンを3つ所有', target: 3, current: 0, reward: 150, unlocked: false },
      { id: 'booster', title: 'スピードスター', desc: 'ブースト10回使用', target: 10, current: 0, reward: 100, unlocked: false },
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
        document.querySelectorAll('.tab-panel').forEach(p => { p.classList.add('hidden'); p.hidden = true; });
        const target = document.getElementById(`tab-${tab}`);
        if (target) { target.classList.remove('hidden'); target.hidden = false; }
      });
    });
    const boostBtn = document.getElementById('boost-btn');
    if (boostBtn) boostBtn.addEventListener('click', () => { this.activateBoost(); document.getElementById('overlay-ui').classList.add('hidden'); });
    this.updateUI(); this.updateMissions(); this.updateSkills(); this.initCustomize();
  }
  initShop() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.buySkin(e.target.dataset.skin));
    });
    this.updateShopUI();
  }
  buySkin(skinId) {
    const costs = { golden: 500, rainbow: 300, cosmic: 400 }, cost = costs[skinId];
    if (this.ownedSkins.includes(skinId)) { this.showToast('Already owned'); return; }
    if (this.crystals >= cost) {
      this.crystals -= cost; this.ownedSkins.push(skinId); this.updateShopUI(); this.updateUI();
      this.saveGame(); this.showToast('Skin purchased!'); this.checkAchievements();
      if (this.slimes[0]) this.slimes[0].skin = skinId;
    } else this.showToast('Not enough crystals');
  }
  updateShopUI() {
    document.querySelectorAll('.shop-item').forEach(item => {
      const skin = item.dataset.skin, btn = item.querySelector('.buy-btn'), badge = item.querySelector('.owned-badge');
      if (this.ownedSkins.includes(skin)) { btn.classList.add('hidden'); badge.classList.remove('hidden'); }
      else { btn.classList.remove('hidden'); badge.classList.add('hidden'); }
    });
  }
  initPremium() {
    const btn = document.getElementById('subscribe-btn'), status = document.getElementById('premium-status'), adBanner = document.getElementById('ad-banner');
    if (this.premium.active && this.premium.expiresAt > Date.now()) {
      if (status) { status.classList.remove('hidden'); status.querySelector('span').textContent = new Date(this.premium.expiresAt).toLocaleDateString('ja-JP'); }
      if (adBanner) adBanner.classList.add('hidden');
      if (btn) { btn.textContent = 'Active'; btn.disabled = true; }
    }
    if (btn) btn.addEventListener('click', () => this.subscribePremium());
  }
  subscribePremium() {
    this.premium.active = true; this.premium.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    this.showToast('Premium activated!');
    document.getElementById('ad-banner')?.classList.add('hidden');
    const status = document.getElementById('premium-status');
    if (status) { status.classList.remove('hidden'); status.querySelector('span').textContent = new Date(this.premium.expiresAt).toLocaleDateString('ja-JP'); }
    this.saveGame();
  }
  checkDailyPremium() {
    if (!this.premium.active) return;
    const lastClaim = localStorage.getItem('agentSlime_lastClaim');
    const today = new Date().toDateString();
    if (lastClaim !== today) {
      this.crystals += 50; this.showToast('Daily Premium: +50💎');
      localStorage.setItem('agentSlime_lastClaim', today); this.updateUI(); this.saveGame();
    }
  }
  initShare() {
    const shareText = () => `Agent Slime: ${Math.floor(this.energy)} energy! #AgentSlime`;
    const shareUrl = 'https://junhama.github.io/agent-slime';
    document.getElementById('share-twitter')?.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${shareUrl}`, '_blank'));
    document.getElementById('share-twitter-footer')?.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${shareUrl}`, '_blank'));
  }
  initAd() {
    document.getElementById('reward-ad-btn')?.addEventListener('click', () => this.showRewardAd());
  }
  showRewardAd() {
    if (this.premium.active) { this.showToast('Premium: No ads!'); this.extendBoost(30); return; }
    this.showToast('Watching ad...');
    setTimeout(() => { this.extendBoost(30); this.showToast('Boost +30s!'); }, 2000);
  }
  extendBoost(seconds) {
    this.showToast(`Boost extended +${seconds}s`);
  }
  initAchievementsUI() { this.updateAchievements(); }
  updateAchievements() {
    const grid = document.getElementById('achievements-grid'); if (!grid) return;
    grid.innerHTML = this.achievements.map(a => `
      <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${a.unlocked ? '🏆' : '🔒'}</div>
        <div class="achievement-title">${a.title}</div>
        <div class="achievement-desc">${a.desc}</div>
        <div class="achievement-reward">💎 ${a.reward}</div>
      </div>
    `).join('');
  }
  checkAchievements() {
    this.achievements.forEach(a => {
      if (!a.unlocked) {
        if (a.id === 'collector') a.current = this.slimes.length;
        if (a.id === 'crystal1000') a.current = this.crystals;
        if (a.id === 'skinchanger') a.current = this.ownedSkins.length;
        if (a.id === 'booster') a.current = this.boostCount;
        if (a.current >= a.target) { a.unlocked = true; this.crystals += a.reward; this.showToast(`Achievement: ${a.title}! +${a.reward}💎`); }
      }
    });
    this.updateAchievements(); this.updateUI(); this.saveGame();
  }
  activateBoost(skipCost = false) {
    if (!skipCost && (this.crystals < 10 || this.boostActive)) return;
    if (!skipCost) this.crystals -= 10;
    this.boostActive = true; this.boostCount++;
    const multiplier = this.premium.active ? 3 : 2;
    this.slimes.forEach(s => s.gatherSpeed *= multiplier);
    setTimeout(() => { this.boostActive = false; this.slimes.forEach(s => s.gatherSpeed /= multiplier); }, 10000);
    this.updateUI(); this.checkAchievements();
  }
  loop() {
    this.ctx.fillStyle = '#1a1a2e'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = '#252542';
    for (let i = 0; i < this.canvas.width; i += 50) { this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke(); }
    for (let i = 0; i < this.canvas.height; i += 50) { this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke(); }
    let energyGained = 0;
    this.slimes.forEach(slime => { energyGained += slime.update(); slime.draw(this.ctx); });
    this.energy += energyGained * (this.premium.active ? 1.5 : 1);
    if (this.energy >= 1000) { this.crystals += Math.floor(this.energy / 1000); this.energy %= 1000; }
    this.checkMissions();
    if (Date.now() - this.lastSave > 30000) { this.saveGame(); this.lastSave = Date.now(); }
    this.updateUI(); requestAnimationFrame(() => this.loop());
  }
  updateUI() {
    const e = document.getElementById('energy-display'), c = document.getElementById('crystal-display'), p = document.getElementById('custom-points');
    if (e) e.textContent = Math.floor(this.energy); if (c) c.textContent = this.crystals; if (p) p.textContent = this.crystals;
  }
  updateSlimeList() {
    const list = document.getElementById('slime-list'); if (!list) return;
    list.innerHTML = this.slimes.map((s, i) => `
      <div class="slime-card ${i === 0 ? 'active' : ''}" onclick="game.selectSlime(${i})">
        <div class="slime-avatar" style="background:${s.color}"></div>
        <div class="slime-name">Agent-${i + 1}</div>
        <div class="slime-level">Lv.${s.level}</div>
      </div>
    `).join('');
  }
  selectSlime(i) { document.querySelectorAll('.slime-card').forEach((c, idx) => c.classList.toggle('active', idx === i)); }
  checkMissions() {
    this.missions.forEach(m => {
      if (!m.completed) {
        if (m.id === 1) m.current = Math.floor(this.energy);
        if (m.id === 2) m.current = this.slimes.length;
        if (m.id === 3) m.current = this.skills.filter(s => s.level > 0).length;
        if (m.current >= m.target) { m.completed = true; this.crystals += m.reward; }
      }
    });
    this.updateMissions();
  }
  updateMissions() {
    const list = document.getElementById('mission-list'); if (!list) return;
    list.innerHTML = this.missions.map(m => `
      <div class="mission-card ${m.completed ? 'completed' : ''}">
        <div class="mission-title">${m.title}</div>
        <div class="mission-desc">${m.desc}</div>
        <div class="mission-reward">💰 ${m.reward}</div>
      </div>
    `).join('');
  }
  updateSkills() {
    const grid = document.getElementById('skill-grid'); if (!grid) return;
    grid.innerHTML = this.skills.map(s => `
      <div class="skill-node ${s.level > 0 ? 'unlocked' : ''} ${s.level >= s.max ? 'maxed' : ''}" onclick="game.upgradeSkill('${s.id}')" style="opacity:${s.unlocked?1:0.3}">
        <div class="skill-icon">${s.icon}</div>
        <div class="skill-name">${s.name}</div>
        <div class="skill-level">Lv.${s.level}/${s.max}</div>
      </div>
    `).join('');
  }
  upgradeSkill(id) {
    const s = this.skills.find(x => x.id === id);
    if (s && s.unlocked && this.crystals >= s.cost && s.level < s.max) {
      this.crystals -= s.cost; s.level++;
      if (s.effect === 'gatherSpeed') this.slimes.forEach(x => x.gatherSpeed += 0.2);
      if (s.effect === 'energyGen') this.slimes.forEach(x => x.energyGen += 0.5);
      if (s.id === 'multi1') this.slimes.forEach(x => x.energyGen *= 2);
      this.updateSkills(); this.updateUI(); this.saveGame();
    }
  }
  initCustomize() {
    const colors = ['#7dd3fc', '#f9a8d4', '#c084fc', '#fcd34d', '#a78bfa', '#34d399'];
    const cg = document.getElementById('color-grid');
    if (cg) cg.innerHTML = colors.map(c => `<div class="color-option" style="background:${c}" onclick="game.selectColor('${c}')"></div>`).join('');
    const shapes = ['round', 'square', 'star'];
    const sg = document.getElementById('shape-grid');
    if (sg) sg.innerHTML = shapes.map(s => `<div class="shape-option" onclick="game.selectShape('${s}')">${s}</div>`).join('');
    this.updateSkinGrid();
  }
  updateSkinGrid() {
    const g = document.getElementById('skin-grid');
    if (!g) return;
    const skins = [{id:'golden',name:'Golden',color:'#FFD700'},{id:'rainbow',name:'Rainbow',color:'#ff6b6b'},{id:'cosmic',name:'Cosmic',color:'#6B46C1'}];
    g.innerHTML = skins.map(s => `<div class="skin-option ${this.ownedSkins.includes(s.id)?'owned':'locked'}" onclick="game.selectSkin('${s.id}')" style="background:${s.color}">${this.ownedSkins.includes(s.id)?s.name:'🔒'}</div>`).join('');
  }
  selectSkin(id) {
    if (!this.ownedSkins.includes(id)) { this.showToast('Buy in shop first'); return; }
    if (this.slimes[0]) { this.slimes[0].skin = id; this.updateSlimeList(); this.showToast('Skin equipped!'); }
  }
  selectColor(c) {
    if (this.slimes[0]) { this.slimes[0].color = c; this.slimes[0].skin = null; this.updateSkinGrid(); this.updateSlimeList(); }
  }
  selectShape(s) { if (this.slimes[0]) this.slimes[0].shape = s; }
  showToast(m) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
  }
  saveGame() {
    localStorage.setItem('agentSlime', JSON.stringify({
      energy: this.energy, crystals: this.crystals,
      slimes: this.slimes.map(s => ({ level: s.level, color: s.color, shape: s.shape, skin: s.skin })),
      skills: this.skills, missions: this.missions,
      ownedSkins: this.ownedSkins, premium: this.premium, achievements: this.achievements, boostCount: this.boostCount
    }));
  }
  loadGame() {
    const saved = localStorage.getItem('agentSlime');
    if (saved) {
      const d = JSON.parse(saved);
      this.energy = d.energy || 0; this.crystals = d.crystals || 0;
      if (d.skills) this.skills = d.skills;
      if (d.missions) this.missions = d.missions;
      if (d.ownedSkins) this.ownedSkins = d.ownedSkins;
      if (d.premium) this.premium = d.premium;
      if (d.achievements) this.achievements = d.achievements;
      if (d.boostCount) this.boostCount = d.boostCount;
    }
  }
}
const game = new GameEngine();
