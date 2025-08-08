// Preloadスクリプト - レンダラープロセスとメインプロセスの橋渡し
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, TimerSettings, TimerState } from '../shared/types';

// レンダラープロセスで使用できるAPIを定義
const api = {
  // タイマー操作
  timer: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_START),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STOP),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET),
    onUpdate: (callback: (state: TimerState) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TIMER_UPDATE, (_, state) => callback(state));
      // クリーンアップ関数を返す
      return () => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.TIMER_UPDATE);
      };
    },
    onComplete: (callback: () => void) => {
      ipcRenderer.on(IPC_CHANNELS.TIMER_COMPLETE, callback);
      return () => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.TIMER_COMPLETE);
      };
    }
  },

  // 設定操作
  settings: {
    get: (): Promise<TimerSettings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings: Partial<TimerSettings>) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET)
  },

  // 通知操作
  notification: {
    test: () => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_TEST)
  },

  // アプリケーション操作
  app: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    onNavigate: (callback: (route: string) => void) => {
      ipcRenderer.on('navigate', (_, route) => callback(route));
      return () => {
        ipcRenderer.removeAllListeners('navigate');
      };
    }
  },

  // プラットフォーム情報
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  }
};

// window.electronApiとしてレンダラープロセスで利用可能にする
contextBridge.exposeInMainWorld('electronApi', api);

// TypeScript用の型定義
export type ElectronApi = typeof api;

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}