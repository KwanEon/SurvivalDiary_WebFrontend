import { apiRequest } from '../auth';
import type {
  PolicyPreference,
  PolicyPreferenceInput,
  PolicyRecommendationRequest,
  PolicySearchResponse,
} from './types';

export function getPolicyPreference(signal?: AbortSignal) {
  return apiRequest<PolicyPreference>('/users/me/policy-preferences', { signal });
}

export function savePolicyPreference(input: PolicyPreferenceInput) {
  return apiRequest<PolicyPreference>('/users/me/policy-preferences', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function getPolicyRecommendations(
  request: PolicyRecommendationRequest,
  signal?: AbortSignal,
) {
  return apiRequest<PolicySearchResponse>('/policies/recommendations', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  });
}
