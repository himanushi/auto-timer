// メインアプリケーションコンポーネント
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
  useMediaQuery,
} from '@mui/material';
import { TimerDisplay } from './components/TimerDisplay';
import { Settings } from './components/Settings';
import { TimerState, TimerSettings } from '../shared/types';

// ダークモード対応のテーマ
const createAppTheme = (isDarkMode: boolean) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [tabValue, setTabValue] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: null,
    remainingTime: 0,
    lastActivity: Date.now(),
  });
  const [settings, setSettings] = useState<TimerSettings | null>(null);

  // 初期化
  useEffect(() => {
    // 設定を読み込み
    window.electronApi.settings.get().then((loadedSettings) => {
      setSettings(loadedSettings);
      setTimerState((prev) => ({
        ...prev,
        remainingTime: loadedSettings.duration * 60,
      }));
    });

    // タイマー更新のリスナー
    const unsubscribeUpdate = window.electronApi.timer.onUpdate((state) => {
      setTimerState(state);
    });

    // タイマー完了のリスナー
    const unsubscribeComplete = window.electronApi.timer.onComplete(() => {
      // タイマー完了時の処理（必要に応じて）
      console.log('タイマーが完了しました');
    });

    // ナビゲーションのリスナー
    const unsubscribeNavigate = window.electronApi.app.onNavigate((route) => {
      if (route === '/settings') {
        setTabValue(1);
      }
    });

    // クリーンアップ
    return () => {
      unsubscribeUpdate();
      unsubscribeComplete();
      unsubscribeNavigate();
    };
  }, []);

  // ダークモード切り替え
  useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  const theme = createAppTheme(darkMode);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingsChange = async (newSettings: Partial<TimerSettings>) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await window.electronApi.settings.update(newSettings);
    
    // タイマー時間が変更された場合、表示を更新
    if (newSettings.duration !== undefined && !timerState.isRunning) {
      setTimerState((prev) => ({
        ...prev,
        remainingTime: (newSettings.duration ?? settings.duration) * 60,
      }));
    }
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  if (!settings) {
    return <div>読み込み中...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          pt: 1, // 標準タイトルバーを使用するため、全プラットフォームで同じパディング
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="タイマー" />
                <Tab label="設定" />
              </Tabs>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              <TabPanel value={tabValue} index={0}>
                <TimerDisplay 
                  timerState={timerState} 
                  settings={settings}
                />
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Settings 
                  settings={settings} 
                  onSettingsChange={handleSettingsChange}
                  darkMode={darkMode}
                  onDarkModeToggle={handleDarkModeToggle}
                />
              </TabPanel>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;