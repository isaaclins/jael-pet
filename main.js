const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
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

  // Send screen dimensions to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('screen-size', { width, height });
  });

  // Handle window movement from renderer
  const { ipcMain } = require('electron');
  
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

  // Send cursor position to renderer periodically
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const cursorPos = screen.getCursorScreenPoint();
      mainWindow.webContents.send('cursor-position', cursorPos);
    }
  }, 50); // Update 20 times per second
}

function createTray() {
  // Create a simple tray icon
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
      label: 'Reset Position',
      click: () => {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        mainWindow.setPosition(Math.floor(width / 2), height - 256);
      },
    },
    {
      label: 'Toggle Click-Through',
      click: () => {
        const isIgnoring = mainWindow.isIgnoreMouseEvents !== false;
        mainWindow.setIgnoreMouseEvents(!isIgnoring, { forward: true });
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

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Keep window always on top
app.on('browser-window-focus', () => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  }
});

