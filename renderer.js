const { ipcRenderer } = require('electron');

// DOM Elements
const cat = document.getElementById('cat');
const heartsContainer = document.getElementById('hearts');
const catContainer = document.getElementById('cat-container');

// Animation Definitions based on sprite sheet analysis
const ANIMATIONS = {
  // Idle animations (sitting)
  idle: {
    frames: ['tile000.png', 'tile001.png', 'tile002.png', 'tile003.png'],
    frameTime: 400,
    loop: true,
  },
  idleAlt: {
    frames: ['tile008.png', 'tile009.png', 'tile010.png', 'tile011.png'],
    frameTime: 400,
    loop: true,
  },
  // Alert/looking around
  alert: {
    frames: ['tile016.png', 'tile017.png', 'tile018.png', 'tile019.png'],
    frameTime: 300,
    loop: true,
  },
  // Sitting poses
  sit: {
    frames: ['tile024.png', 'tile025.png', 'tile026.png', 'tile027.png'],
    frameTime: 500,
    loop: true,
  },
  // Grooming/licking
  groom: {
    frames: ['tile032.png', 'tile033.png', 'tile034.png', 'tile035.png', 'tile036.png', 'tile037.png', 'tile038.png', 'tile039.png'],
    frameTime: 200,
    loop: true,
  },
  // More grooming
  groomAlt: {
    frames: ['tile040.png', 'tile041.png', 'tile042.png', 'tile043.png', 'tile044.png', 'tile045.png', 'tile046.png', 'tile047.png'],
    frameTime: 200,
    loop: true,
  },
  // Sleeping/lying down
  sleep: {
    frames: ['tile048.png', 'tile049.png', 'tile050.png', 'tile051.png'],
    frameTime: 600,
    loop: true,
  },
  // Hitting/Swatting (at cursor/mouse)
  hit: {
    frames: ['tile056.png', 'tile057.png', 'tile058.png', 'tile059.png', 'tile060.png', 'tile061.png'],
    frameTime: 80,
    loop: true,
  },
  // Walking/Running
  walk: {
    frames: ['tile065.png', 'tile066.png', 'tile067.png'],
    frameTime: 100,
    loop: true,
  },
  // Running fast
  run: {
    frames: ['tile075.png', 'tile076.png', 'tile077.png'],
    frameTime: 80,
    loop: true,
  },
  // Sitting to standing transition
  sitVariant: {
    frames: ['tile064.png', 'tile068.png', 'tile069.png', 'tile070.png'],
    frameTime: 300,
    loop: true,
  },
  // Scratching/Playing
  scratch: {
    frames: ['tile072.png', 'tile073.png', 'tile074.png', 'tile078.png', 'tile079.png'],
    frameTime: 150,
    loop: true,
  },
};

// Cat State
const state = {
  x: 0,
  y: 0,
  screenWidth: 1920,
  screenHeight: 1080,
  currentAnimation: 'idle',
  currentFrame: 0,
  facingRight: true,
  isDragging: false,
  behavior: 'idle', // idle, walking, hitting, sleeping, grooming, scratching
  behaviorTimer: 0,
  targetX: null,
  targetY: null,
  cursorX: 0,
  cursorY: 0,
  walkSpeed: 4,
  animationTimer: null,
  lastFrameTime: 0,
  isSleeping: false,
  zzzElement: null,
  followCursor: false,
  idleTime: 0,
};

// Initialize
function init() {
  // Get initial position
  ipcRenderer.send('get-position');
  ipcRenderer.send('get-screen-size');

  // Listen for position updates
  ipcRenderer.on('current-position', (event, pos) => {
    state.x = pos.x;
    state.y = pos.y;
  });

  // Listen for screen size
  ipcRenderer.on('screen-size', (event, size) => {
    state.screenWidth = size.width;
    state.screenHeight = size.height;
    // Set initial position to bottom center
    state.y = size.height - 256;
  });

  // Listen for cursor position updates
  ipcRenderer.on('cursor-position', (event, pos) => {
    state.cursorX = pos.x;
    state.cursorY = pos.y;
  });

  // Setup drag events
  setupDragEvents();

  // Setup click events
  setupClickEvents();

  // Start animation loop
  startAnimationLoop();

  // Start behavior AI
  startBehaviorAI();
}

// Drag functionality
function setupDragEvents() {
  let dragStartX = 0;
  let dragStartY = 0;
  let windowStartX = 0;
  let windowStartY = 0;

  catContainer.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
      state.isDragging = true;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      windowStartX = state.x;
      windowStartY = state.y;
      
      // Stop any current behavior
      state.behavior = 'idle';
      state.targetX = null;
      setAnimation('alert');
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (state.isDragging) {
      const deltaX = e.screenX - dragStartX;
      const deltaY = e.screenY - dragStartY;
      
      state.x = windowStartX + deltaX;
      state.y = windowStartY + deltaY;
      
    // Clamp to screen bounds
    state.x = Math.max(0, Math.min(state.x, state.screenWidth - 256));
    state.y = Math.max(0, Math.min(state.y, state.screenHeight - 256));
      
      ipcRenderer.send('move-window', { x: state.x, y: state.y });
    }
  });

  document.addEventListener('mouseup', () => {
    if (state.isDragging) {
      state.isDragging = false;
      cat.classList.add('bounce');
      setTimeout(() => cat.classList.remove('bounce'), 300);
      setAnimation('idle');
    }
  });
}

// Click events for petting
function setupClickEvents() {
  cat.addEventListener('click', (e) => {
    if (!state.isDragging) {
      petCat();
    }
  });

  cat.addEventListener('dblclick', () => {
    // Double click to wake up sleeping cat or make it do something fun
    if (state.isSleeping) {
      wakeUp();
    } else {
      // Random fun action
      const actions = ['scratch', 'groom', 'groomAlt'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      state.behavior = randomAction;
      setAnimation(randomAction);
      
      // Reset after a while
      setTimeout(() => {
        state.behavior = 'idle';
        setAnimation('idle');
      }, 3000);
    }
  });
}

// Pet the cat
function petCat() {
  // Show heart
  showHeart();
  
  // Cat reacts
  cat.classList.add('petted');
  setTimeout(() => cat.classList.remove('petted'), 200);
  
  // Maybe purr (change to happy animation)
  if (state.behavior !== 'walking') {
    setAnimation('sitVariant');
    setTimeout(() => {
      if (state.behavior === 'idle') {
        setAnimation('idle');
      }
    }, 1500);
  }
}

// Show floating heart
function showHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = '❤️';
  heart.style.left = `${Math.random() * 30 - 15}px`;
  heartsContainer.appendChild(heart);
  
  setTimeout(() => {
    heart.remove();
  }, 1000);
}

// Set animation
function setAnimation(animName) {
  if (ANIMATIONS[animName] && state.currentAnimation !== animName) {
    state.currentAnimation = animName;
    state.currentFrame = 0;
    updateSprite();
  }
}

// Update sprite frame
function updateSprite() {
  const anim = ANIMATIONS[state.currentAnimation];
  if (anim && anim.frames.length > 0) {
    const frame = anim.frames[state.currentFrame];
    cat.src = `cat/${frame}`;
    
    // Handle facing direction
    if (state.facingRight) {
      cat.classList.remove('flipped');
    } else {
      cat.classList.add('flipped');
    }
  }
}

// Animation loop
function startAnimationLoop() {
  function animate(timestamp) {
    const anim = ANIMATIONS[state.currentAnimation];
    
    if (anim && timestamp - state.lastFrameTime >= anim.frameTime) {
      state.lastFrameTime = timestamp;
      
      // Advance frame
      state.currentFrame++;
      if (state.currentFrame >= anim.frames.length) {
        if (anim.loop) {
          state.currentFrame = 0;
        } else {
          state.currentFrame = anim.frames.length - 1;
        }
      }
      
      updateSprite();
    }
    
    // Update movement
    if (!state.isDragging) {
      updateMovement();
    }
    
    requestAnimationFrame(animate);
  }
  
  requestAnimationFrame(animate);
}

// Movement logic
function updateMovement() {
  // Calculate distance to cursor
  const targetX = state.cursorX - 128; // Center of cat window
  const targetY = state.cursorY - 128;
  const dx = targetX - state.x;
  const dy = targetY - state.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Hitting behavior - when cursor is close
  if (state.behavior === 'hitting') {
    // Update facing direction towards cursor
    state.facingRight = dx > 0;
    updateSprite();
    
    // If cursor moves away, chase it
    if (distance > 180) {
      state.behavior = 'walking';
      setAnimation('walk');
    }
    return;
  }
  
  // Walking behavior - chase the cursor
  if (state.behavior === 'walking') {
    // If close enough to cursor, start hitting!
    if (distance < 120) {
      state.behavior = 'hitting';
      setAnimation('hit');
      state.idleTime = 0;
      return;
    }
    
    // Normalize and move towards cursor
    const speed = distance > 400 ? state.walkSpeed * 1.5 : state.walkSpeed; // Run faster if very far
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;
    
    state.x += moveX;
    state.y += moveY;
    
    // Update facing direction
    state.facingRight = dx > 0;
    
    // Use run animation if very far
    if (distance > 400 && state.currentAnimation !== 'run') {
      setAnimation('run');
    } else if (distance <= 400 && state.currentAnimation === 'run') {
      setAnimation('walk');
    }
    
    // Clamp to screen bounds
    state.x = Math.max(0, Math.min(state.x, state.screenWidth - 256));
    state.y = Math.max(0, Math.min(state.y, state.screenHeight - 256));
    
    ipcRenderer.send('move-window', { x: state.x, y: state.y });
    updateSprite();
  }
}

// Behavior AI
function startBehaviorAI() {
  function decideBehavior() {
    if (state.isDragging) {
      return;
    }
    
    // Check distance to cursor - if far, more likely to follow
    const dx = state.cursorX - state.x - 128;
    const dy = state.cursorY - state.y - 128;
    const distanceToCursor = Math.sqrt(dx * dx + dy * dy);
    
    // Random behavior selection
    const rand = Math.random();
    
    // If cursor is far away, high chance to follow it
    if (distanceToCursor > 300 && rand < 0.7) {
      startWalking();
      return;
    }
    
    if (rand < 0.4) {
      // Follow cursor
      startWalking();
    } else if (rand < 0.5) {
      // Start grooming
      state.behavior = 'grooming';
      const groomAnim = Math.random() < 0.5 ? 'groom' : 'groomAlt';
      setAnimation(groomAnim);
      
      // Stop grooming after random time
      setTimeout(() => {
        if (state.behavior === 'grooming') {
          state.behavior = 'idle';
          setAnimation('idle');
        }
      }, 3000 + Math.random() * 4000);
    } else if (rand < 0.55) {
      // Fall asleep (less frequent)
      goToSleep();
    } else if (rand < 0.65) {
      // Scratch
      state.behavior = 'scratching';
      setAnimation('scratch');
      
      setTimeout(() => {
        if (state.behavior === 'scratching') {
          state.behavior = 'idle';
          setAnimation('idle');
        }
      }, 2000 + Math.random() * 3000);
    } else if (rand < 0.75) {
      // Look around (alert)
      setAnimation('alert');
      setTimeout(() => {
        if (state.behavior === 'idle') {
          setAnimation('idle');
        }
      }, 2000);
    } else if (rand < 0.85) {
      // Sit variation
      const sitAnims = ['sit', 'sitVariant', 'idleAlt'];
      setAnimation(sitAnims[Math.floor(Math.random() * sitAnims.length)]);
      
      setTimeout(() => {
        if (state.behavior === 'idle') {
          setAnimation('idle');
        }
      }, 3000 + Math.random() * 2000);
    } else {
      // Stay idle
      setAnimation('idle');
    }
  }
  
  // Run behavior decision every few seconds
  setInterval(() => {
    // Check if hitting for too long - cat gets bored
    if (state.behavior === 'hitting') {
      state.idleTime++;
      if (state.idleTime > 3) { // After ~6 seconds of hitting
        state.behavior = 'idle';
        setAnimation('idle');
        state.idleTime = 0;
      }
      return;
    }
    
    if (state.behavior === 'idle' && !state.isDragging && !state.isSleeping) {
      state.idleTime++;
      // If idle for too long and cursor is far, start following
      if (state.idleTime > 2) {
        const dx = state.cursorX - state.x - 128;
        const dy = state.cursorY - state.y - 128;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 200) {
          startWalking();
          return;
        }
      }
      decideBehavior();
    }
  }, 2000);
  
  // Initial behavior after short delay
  setTimeout(decideBehavior, 1000);
}

// Start walking towards the cursor
function startWalking() {
  state.behavior = 'walking';
  state.idleTime = 0;
  setAnimation('walk');
}

// Go to sleep
function goToSleep() {
  state.isSleeping = true;
  state.behavior = 'sleeping';
  setAnimation('sleep');
  
  // Show Z's
  showZzz();
  
  // Wake up after random time (30-90 seconds)
  setTimeout(() => {
    if (state.isSleeping) {
      wakeUp();
    }
  }, 30000 + Math.random() * 60000);
}

// Wake up
function wakeUp() {
  state.isSleeping = false;
  state.behavior = 'idle';
  
  // Remove Zzz
  if (state.zzzElement) {
    state.zzzElement.remove();
    state.zzzElement = null;
  }
  
  // Stretch animation (use alert or sitVariant)
  setAnimation('alert');
  setTimeout(() => {
    setAnimation('idle');
  }, 1500);
}

// Show sleeping Z's
function showZzz() {
  function createZ() {
    if (!state.isSleeping) return;
    
    const zzz = document.createElement('span');
    zzz.className = 'zzz';
    zzz.textContent = 'z';
    zzz.style.left = '50px';
    zzz.style.top = '10px';
    catContainer.appendChild(zzz);
    
    setTimeout(() => {
      zzz.remove();
    }, 2000);
    
    // Create next Z
    if (state.isSleeping) {
      setTimeout(createZ, 1500);
    }
  }
  
  createZ();
}

// Start the pet!
init();

// Log ready
console.log('🐱 Jael Pet loaded! Your desktop cat is ready to play.');

