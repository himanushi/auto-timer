// Electronメインプロセス
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } from 'electron';
import * as path from 'path';
import { ActivityMonitor } from './activity';
import { TimerManager } from './timer';
import { NotificationManager } from './notification';
import { SettingsManager } from './settings';
import { IPC_CHANNELS } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let activityMonitor: ActivityMonitor;
let timerManager: TimerManager;
let notificationManager: NotificationManager;
let settingsManager: SettingsManager;

// 開発モードかどうか
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 350,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'default' : 'default',
    frame: true, // 全プラットフォームでフレームを表示
  });

  // HTMLファイルを読み込み
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // ウィンドウが閉じられたとき
  mainWindow.on('closed', () => {
    // タイマーを停止してリソースをクリーンアップ
    if (timerManager) {
      timerManager.stop();
    }
    if (activityMonitor) {
      activityMonitor.stop();
    }
    mainWindow = null;
  });

  // 最小化時はトレイに格納
  mainWindow.on('minimize', () => {
    mainWindow?.hide();
  });
}

function createTray() {
  // トレイアイコンを作成
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  
  // トレイメニューを作成
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'タイマーを表示',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'タイマー開始/停止',
      click: () => {
        timerManager.toggle();
      }
    },
    { type: 'separator' },
    {
      label: '設定',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/settings');
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Auto Timer');
  tray.setContextMenu(contextMenu);

  // トレイアイコンクリック時
  tray.on('click', () => {
    mainWindow?.show();
  });
}

// アプリケーションの準備ができたとき
app.whenReady().then(() => {
  createWindow();
  createTray();

  // マネージャーを初期化
  settingsManager = new SettingsManager();
  notificationManager = new NotificationManager(settingsManager);
  timerManager = new TimerManager(settingsManager, notificationManager, mainWindow!);
  activityMonitor = new ActivityMonitor(timerManager, settingsManager);

  // アクティビティ監視を開始
  activityMonitor.start();
});

// すべてのウィンドウが閉じられたとき
app.on('window-all-closed', () => {
  // リソースをクリーンアップ
  if (timerManager) {
    timerManager.stop();
  }
  if (activityMonitor) {
    activityMonitor.stop();
  }
  
  // macOSの場合は、アプリケーションをDockに残す
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーション終了前のクリーンアップ
app.on('before-quit', () => {
  console.log('アプリケーション終了中...');
  if (timerManager) {
    timerManager.stop();
  }
  if (activityMonitor) {
    activityMonitor.stop();
  }
});

// アプリケーションがアクティブになったとき
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

// IPCハンドラー設定
ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
  return settingsManager.getAll();
});

ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_, settings) => {
  settingsManager.update(settings);
  return true;
});

ipcMain.handle(IPC_CHANNELS.TIMER_START, () => {
  timerManager.start();
  return true;
});

ipcMain.handle(IPC_CHANNELS.TIMER_STOP, () => {
  timerManager.stop();
  return true;
});

ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
  timerManager.pause();
  return true;
});

ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
  timerManager.resume();
  return true;
});

ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
  timerManager.reset();
  return true;
});

ipcMain.handle(IPC_CHANNELS.NOTIFICATION_TEST, () => {
  notificationManager.showTestNotification();
  return true;
});

ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, () => {
  mainWindow?.minimize();
  return true;
});

ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
  app.quit();
  return true;
});