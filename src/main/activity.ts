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

    // マウス移動の検知（ポーリング方式）
    // Electronはグローバルマウスイベントを直接サポートしていないため、
    // 定期的にマウス位置をチェック
    this.startMouseTracking();

    // キーボードイベントの検知（グローバルショートカットを利用）
    this.setupKeyboardTracking();

    // アイドル状態のチェック
    this.startIdleCheck();

    // システムイベントの監視
    this.setupSystemEvents();

    console.log('アクティビティ監視を開始しました');
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
    // Electronの制限により、完全なグローバルマウストラッキングは困難
    // ここでは簡易的な実装を行う
    const { screen } = require('electron');
    
    this.mouseInterval = setInterval(() => {
      try {
        const currentPosition = screen.getCursorScreenPoint();
        
        if (this.lastMousePosition) {
          if (currentPosition.x !== this.lastMousePosition.x || 
              currentPosition.y !== this.lastMousePosition.y) {
            this.onActivity({ type: 'mouse', timestamp: Date.now() });
          }
        }
        
        this.lastMousePosition = currentPosition;
      } catch (error) {
        console.error('マウス位置の取得エラー:', error);
      }
    }, 500); // 500msごとにチェック
  }

  private setupKeyboardTracking() {
    // 一般的なキー入力を検知するための仮想的なショートカット
    // 実際のグローバルキーボードフックは、セキュリティ上の理由でElectronでは制限がある
    // より完全な実装には、ネイティブモジュールが必要

    // システムがアクティブな間は、アクティビティとして扱う
    const checkSystemActivity = () => {
      const idleTime = powerMonitor.getSystemIdleTime();
      if (idleTime < 1) {
        this.onActivity({ type: 'keyboard', timestamp: Date.now() });
      }
    };

    setInterval(checkSystemActivity, 1000);
  }

  private startIdleCheck() {
    this.checkInterval = setInterval(() => {
      const settings = this.settingsManager.getAll();
      const now = Date.now();
      const idleTime = (now - this.lastActivity) / 1000; // 秒単位

      if (idleTime >= settings.inactivityThreshold) {
        // アイドル状態になった
        if (this.timerManager.isRunning()) {
          console.log(`${settings.inactivityThreshold}秒間操作がないため、タイマーを一時停止します`);
          this.timerManager.pause();
        }
      }
    }, 5000); // 5秒ごとにチェック
  }

  private setupSystemEvents() {
    // システムのスリープ/復帰イベント
    powerMonitor.on('suspend', () => {
      console.log('システムがスリープします');
      if (this.timerManager.isRunning()) {
        this.timerManager.pause();
      }
    });

    powerMonitor.on('resume', () => {
      console.log('システムが復帰しました');
      // 自動的に再開はしない（ユーザーの操作を待つ）
    });

    // スクリーンのロック/アンロック
    powerMonitor.on('lock-screen', () => {
      console.log('スクリーンがロックされました');
      if (this.timerManager.isRunning()) {
        this.timerManager.pause();
      }
    });

    powerMonitor.on('unlock-screen', () => {
      console.log('スクリーンがアンロックされました');
      // 自動的に再開はしない（ユーザーの操作を待つ）
    });
  }

  private onActivity(event: ActivityEvent) {
    this.lastActivity = event.timestamp;

    const settings = this.settingsManager.getAll();

    // タイマーが停止中で、自動開始が有効な場合
    if (!this.timerManager.isRunning() && !this.timerManager.isPaused() && settings.autoStart) {
      console.log('アクティビティを検知しました。タイマーを開始します');
      this.timerManager.start();
    }

    // タイマーが一時停止中の場合、再開
    if (this.timerManager.isPaused()) {
      console.log('アクティビティを検知しました。タイマーを再開します');
      this.timerManager.resume();
    }
  }

  getLastActivity(): number {
    return this.lastActivity;
  }
}