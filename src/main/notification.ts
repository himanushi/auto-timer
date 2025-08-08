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

    // プッシュ通知
    if (settings.pushNotificationEnabled && Notification.isSupported()) {
      this.showPushNotification({
        title: 'タイマー完了',
        body: `${settings.duration}分のタイマーが完了しました！\n休憩を取りましょう。`,
      });
    }

    // 音声通知
    if (settings.soundEnabled) {
      this.playSound(settings.customSoundPath);
    }

    // 画面フラッシュ（Electronでは直接実装が難しいため、ウィンドウを点滅）
    if (settings.flashEnabled) {
      this.flashWindow();
    }
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

    const iconPath = path.join(__dirname, '../../assets/icon.png');
    
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: iconPath,
      silent: options.silent || false,
      timeoutType: 'default',
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

    notification.show();
  }

  private playSound(customSoundPath?: string) {
    try {
      const settings = this.settingsManager.getAll();
      
      // 音声ファイルのパス
      let soundPath: string;
      if (customSoundPath && require('fs').existsSync(customSoundPath)) {
        soundPath = customSoundPath;
      } else {
        soundPath = path.join(__dirname, '../../assets/notification.wav');
      }

      // Node.jsでは直接音声を再生できないため、システムコマンドを使用
      const { exec } = require('child_process');
      
      if (process.platform === 'darwin') {
        // macOS
        exec(`afplay "${soundPath}" -v ${settings.soundVolume / 100}`);
      } else if (process.platform === 'win32') {
        // Windows
        // PowerShellを使用して音声を再生
        const volume = Math.round(settings.soundVolume);
        exec(`powershell -c "(New-Object Media.SoundPlayer '${soundPath}').PlaySync()"`, 
          (error: any) => {
            if (error) {
              console.error('音声再生エラー:', error);
              // 代替方法: システムのビープ音
              shell.beep();
            }
          }
        );
      } else {
        // Linux
        exec(`paplay "${soundPath}"`, (error: any) => {
          if (error) {
            // 代替コマンドを試す
            exec(`aplay "${soundPath}"`, (error2: any) => {
              if (error2) {
                console.error('音声再生エラー:', error2);
                shell.beep();
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('音声再生エラー:', error);
      // フォールバック: システムビープ音
      shell.beep();
    }
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

  // カスタム通知を表示
  showCustomNotification(options: NotificationOptions) {
    this.showPushNotification(options);
  }

  // 通知音のテスト
  testSound(soundPath?: string) {
    this.playSound(soundPath);
  }
}