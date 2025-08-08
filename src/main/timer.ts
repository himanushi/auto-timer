// タイマー管理モジュール
import { BrowserWindow } from 'electron';
import { TimerState, IPC_CHANNELS } from '../shared/types';
import { SettingsManager } from './settings';
import { NotificationManager } from './notification';

export class TimerManager {
  private state: TimerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: null,
    remainingTime: 0,
    lastActivity: Date.now()
  };
  
  private interval: NodeJS.Timeout | null = null;
  private settingsManager: SettingsManager;
  private notificationManager: NotificationManager;
  private mainWindow: BrowserWindow;

  constructor(
    settingsManager: SettingsManager, 
    notificationManager: NotificationManager,
    mainWindow: BrowserWindow
  ) {
    this.settingsManager = settingsManager;
    this.notificationManager = notificationManager;
    this.mainWindow = mainWindow;
  }

  start() {
    if (this.state.isRunning && !this.state.isPaused) return;

    const settings = this.settingsManager.getAll();
    
    this.state = {
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pausedTime: null,
      remainingTime: settings.duration * 60, // 分を秒に変換
      lastActivity: Date.now()
    };

    this.startTimer();
    this.sendStateUpdate();
    
    console.log(`タイマーを開始しました: ${settings.duration}分`);
  }

  stop() {
    if (!this.state.isRunning) return;

    this.state = {
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: null,
      remainingTime: 0,
      lastActivity: Date.now()
    };

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.sendStateUpdate();
    console.log('タイマーを停止しました');
  }

  pause() {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.state.isPaused = true;
    this.state.pausedTime = Date.now();

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.sendStateUpdate();
    console.log('タイマーを一時停止しました');
  }

  resume() {
    if (!this.state.isRunning || !this.state.isPaused) return;

    const pausedDuration = Date.now() - (this.state.pausedTime || 0);
    this.state.startTime = (this.state.startTime || 0) + pausedDuration;
    this.state.isPaused = false;
    this.state.pausedTime = null;

    this.startTimer();
    this.sendStateUpdate();
    console.log('タイマーを再開しました');
  }

  reset() {
    this.stop();
    const settings = this.settingsManager.getAll();
    this.state.remainingTime = settings.duration * 60;
    this.sendStateUpdate();
    console.log('タイマーをリセットしました');
  }

  toggle() {
    if (this.state.isRunning) {
      if (this.state.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    } else {
      this.start();
    }
  }

  isRunning(): boolean {
    return this.state.isRunning && !this.state.isPaused;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  getState(): TimerState {
    return { ...this.state };
  }

  private startTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      if (!this.state.isRunning || this.state.isPaused) return;

      const settings = this.settingsManager.getAll();
      const elapsed = Math.floor((Date.now() - (this.state.startTime || 0)) / 1000);
      const totalSeconds = settings.duration * 60;
      this.state.remainingTime = Math.max(0, totalSeconds - elapsed);

      this.sendStateUpdate();

      // タイマー完了
      if (this.state.remainingTime <= 0) {
        this.onTimerComplete();
      }
    }, 1000); // 1秒ごとに更新
  }

  private onTimerComplete() {
    console.log('🎉 タイマーが完了しました！');
    
    try {
      // 通知を表示
      console.log('通知マネージャーを呼び出し中...');
      this.notificationManager.showTimerCompleteNotification();
    } catch (error) {
      console.error('通知エラー:', error);
    }
    
    try {
      // レンダラープロセスに通知
      console.log('レンダラープロセスに完了通知を送信中...');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(IPC_CHANNELS.TIMER_COMPLETE);
      }
    } catch (error) {
      console.error('レンダラープロセス通知エラー:', error);
    }
    
    // タイマーを停止
    this.stop();
    
    // 設定に応じて自動的に再開
    const settings = this.settingsManager.getAll();
    if (settings.autoStart) {
      // 少し待ってから再開（ユーザーが通知に気づく時間を確保）
      setTimeout(() => {
        console.log('自動的にタイマーを再開します');
        this.start();
      }, 5000);
    }
  }

  private sendStateUpdate() {
    // レンダラープロセスにタイマーの状態を送信
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(IPC_CHANNELS.TIMER_UPDATE, this.state);
      }
    } catch (error) {
      console.error('状態更新の送信エラー:', error);
      // ウィンドウが破棄されている場合はタイマーを停止
      this.stop();
    }
  }

  // 残り時間を取得（秒単位）
  getRemainingTime(): number {
    return this.state.remainingTime;
  }

  // 残り時間をフォーマット済み文字列で取得
  getFormattedRemainingTime(): string {
    const minutes = Math.floor(this.state.remainingTime / 60);
    const seconds = this.state.remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}