// アクティビティ監視モジュール
import { powerMonitor, globalShortcut } from 'electron';
import { TimerManager } from './timer';
import { SettingsManager } from './settings';
import { ActivityEvent } from '../shared/types';

export class ActivityMonitor {
  private timerManager: TimerManager;
  private settingsManager: SettingsManager;
  private lastActivity: number = Date.now();
  private isMonitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private mouseInterval: NodeJS.Timeout | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;

  constructor(timerManager: TimerManager, settingsManager: SettingsManager) {
    this.timerManager = timerManager;
    this.settingsManager = settingsManager;
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastActivity = Date.now();

    // アクティビティ監視を完全に無効化
    console.log('アクティビティ監視は無効化されています（手動操作のみ）');
    
    // 以下の監視機能をすべて無効化
    // this.startMouseTracking();
    // this.setupKeyboardTracking();
    // this.startIdleCheck();
    
    // システムイベントの監視のみ維持（スリープ時の情報表示用）
    this.setupSystemEvents();
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.mouseInterval) {
      clearInterval(this.mouseInterval);
      this.mouseInterval = null;
    }

    // グローバルショートカットをクリア
    globalShortcut.unregisterAll();

    console.log('アクティビティ監視を停止しました');
  }

  private startMouseTracking() {
    // 自動的なマウストラッキングを無効化
    // アクティビティベースの自動開始は使いづらいため
    console.log('マウストラッキングは無効化されています');
    
    // 以下のコードをコメントアウト
    // const { screen } = require('electron');
    // 
    // this.mouseInterval = setInterval(() => {
    //   try {
    //     const currentPosition = screen.getCursorScreenPoint();
    //     
    //     if (this.lastMousePosition) {
    //       if (currentPosition.x !== this.lastMousePosition.x || 
    //           currentPosition.y !== this.lastMousePosition.y) {
    //         this.onActivity({ type: 'mouse', timestamp: Date.now() });
    //       }
    //     }
    //     
    //     this.lastMousePosition = currentPosition;
    //   } catch (error) {
    //     console.error('マウス位置の取得エラー:', error);
    //   }
    // }, 500); // 500msごとにチェック
  }

  private setupKeyboardTracking() {
    // キーボードトラッキングも無効化
    // 手動でのタイマー開始のみをサポート
    console.log('キーボードトラッキングは無効化されています');
    
    // 以下のコードをコメントアウト
    // const checkSystemActivity = () => {
    //   const idleTime = powerMonitor.getSystemIdleTime();
    //   if (idleTime < 1) {
    //     this.onActivity({ type: 'keyboard', timestamp: Date.now() });
    //   }
    // };
    //
    // setInterval(checkSystemActivity, 1000);
  }

  private startIdleCheck() {
    // アイドル時の自動停止機能を無効化
    // 一度開始したタイマーは継続して動作する
    console.log('アイドルチェックは無効化されています');
    
    // 以下のコードをコメントアウト
    // this.checkInterval = setInterval(() => {
    //   const settings = this.settingsManager.getAll();
    //   const now = Date.now();
    //   const idleTime = (now - this.lastActivity) / 1000; // 秒単位
    //
    //   if (idleTime >= settings.inactivityThreshold) {
    //     // アイドル状態になった
    //     if (this.timerManager.isRunning()) {
    //       console.log(`${settings.inactivityThreshold}秒間操作がないため、タイマーを一時停止します`);
    //       this.timerManager.pause();
    //     }
    //   }
    // }, 5000); // 5秒ごとにチェック
  }

  private setupSystemEvents() {
    // システムイベントの監視は行うが、タイマーの停止は行わない
    powerMonitor.on('suspend', () => {
      console.log('システムがスリープします（タイマーは継続）');
      // タイマーの一時停止は行わない
    });

    powerMonitor.on('resume', () => {
      console.log('システムが復帰しました（タイマーは継続中）');
    });

    // スクリーンのロック/アンロック
    powerMonitor.on('lock-screen', () => {
      console.log('スクリーンがロックされました（タイマーは継続）');
      // タイマーの一時停止は行わない
    });

    powerMonitor.on('unlock-screen', () => {
      console.log('スクリーンがアンロックされました（タイマーは継続中）');
    });
  }

  private onActivity(event: ActivityEvent) {
    this.lastActivity = event.timestamp;
    
    // 自動開始・自動再開機能を完全に無効化
    console.log('アクティビティを検知しましたが、自動開始は無効化されています');
    
    // 以下のコードをコメントアウト
    // const settings = this.settingsManager.getAll();
    //
    // // タイマーが停止中で、自動開始が有効な場合
    // if (!this.timerManager.isRunning() && !this.timerManager.isPaused() && settings.autoStart) {
    //   console.log('アクティビティを検知しました。タイマーを開始します');
    //   this.timerManager.start();
    // }
    //
    // // タイマーが一時停止中の場合、再開
    // if (this.timerManager.isPaused()) {
    //   console.log('アクティビティを検知しました。タイマーを再開します');
    //   this.timerManager.resume();
    // }
  }

  getLastActivity(): number {
    return this.lastActivity;
  }
}