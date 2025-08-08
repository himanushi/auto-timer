// 設定コンポーネント
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  TextField,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VolumeUp,
  NotificationsActive,
  Brightness7,
  Brightness4,
  RestartAlt,
  Science,
  FolderOpen,
} from '@mui/icons-material';
import { TimerSettings } from '../../shared/types';

interface SettingsProps {
  settings: TimerSettings;
  onSettingsChange: (newSettings: Partial<TimerSettings>) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
  darkMode,
  onDarkModeToggle,
}) => {
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const handleDurationChange = (_event: Event, newValue: number | number[]) => {
    onSettingsChange({ duration: newValue as number });
  };

  const handleInactivityThresholdChange = (_event: Event, newValue: number | number[]) => {
    onSettingsChange({ inactivityThreshold: newValue as number });
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    onSettingsChange({ soundVolume: newValue as number });
  };

  const handleTestNotification = async () => {
    await window.electronApi.notification.test();
    setTestMessage('テスト通知を送信しました');
    setTimeout(() => setTestMessage(null), 3000);
  };

  const handleResetSettings = () => {
    if (window.confirm('設定をデフォルトに戻しますか？')) {
      window.electronApi.settings.reset();
      window.location.reload();
    }
  };

  const handleSelectSoundFile = () => {
    // Electronのダイアログを使用してファイルを選択
    // 注: この機能を完全に実装するには、メインプロセスに追加のIPCハンドラーが必要
    alert('カスタム音声ファイルの選択機能は準備中です');
  };

  return (
    <Box>
      {testMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setTestMessage(null)}>
          {testMessage}
        </Alert>
      )}

      {/* タイマー設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            タイマー設定
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              タイマー時間: {settings.duration}分
            </Typography>
            <Slider
              value={settings.duration}
              onChange={handleDurationChange}
              min={1}
              max={120}
              step={1}
              marks={[
                { value: 1, label: '1分' },
                { value: 25, label: '25分' },
                { value: 60, label: '60分' },
                { value: 120, label: '120分' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              非アクティブ判定時間: {settings.inactivityThreshold}秒
            </Typography>
            <Slider
              value={settings.inactivityThreshold}
              onChange={handleInactivityThresholdChange}
              min={10}
              max={300}
              step={10}
              marks={[
                { value: 10, label: '10秒' },
                { value: 30, label: '30秒' },
                { value: 60, label: '1分' },
                { value: 300, label: '5分' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoStart}
                  onChange={(e) => onSettingsChange({ autoStart: e.target.checked })}
                />
              }
              label="アクティビティ検知時に自動開始"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            通知設定
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotificationEnabled}
                  onChange={(e) => onSettingsChange({ pushNotificationEnabled: e.target.checked })}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActive />
                  <span>プッシュ通知</span>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEnabled}
                  onChange={(e) => onSettingsChange({ soundEnabled: e.target.checked })}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VolumeUp />
                  <span>通知音</span>
                </Box>
              }
            />

            {settings.soundEnabled && (
              <Box sx={{ ml: 4 }}>
                <Typography gutterBottom>
                  音量: {settings.soundVolume}%
                </Typography>
                <Slider
                  value={settings.soundVolume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={10}
                  valueLabelDisplay="auto"
                />
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FolderOpen />}
                  onClick={handleSelectSoundFile}
                  sx={{ mt: 1 }}
                >
                  カスタム音声を選択
                </Button>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={settings.flashEnabled}
                  onChange={(e) => onSettingsChange({ flashEnabled: e.target.checked })}
                />
              }
              label="画面フラッシュ"
            />

            <Button
              variant="contained"
              startIcon={<Science />}
              onClick={handleTestNotification}
              sx={{ mt: 2 }}
            >
              通知をテスト
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* アプリケーション設定 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            アプリケーション設定
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>テーマ</Typography>
              <Tooltip title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}>
                <IconButton onClick={onDarkModeToggle}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
            </Box>

            <Divider />

            <Button
              variant="outlined"
              color="error"
              startIcon={<RestartAlt />}
              onClick={handleResetSettings}
            >
              設定をリセット
            </Button>

            <Typography variant="caption" color="text.secondary">
              バージョン: 1.0.0
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};