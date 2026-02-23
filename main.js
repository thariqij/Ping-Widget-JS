// Hot reload for development
try {
  require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`)
  });
  console.log('Hot reload enabled');
} catch (e) {
  console.log('Hot reload not available - run: npm install electron-reload --save-dev');
}

const path = require('path');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { startPing } = require('./ping-service');

const PING_TARGET = 'www.google.com.br';

let mainWindow;
let pingHandle = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('window-drag-start', (event, { clientX, clientY }) => {
  isDragging = true;
  dragStartX = clientX;
  dragStartY = clientY;
  console.log('Drag start:', dragStartX, dragStartY);
});

ipcMain.on('window-drag', (event, { clientX, clientY }) => {
  if (!isDragging || !mainWindow) return;

  const deltaX = clientX - dragStartX;
  const deltaY = clientY - dragStartY;

  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: bounds.x + deltaX,
    y: bounds.y + deltaY,
    width: bounds.width,
    height: bounds.height
  });

  dragStartX = clientX;
  dragStartY = clientY;
});

ipcMain.on('window-drag-end', (event) => {
  isDragging = false;
  console.log('Drag end');
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 150,
    height: 100,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();

  let mouseIsInside = false;

  const pollInterval = setInterval(() => {
    if (mainWindow.isDestroyed()) {
      clearInterval(pollInterval);
      return;
    }

    const cursorPos = screen.getCursorScreenPoint();
    const windowBounds = mainWindow.getBounds();

    const inside =
      cursorPos.x >= windowBounds.x &&
      cursorPos.x <= windowBounds.x + windowBounds.width &&
      cursorPos.y >= windowBounds.y &&
      cursorPos.y <= windowBounds.y + windowBounds.height;

    if (inside && !mouseIsInside) {
      mouseIsInside = true;
      mainWindow.webContents.send('mouse-entered');
    } else if (!inside && mouseIsInside) {
      mouseIsInside = false;
      mainWindow.webContents.send('mouse-left');
    }
  }, 100);

  pingHandle = startPing(PING_TARGET, (result) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('ping-result', result);
    }
  });

  mainWindow.on('closed', () => {
    clearInterval(pollInterval);
    if (pingHandle) pingHandle.stop();
  });
}

app.whenReady().then(() => {
  createWindow();

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