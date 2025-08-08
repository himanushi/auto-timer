// 設定管理モジュール
import Store from 'electron-store';
import { TimerSettings, DEFAULT_SETTINGS } from '../shared/types';

export class SettingsManager {
  private store: Store<{ settings: TimerSettings }>;

  constructor() {
    this.store = new Store<{ settings: TimerSettings }>({
      name: 'auto-timer-settings',
      defaults: {
        settings: DEFAULT_SETTINGS
      },
      schema: {
        settings: {
          type: 'object',
          properties: {
            duration: {
              type: 'number',
              minimum: 1,
              maximum: 120,
              default: 25
            },
            soundEnabled: {
              type: 'boolean',
              default: true
            },
            pushNotificationEnabled: {
              type: 'boolean',
              default: true
            },
            flashEnabled: {
              type: 'boolean',
              default: false
            },
            autoStart: {
              type: 'boolean',
              default: true
            },
            inactivityThreshold: {
              type: 'number',
              minimum: 10,
              maximum: 300,
              default: 30
            },
            soundVolume: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              default: 50
            },
            customSoundPath: {
              type: 'string',
              default: undefined
            }
          }
        }
      }
    });
  }

  // すべての設定を取得
  getAll(): TimerSettings {
    return this.store.get('settings', DEFAULT_SETTINGS);
  }

  // 特定の設定を取得
  get<K extends keyof TimerSettings>(key: K): TimerSettings[K] {
    const settings = this.getAll();
    return settings[key];
  }

  // 設定を更新
  update(newSettings: Partial<TimerSettings>): void {
    const currentSettings = this.getAll();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // バリデーション
    this.validateSettings(updatedSettings);
    
    this.store.set('settings', updatedSettings);
    console.log('設定を更新しました:', updatedSettings);
  }

  // 特定の設定を更新
  set<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]): void {
    const settings = this.getAll();
    settings[key] = value;
    this.update(settings);
  }

  // 設定をリセット
  reset(): void {
    this.store.set('settings', DEFAULT_SETTINGS);
    console.log('設定をデフォルトにリセットしました');
  }

  // 設定をエクスポート
  export(): string {
    const settings = this.getAll();
    return JSON.stringify(settings, null, 2);
  }

  // 設定をインポート
  import(jsonString: string): boolean {
    try {
      const settings = JSON.parse(jsonString) as TimerSettings;
      this.validateSettings(settings);
      this.store.set('settings', settings);
      console.log('設定をインポートしました');
      return true;
    } catch (error) {
      console.error('設定のインポートに失敗しました:', error);
      return false;
    }
  }

  // 設定ファイルのパスを取得
  getFilePath(): string {
    return this.store.path;
  }

  // 設定の検証
  private validateSettings(settings: TimerSettings): void {
    // duration
    if (settings.duration < 1 || settings.duration > 120) {
      throw new Error('タイマー時間は1〜120分の間で設定してください');
    }

    // inactivityThreshold
    if (settings.inactivityThreshold < 10 || settings.inactivityThreshold > 300) {
      throw new Error('非アクティブ判定時間は10〜300秒の間で設定してください');
    }

    // soundVolume
    if (settings.soundVolume < 0 || settings.soundVolume > 100) {
      throw new Error('音量は0〜100の間で設定してください');
    }

    // customSoundPath
    if (settings.customSoundPath) {
      const fs = require('fs');
      if (!fs.existsSync(settings.customSoundPath)) {
        console.warn('カスタム音声ファイルが存在しません:', settings.customSoundPath);
        // エラーにはしない（デフォルト音声を使用）
      }
    }
  }

  // 設定変更の監視
  onDidChange(callback: (newSettings: TimerSettings, oldSettings: TimerSettings) => void): () => void {
    return this.store.onDidChange('settings', (newValue, oldValue) => {
      if (newValue && oldValue) {
        callback(newValue, oldValue);
      }
    }) as () => void;
  }
}