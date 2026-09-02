import { app, BrowserWindow, shell } from "electron";
import { createServer, type Server } from "node:http";
import next from "next";
import path from "node:path";

const isDev = !app.isPackaged;

const HOST = "127.0.0.1";
const DEV_URL = "http://127.0.0.1:3000";

let mainWindow: BrowserWindow | null = null;
let server: Server | null = null;

/**
 * تحديد مجلد بيانات التطبيق.
 *
 * في Electron:
 * %APPDATA%\optical-manager\data
 *
 * أما أثناء التطوير العادي:
 * ./data
 */
function configureDataDirectory() {
  if (!isDev) {
    const dataDir = path.join(
      app.getPath("appData"),
      "optical-manager",
      "data",
    );

    process.env.ELECTRON_DATA_DIR = dataDir;
  }
}

async function startNextProductionServer(): Promise<number> {
  const nextApp = next({
    dev: false,
    dir: app.getAppPath(),
    hostname: HOST,
    port: 0,
  });

  await nextApp.prepare();

  const handle = nextApp.getRequestHandler();

  server = createServer((req, res) => {
    handle(req, res);
  });

  return new Promise((resolve, reject) => {
    server?.once("error", reject);

    server?.listen(0, HOST, () => {
      const address = server?.address();

      if (!address || typeof address === "string") {
        reject(
          new Error("تعذر الحصول على منفذ خادم Next.js"),
        );
        return;
      }

      resolve(address.port);
    });
  });
}

async function createMainWindow() {
  // يجب تنفيذ هذا قبل تشغيل Next.js
  configureDataDirectory();

  let url: string;

  if (isDev) {
    url = DEV_URL;
  } else {
    const port = await startNextProductionServer();

    url = `http://${HOST}:${port}`;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1100,
    minHeight: 700,

    title: "المركز الأردني للنظارات",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,
    },

    show: false,
  });

  // إخفاء قائمة Electron الافتراضية
  mainWindow.removeMenu();

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // فتح الروابط الخارجية في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(
    ({ url: externalUrl }) => {
      if (
        externalUrl.startsWith("http://") ||
        externalUrl.startsWith("https://")
      ) {
        void shell.openExternal(externalUrl);
      }

      return {
        action: "deny",
      };
    },
  );

  await mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function closeNextServer() {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve) => {
    server?.close(() => resolve());
  });

  server = null;
}

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (error) {
    console.error(
      "Failed to start Optical Manager:",
      error,
    );

    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      try {
        await createMainWindow();
      } catch (error) {
        console.error(
          "Failed to recreate window:",
          error,
        );
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await closeNextServer();
});