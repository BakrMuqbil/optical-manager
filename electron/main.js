const { app, BrowserWindow } = require("electron");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const PORT = 3000;

let mainWindow;

async function startApp() {
  if (!dev) {
    // تشغيل خادم Next.js محلياً في بيئة Build (.exe)
    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, ".."),
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(PORT);
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(startApp);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
