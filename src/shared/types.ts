// 共有型定義

export interface TimerSettings {
  duration: number; // 分単位
  soundEnabled: boolean;
  pushNotificationEnabled: boolean;
  flashEnabled: boolean;
  autoStart: boolean;
  inactivityThreshold: number; // 秒単位
  soundVolume: number; // 0-100
  customSoundPath?: string;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number | null;
  remainingTime: number; // 秒単位
  lastActivity: number;
}

export interface ActivityEvent {
  type: 'mouse' | 'keyboard';
  timestamp: number;
}

export interface NotificationOptions {
  title: string;
  body: string;
  silent?: boolean;
  sound?: string;
}

// IPCチャンネル名
export const IPC_CHANNELS = {
  // Timer
  TIMER_START: 'timer:start',
  TIMER_STOP: 'timer:stop',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_RESET: 'timer:reset',
  TIMER_UPDATE: 'timer:update',
  TIMER_COMPLETE: 'timer:complete',
  
  // Activity
  ACTIVITY_DETECTED: 'activity:detected',
  ACTIVITY_IDLE: 'activity:idle',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET: 'settings:reset',
  
  // Notification
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_TEST: 'notification:test',
  
  // App
  APP_MINIMIZE: 'app:minimize',
  APP_QUIT: 'app:quit',
  APP_SHOW: 'app:show',
};

// デフォルト設定
export const DEFAULT_SETTINGS: TimerSettings = {
  duration: 1, // テスト用に1分（通知テスト後に25分に戻す）
  soundEnabled: true,
  pushNotificationEnabled: true,
  flashEnabled: true,
  autoStart: false, // 自動開始を無効化（手動操作のみ）
  inactivityThreshold: 30,
  soundVolume: 50,
};