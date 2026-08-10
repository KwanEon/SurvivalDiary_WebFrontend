import { apiRequest } from '../auth';
import type {
  HiddenPolicyRequest,
  HiddenPolicySummary,
  PageResponse,
  PolicyDetail,
  PolicyPreference,
  PolicyPreferenceInput,
  PolicyRecommendationRequest,
  PolicySearchResponse,
} from './types';

export function getPolicyDetail(policyId: string, signal?: AbortSignal) {
  return apiRequest<PolicyDetail>(`/policies/${encodeURIComponent(policyId)}`, { signal });
}

export function getHiddenPolicies(page = 0, size = 20, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequest<PageResponse<HiddenPolicySummary>>(
    `/users/me/hidden-policies?${params.toString()}`,
    { signal },
  );
}

export function hidePolicy(policyId: string, input: HiddenPolicyRequest) {
  return apiRequest<HiddenPolicySummary>(
    `/users/me/hidden-policies/${encodeURIComponent(policyId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export function restoreHiddenPolicy(policyId: string) {
  return apiRequest<void>(`/users/me/hidden-policies/${encodeURIComponent(policyId)}`, {
    method: 'DELETE',
  });
}

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
