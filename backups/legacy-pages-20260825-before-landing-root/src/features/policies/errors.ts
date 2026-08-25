import { ApiError } from '../auth';

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function policyErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  switch (error.code) {
    case 'Y002':
    case 'Y003':
      return '정책 제공처 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.';
    case 'Y004':
      return '입력한 정책 조건을 다시 확인해 주세요.';
    case 'Y005':
      return '추천을 받으려면 먼저 내 정책 조건을 저장해 주세요.';
    default:
      return error.message || fallback;
  }
}
