// タイマー表示コンポーネント
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Timer as TimerIcon,
  Mouse,
  Keyboard,
} from '@mui/icons-material';
import { TimerState, TimerSettings } from '../../shared/types';

interface TimerDisplayProps {
  timerState: TimerState;
  settings: TimerSettings;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timerState, settings }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    window.electronApi.timer.start();
  };

  const handleStop = () => {
    window.electronApi.timer.stop();
  };

  const handlePause = () => {
    window.electronApi.timer.pause();
  };

  const handleResume = () => {
    window.electronApi.timer.resume();
  };

  const handleReset = () => {
    window.electronApi.timer.reset();
  };

  // 進捗率を計算
  const progress = timerState.isRunning
    ? ((settings.duration * 60 - timerState.remainingTime) / (settings.duration * 60)) * 100
    : 0;

  // 最後のアクティビティからの経過時間
  const timeSinceLastActivity = Math.floor((Date.now() - timerState.lastActivity) / 1000);
  const isNearlyInactive = timeSinceLastActivity > settings.inactivityThreshold - 10;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <TimerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            
            <Typography variant="h1" component="div" sx={{ 
              fontSize: '4rem', 
              fontWeight: 'bold',
              color: timerState.isRunning ? 'primary.main' : 'text.primary',
              fontFamily: 'monospace',
            }}>
              {formatTime(timerState.remainingTime)}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {timerState.isRunning && !timerState.isPaused
                ? 'タイマー実行中'
                : timerState.isPaused
                ? '一時停止中'
                : '待機中'}
            </Typography>

            {timerState.isRunning && (
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* コントロールボタン */}
      <Stack spacing={2} direction="row" justifyContent="center" sx={{ mb: 3 }}>
        {!timerState.isRunning ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStart}
            sx={{ px: 4 }}
          >
            開始
          </Button>
        ) : timerState.isPaused ? (
          <>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleResume}
            >
              再開
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Stop />}
              onClick={handleStop}
            >
              停止
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<Pause />}
              onClick={handlePause}
            >
              一時停止
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<Stop />}
              onClick={handleStop}
            >
              停止
            </Button>
          </>
        )}
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<Refresh />}
          onClick={handleReset}
        >
          リセット
        </Button>
      </Stack>

      {/* ステータス表示 */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            ステータス
          </Typography>
          
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">自動開始:</Typography>
              <Chip 
                label={settings.autoStart ? 'ON' : 'OFF'} 
                size="small"
                color={settings.autoStart ? 'success' : 'default'}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">検知モード:</Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip 
                  icon={<Mouse />} 
                  label="マウス" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  icon={<Keyboard />} 
                  label="キーボード" 
                  size="small" 
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">非アクティブ判定:</Typography>
              <Chip 
                label={`${settings.inactivityThreshold}秒`} 
                size="small"
                color={isNearlyInactive ? 'warning' : 'default'}
              />
            </Box>

            {timerState.isRunning && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">最後の操作:</Typography>
                <Chip 
                  label={`${timeSinceLastActivity}秒前`} 
                  size="small"
                  color={isNearlyInactive ? 'warning' : 'primary'}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 使い方のヒント */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          💡 ヒント: マウスやキーボードを操作すると自動的にタイマーが開始されます。
          {settings.inactivityThreshold}秒間操作がないと自動的に一時停止します。
        </Typography>
      </Box>
    </Box>
  );
};