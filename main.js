const { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let settingsWindow;
let tray;
let petSettings = null;
let cursorInterval = null;

// Create settings window on app start
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 550,
    height: 700,
    resizable: false,
    frame: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile('settings.html');
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    // If settings window closed without starting, quit app
    if (!mainWindow) {
      app.quit();
    }
  });
}

// Create the pet window
function createPetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 256,
    height: 256,
    x: Math.floor(width / 2),
    y: height - 256,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Make window click-through except for the cat
  mainWindow.setIgnoreMouseEvents(false);

  // Remove menu bar
  mainWindow.setMenu(null);

  mainWindow.loadFile('index.html');

  // Send screen dimensions and settings to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('screen-size', { width, height });
    mainWindow.webContents.send('pet-settings', petSettings);
  });

  // Send cursor position to renderer periodically
  cursorInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const cursorPos = screen.getCursorScreenPoint();
      mainWindow.webContents.send('cursor-position', cursorPos);
    }
  }, 50);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (cursorInterval) {
      clearInterval(cursorInterval);
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'sprites', '01_idle', 'tile000.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Jael Pet 🐱',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (!settingsWindow) {
          createSettingsWindow();
        } else {
          settingsWindow.focus();
        }
      },
    },
    {
      label: 'Reset Position',
      click: () => {
        if (mainWindow) {
          const primaryDisplay = screen.getPrimaryDisplay();
          const { width, height } = primaryDisplay.workAreaSize;
          mainWindow.setPosition(Math.floor(width / 2), height - 256);
        }
      },
    },
    {
      label: 'Toggle Click-Through',
      click: () => {
        if (mainWindow) {
          const isIgnoring = mainWindow.isIgnoreMouseEvents !== false;
          mainWindow.setIgnoreMouseEvents(!isIgnoring, { forward: true });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Jael Pet');
  tray.setContextMenu(contextMenu);
}

// IPC Handlers
ipcMain.on('start-pet', (event, settings) => {
  petSettings = settings;
  
  // Close settings window
  if (settingsWindow) {
    settingsWindow.close();
  }
  
  // Create pet window
  createPetWindow();
  createTray();
});

ipcMain.on('move-window', (event, { x, y }) => {
  if (mainWindow) {
    mainWindow.setPosition(Math.round(x), Math.round(y));
  }
});

ipcMain.on('get-position', (event) => {
  if (mainWindow) {
    const pos = mainWindow.getPosition();
    event.reply('current-position', { x: pos[0], y: pos[1] });
  }
});

ipcMain.on('get-screen-size', (event) => {
  const display = screen.getPrimaryDisplay();
  event.reply('screen-size', display.workAreaSize);
});

ipcMain.on('get-settings', (event) => {
  event.reply('pet-settings', petSettings);
});

// App lifecycle
app.whenReady().then(() => {
  createSettingsWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSettingsWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Keep pet window always on top
app.on('browser-window-focus', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
});
