module.exports = {
  packagerConfig: {
    name: 'Auto Timer',
    executableName: 'auto-timer',
    icon: './assets/icon',
    appBundleId: 'com.example.autotimer',
    appCategoryType: 'public.app-category.productivity',
    asar: true,
    darwin: {
      darkModeSupport: true,
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: './build/entitlements.mac.plist',
      entitlementsInherit: './build/entitlements.mac.plist',
    },
    win32metadata: {
      CompanyName: 'Auto Timer',
      FileDescription: 'Automatic activity-based timer',
      OriginalFilename: 'auto-timer.exe',
      ProductName: 'Auto Timer',
      InternalName: 'auto-timer',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'auto_timer',
        authors: 'Auto Timer Developer',
        description: 'Automatic activity-based timer for productivity',
        exe: 'auto-timer.exe',
        setupExe: 'AutoTimerSetup.exe',
        setupIcon: './assets/icon.ico',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Auto Timer',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'auto-timer',
          productName: 'Auto Timer',
          genericName: 'Timer',
          description: 'Automatic activity-based timer for productivity',
          homepage: 'https://github.com/yourusername/auto-timer',
          icon: './assets/icon.png',
          categories: ['Utility', 'Office'],
          maintainer: 'Auto Timer Developer',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'auto-timer',
          productName: 'Auto Timer',
          genericName: 'Timer',
          description: 'Automatic activity-based timer for productivity',
          homepage: 'https://github.com/yourusername/auto-timer',
          icon: './assets/icon.png',
          categories: ['Utility', 'Office'],
          license: 'MIT',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};