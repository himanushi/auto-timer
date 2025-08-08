// 通知管理モジュール
import { Notification, nativeImage, shell } from 'electron';
import * as path from 'path';
import { SettingsManager } from './settings';
import { NotificationOptions } from '../shared/types';

export class NotificationManager {
  private settingsManager: SettingsManager;
  private audio: HTMLAudioElement | null = null;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  showTimerCompleteNotification() {
    const settings = this.settingsManager.getAll();
    console.log('🔔 タイマー完了通知を表示中...', {
      pushEnabled: settings.pushNotificationEnabled,
      soundEnabled: settings.soundEnabled,
      flashEnabled: settings.flashEnabled,
      notificationSupported: Notification.isSupported()
    });

    // 複数回通知で確実に気づかせる
    this.showMultipleNotifications(settings);

    // 音声通知（複数回再生）
    if (settings.soundEnabled) {
      console.log('🔊 音声通知を複数回再生中...');
      this.playRepeatedSound(settings.customSoundPath);
    } else {
      console.log('音声通知がスキップされました');
    }

    // 画面フラッシュ（強化版）
    if (settings.flashEnabled) {
      console.log('⚡ 画面フラッシュを実行中...');
      this.flashWindowMultiple();
    } else {
      console.log('画面フラッシュがスキップされました');
    }
  }

  private showMultipleNotifications(settings: any) {
    if (!settings.pushNotificationEnabled || !Notification.isSupported()) {
      console.log('プッシュ通知がスキップされました');
      return;
    }

    console.log('📢 複数のプッシュ通知を送信中...');
    
    // 最初の通知
    this.showPushNotification({
      title: '🎉 タイマー完了！',
      body: `${settings.duration}分のタイマーが完了しました！\n\n✨ お疲れさまでした！休憩を取りましょう。`,
    });

    // 2秒後に追加通知
    setTimeout(() => {
      this.showPushNotification({
        title: '⏰ タイマー完了 - 確認してください',
        body: `作業時間: ${settings.duration}分が終了しました\n\n💡 次の作業に移る前に少し休憩しませんか？`,
      });
    }, 2000);

    // 5秒後にさらに追加通知（見逃した場合用）
    setTimeout(() => {
      this.showPushNotification({
        title: '🚨 重要：タイマー完了',
        body: `${settings.duration}分の作業セッションが完了しています\n\n👀 通知を確認してください`,
      });
    }, 5000);
  }

  showTestNotification() {
    const settings = this.settingsManager.getAll();
    
    this.showPushNotification({
      title: 'テスト通知',
      body: 'これはテスト通知です。設定が正しく動作しています。',
    });

    if (settings.soundEnabled) {
      this.playSound(settings.customSoundPath);
    }
  }

  private showPushNotification(options: NotificationOptions) {
    if (!Notification.isSupported()) {
      console.warn('このシステムではプッシュ通知がサポートされていません');
      return;
    }

    console.log('プッシュ通知を作成中...', options);
    
    const notification = new Notification({
      title: options.title,
      body: options.body,
      // アイコンパスを一時的に削除（存在しないファイルが原因の可能性）
      // icon: iconPath,
      silent: false, // 必ず音を鳴らす
      urgency: 'critical', // 緊急度を最高に設定
      timeoutType: 'never', // 通知を自動で消さない
    });

    notification.on('show', () => {
      console.log('通知が表示されました');
    });

    notification.on('click', () => {
      console.log('通知がクリックされました');
      // メインウィンドウを表示
      const { BrowserWindow } = require('electron');
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
        windows[0].focus();
      }
    });

    notification.on('close', () => {
      console.log('通知が閉じられました');
    });

    notification.on('failed', (error) => {
      console.error('通知の表示に失敗しました:', error);
    });

    try {
      notification.show();
      console.log('notification.show() が呼ばれました');
    } catch (error) {
      console.error('通知表示エラー:', error);
    }
  }

  private playSound(customSoundPath?: string) {
    try {
      const settings = this.settingsManager.getAll();
      console.log('🔊 音声再生を試行中...');
      
      // システムビープ音を鳴らす
      shell.beep();
      
      // macOSの場合、システムサウンドを使用
      if (process.platform === 'darwin') {
        console.log('🍎 macOS システムサウンドを再生');
        const { exec } = require('child_process');
        // macOSの警告音を再生
        exec('afplay /System/Library/Sounds/Glass.aiff -v 1');
        
        // 複数の音を重ねて目立たせる
        setTimeout(() => exec('afplay /System/Library/Sounds/Ping.aiff -v 1'), 500);
        setTimeout(() => exec('afplay /System/Library/Sounds/Pop.aiff -v 1'), 1000);
      }
      
    } catch (error) {
      console.error('音声再生エラー:', error);
      // フォールバック: システムビープ音
      shell.beep();
    }
  }

  private playRepeatedSound(customSoundPath?: string) {
    // 複数回音を鳴らして確実に気づかせる
    console.log('🔔 複数回音声再生を開始');
    
    this.playSound(customSoundPath);
    setTimeout(() => this.playSound(customSoundPath), 1000);
    setTimeout(() => this.playSound(customSoundPath), 2000);
    setTimeout(() => this.playSound(customSoundPath), 4000);
  }

  private flashWindow() {
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    if (windows.length === 0) return;
    
    const mainWindow = windows[0];
    
    // ウィンドウを点滅させる
    if (process.platform === 'win32') {
      // Windowsの場合、タスクバーを点滅
      mainWindow.flashFrame(true);
    } else if (process.platform === 'darwin') {
      // macOSの場合、Dockアイコンをバウンス
      const { app } = require('electron');
      app.dock.bounce('critical');
    } else {
      // Linuxの場合、ウィンドウを前面に表示して戻す
      const wasMinimized = mainWindow.isMinimized();
      const wasVisible = mainWindow.isVisible();
      
      mainWindow.show();
      mainWindow.focus();
      
      setTimeout(() => {
        if (wasMinimized) {
          mainWindow.minimize();
        } else if (!wasVisible) {
          mainWindow.hide();
        }
      }, 1000);
    }
  }

  private flashWindowMultiple() {
    console.log('⚡ 強化画面フラッシュを開始');
    const { BrowserWindow, app } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    if (windows.length === 0) return;
    
    const mainWindow = windows[0];
    
    if (process.platform === 'darwin') {
      // macOSの場合、複数回Dockをバウンス
      console.log('🍎 Dockアイコンを複数回バウンス');
      app.dock.bounce('critical');
      setTimeout(() => app.dock.bounce('critical'), 1000);
      setTimeout(() => app.dock.bounce('critical'), 2000);
      
      // ウィンドウを前面に表示
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
      }, 3000);
      
    } else if (process.platform === 'win32') {
      // Windowsの場合、継続的にフラッシュ
      mainWindow.flashFrame(true);
      setTimeout(() => mainWindow.flashFrame(false), 1000);
      setTimeout(() => mainWindow.flashFrame(true), 1500);
      setTimeout(() => mainWindow.flashFrame(false), 2500);
    }
  }

  // カスタム通知を表示
  showCustomNotification(options: NotificationOptions) {
    this.showPushNotification(options);
  }

  // 通知音のテスト
  testSound(soundPath?: string) {
    this.playSound(soundPath);
  }
}