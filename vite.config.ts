import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredClientId = env.VITE_NAVER_MAP_CLIENT_ID?.trim() ?? '';
  const localClientId =
    command === 'serve' && configuredClientId === '' ? readBackendNaverMapClientId() : '';
  const naverMapClientId = configuredClientId || localClientId;

  return {
    plugins: [react()],
    define: naverMapClientId
      ? { 'import.meta.env.VITE_NAVER_MAP_CLIENT_ID': JSON.stringify(naverMapClientId) }
      : undefined,
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});

function readBackendNaverMapClientId() {
  const secretPath = resolve(
    process.cwd(),
    '../SurvivalDiary_Backend/src/main/resources/application-secret.yml',
  );
  if (!existsSync(secretPath)) return '';

  const lines = readFileSync(secretPath, 'utf8').split(/\r?\n/);
  let inNaverMap = false;
  let inGeocoding = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      inNaverMap = trimmed === 'naver-map:';
      inGeocoding = false;
      continue;
    }
    if (!inNaverMap) continue;
    if (indent === 2) {
      inGeocoding = trimmed === 'geocoding:';
      continue;
    }
    if (!inGeocoding || indent !== 4 || !trimmed.startsWith('api-key-id:')) continue;

    const rawValue = trimmed
      .slice('api-key-id:'.length)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    return resolveSpringValue(rawValue);
  }
  return '';
}

function resolveSpringValue(rawValue: string) {
  const placeholder = /^\$\{([^:}]+)(?::([^}]*))?\}$/.exec(rawValue);
  if (!placeholder) return rawValue;
  const environmentName = placeholder[1];
  if (!environmentName) return '';
  return process.env[environmentName]?.trim() || placeholder[2]?.trim() || '';
}
