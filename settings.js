const { ipcRenderer } = require('electron');

// Default settings
const defaults = {
  walk: 40,
  lickPaw: 15,
  sleep: 10,
  throwUp: 10,
  idleAlt: 10,
  idle: 15,
  farChase: 70,
};

// Current settings
let settings = { ...defaults };

// Slider IDs for main behaviors (must total 100%) - ORDER MATTERS (top to bottom priority)
const mainBehaviors = ['walk', 'lickPaw', 'sleep', 'throwUp', 'idleAlt', 'idle'];

// Initialize
function init() {
  // Load saved settings if available
  const saved = localStorage.getItem('jaelPetSettings');
  if (saved) {
    try {
      settings = { ...defaults, ...JSON.parse(saved) };
    } catch (e) {
      settings = { ...defaults };
    }
  }

  // Set initial slider values
  Object.keys(settings).forEach(key => {
    const slider = document.getElementById(key);
    const valueDisplay = document.getElementById(`${key}-value`);
    if (slider && valueDisplay) {
      slider.value = settings[key];
      valueDisplay.textContent = `${settings[key]}%`;
    }
  });

  // Add event listeners to main behavior sliders (auto-balance)
  mainBehaviors.forEach((key, index) => {
    const slider = document.getElementById(key);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const newValue = parseInt(e.target.value);
        const oldValue = settings[key];
        const diff = newValue - oldValue;
        
        settings[key] = newValue;
        document.getElementById(`${key}-value`).textContent = `${newValue}%`;
        
        // Auto-balance: distribute the difference to lower-priority sliders
        autoBalance(index, diff);
        updateAllDisplays();
        updateTotal();
      });
    }
  });

  // Far chase slider (doesn't need balancing)
  const farChaseSlider = document.getElementById('farChase');
  if (farChaseSlider) {
    farChaseSlider.addEventListener('input', (e) => {
      settings.farChase = parseInt(e.target.value);
      document.getElementById('farChase-value').textContent = `${settings.farChase}%`;
    });
  }

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    settings = { ...defaults };
    updateAllDisplays();
    updateTotal();
  });

  // Start button
  document.getElementById('start-btn').addEventListener('click', () => {
    // Save settings
    localStorage.setItem('jaelPetSettings', JSON.stringify(settings));

    // Send settings to main process and start pet
    ipcRenderer.send('start-pet', settings);
  });

  updateTotal();
  animatePreview();
}

// Auto-balance sliders below the changed one
function autoBalance(changedIndex, diff) {
  if (diff === 0) return;
  
  // Get sliders below the changed one (lower priority)
  const lowerPriorityKeys = mainBehaviors.slice(changedIndex + 1);
  
  if (lowerPriorityKeys.length === 0) {
    // No lower priority sliders, adjust higher priority ones (bottom to top)
    const higherPriorityKeys = mainBehaviors.slice(0, changedIndex).reverse();
    distributeToSliders(higherPriorityKeys, -diff);
  } else {
    // Distribute to lower priority sliders
    distributeToSliders(lowerPriorityKeys, -diff);
  }
}

// Distribute a value change across given sliders
function distributeToSliders(keys, totalChange) {
  let remaining = totalChange;
  
  for (const key of keys) {
    if (remaining === 0) break;
    
    const currentVal = settings[key];
    
    if (remaining > 0) {
      // Need to add to this slider
      const maxAdd = 100 - currentVal; // Can't go above 100
      const toAdd = Math.min(remaining, maxAdd);
      settings[key] = currentVal + toAdd;
      remaining -= toAdd;
    } else {
      // Need to subtract from this slider
      const maxSubtract = currentVal; // Can't go below 0
      const toSubtract = Math.min(-remaining, maxSubtract);
      settings[key] = currentVal - toSubtract;
      remaining += toSubtract;
    }
  }
  
  // If there's still remaining, we need to adjust from the other direction
  if (remaining !== 0) {
    const allOtherKeys = mainBehaviors.filter(k => !keys.includes(k)).reverse();
    for (const key of allOtherKeys) {
      if (remaining === 0) break;
      
      const currentVal = settings[key];
      
      if (remaining > 0) {
        const maxAdd = 100 - currentVal;
        const toAdd = Math.min(remaining, maxAdd);
        settings[key] = currentVal + toAdd;
        remaining -= toAdd;
      } else {
        const maxSubtract = currentVal;
        const toSubtract = Math.min(-remaining, maxSubtract);
        settings[key] = currentVal - toSubtract;
        remaining += toSubtract;
      }
    }
  }
}

// Update all slider displays
function updateAllDisplays() {
  Object.keys(settings).forEach(key => {
    const slider = document.getElementById(key);
    const valueDisplay = document.getElementById(`${key}-value`);
    if (slider && valueDisplay) {
      slider.value = settings[key];
      valueDisplay.textContent = `${settings[key]}%`;
    }
  });
}

// Update total display
function updateTotal() {
  const total = mainBehaviors.reduce((sum, key) => sum + settings[key], 0);
  const totalDisplay = document.getElementById('total');
  const warning = document.getElementById('warning');
  const startBtn = document.getElementById('start-btn');

  totalDisplay.textContent = `${total}%`;

  if (total === 100) {
    totalDisplay.classList.remove('invalid');
    totalDisplay.classList.add('valid');
    warning.classList.remove('show');
    startBtn.disabled = false;
  } else {
    totalDisplay.classList.remove('valid');
    totalDisplay.classList.add('invalid');
    warning.classList.add('show');
    startBtn.disabled = true;
  }
}

// Animate preview cat
function animatePreview() {
  const previewCat = document.getElementById('preview-cat');
  const frames = [
    'sprites/01_idle/tile000.png',
    'sprites/01_idle/tile001.png',
    'sprites/01_idle/tile002.png',
    'sprites/01_idle/tile003.png',
  ];
  let frameIndex = 0;

  setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    previewCat.src = frames[frameIndex];
  }, 300);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
