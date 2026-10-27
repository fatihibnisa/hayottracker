const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork } = require('child_process');

const PORT = 4178;

const isPackaged = app.isPackaged;
const resourcesRoot = isPackaged ? process.resourcesPath : path.join(__dirname, '..');
const backendDir = path.join(resourcesRoot, 'backend');
const frontendDistDir = isPackaged
  ? path.join(resourcesRoot, 'frontend-dist')
  : path.join(resourcesRoot, 'frontend', '.next-electron');

let backendProcess = null;
let mainWindow = null;

function toFileUrl(absPath) {
  return 'file:' + absPath.split(path.sep).join('/');
}

async function ensureDatabase(databaseUrl, dbFile) {
  if (fs.existsSync(dbFile)) return;
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  const { PrismaClient } = require(path.join(backendDir, 'node_modules', '@prisma', 'client'));
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const migrationPath = path.join(backendDir, 'prisma', 'migrations', '0_init', 'migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  await prisma.$disconnect();
}

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function check() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error("Backend ishga tushmadi (vaqt tugadi)"));
          return;
        }
        setTimeout(check, 300);
      });
    })();
  });
}

async function startBackend() {
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'data');
  const uploadsDir = path.join(userDataDir, 'uploads');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  const dbFile = path.join(dataDir, 'hayot.db');
  const databaseUrl = toFileUrl(dbFile);

  await ensureDatabase(databaseUrl, dbFile);

  backendProcess = fork(path.join(backendDir, 'dist', 'main.js'), [], {
    cwd: backendDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      UPLOADS_DIR: uploadsDir,
      FRONTEND_DIST_PATH: frontendDistDir,
      PORT: String(PORT),
      ELECTRON_APP: '1',
    },
    stdio: 'inherit',
  });

  backendProcess.on('exit', (code) => {
    if (code && code !== 0 && mainWindow) {
      console.error(`Backend process exited with code ${code}`);
    }
  });

  await waitForServer(`http://localhost:${PORT}/api/dashboard`, 20000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0b0b0d',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadURL(`http://localhost:${PORT}/dashboard/`);
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('Ishga tushirishda xatolik:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
