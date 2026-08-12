import { ArrowLeft, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getPolicyPreference, savePolicyPreference } from '../api';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import {
  EDUCATION_STATUS_OPTIONS,
  getPreferredPolicyCategory,
  getDistrictOptions,
  POLICY_INTEREST_OPTIONS,
  REGION_OPTIONS,
  WORK_STATUS_OPTIONS,
} from '../options';
import type {
  EducationStatus,
  PolicyInterest,
  PolicyPreference,
  PolicyPreferenceInput,
  WorkStatus,
} from '../types';
import '../styles/policy-conditions.css';

interface PreferenceFormState {
  age: string;
  regionCode: string;
  districtCode: string;
  workStatus: WorkStatus | '';
  jobSeeking: '' | 'true' | 'false';
  educationStatus: EducationStatus | '';
  interests: PolicyInterest[];
}

type FormErrors = Partial<Record<'age' | 'regionCode' | 'districtCode', string>>;

const EMPTY_FORM: PreferenceFormState = {
  age: '',
  regionCode: '',
  districtCode: '',
  workStatus: '',
  jobSeeking: '',
  educationStatus: '',
  interests: [],
};

function toFormState(preference: PolicyPreference): PreferenceFormState {
  return {
    age: preference.age?.toString() ?? '',
    regionCode: preference.regionCode ?? '',
    districtCode: preference.districtCode ?? '',
    workStatus: preference.workStatus ?? '',
    jobSeeking: preference.jobSeeking === null ? '' : preference.jobSeeking ? 'true' : 'false',
    educationStatus: preference.educationStatus ?? '',
    interests: preference.interests ?? [],
  };
}

function validate(form: PreferenceFormState): FormErrors {
  const errors: FormErrors = {};
  const age = Number(form.age);

  if (!form.age || !Number.isInteger(age) || age < 18 || age > 39) {
    errors.age = '만 18세부터 39세 사이의 나이를 입력해 주세요.';
  }
  if (!form.regionCode) {
    errors.regionCode = '거주 시·도를 선택해 주세요.';
  }
  if (
    form.districtCode &&
    !getDistrictOptions(form.regionCode).some((option) => option.value === form.districtCode)
  ) {
    errors.districtCode = '선택한 시·도에 속한 시·군·구를 선택해 주세요.';
  }

  return errors;
}

function PolicyConditionsPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<PreferenceFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const districtOptions = getDistrictOptions(form.regionCode);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    void getPolicyPreference(controller.signal)
      .then((preference) => setForm(toFormState(preference)))
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setLoadError(policyErrorMessage(error, '저장된 정책 조건을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const updateField = <K extends keyof PreferenceFormState>(
    key: K,
    value: PreferenceFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaveError(null);
  };

  const toggleInterest = (interest: PolicyInterest) => {
    updateField(
      'interests',
      form.interests.includes(interest)
        ? form.interests.filter((item) => item !== interest)
        : [...form.interests, interest],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSaveError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const input: PolicyPreferenceInput = {
      age: Number(form.age),
      regionCode: form.regionCode,
      districtCode: form.districtCode || null,
      workStatus: form.workStatus || null,
      jobSeeking: form.jobSeeking === '' ? null : form.jobSeeking === 'true',
      educationStatus: form.educationStatus || null,
      interests: form.interests,
    };

    setIsSaving(true);
    try {
      const savedPreference = await savePolicyPreference(input);
      const preferredCategory = getPreferredPolicyCategory(
        savedPreference.interests ?? input.interests,
      );
      navigate(
        preferredCategory
          ? `/policies?category=${encodeURIComponent(preferredCategory)}`
          : '/policies',
        { replace: true },
      );
    } catch (error) {
      setSaveError(policyErrorMessage(error, '정책 조건을 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page policy-conditions-page">
        <PolicyStateView
          title="저장된 조건을 확인하고 있어요"
          description="잠시만 기다려 주세요."
          loading
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page policy-conditions-page">
        <PolicyStateView
          title="정책 조건을 불러오지 못했어요"
          description={loadError}
          tone="danger"
          actionLabel="다시 시도"
          onAction={() => setReloadKey((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className="page policy-conditions-page">
      <div className="page-heading policy-conditions-heading">
        <div>
          <p className="page-heading__eyebrow">Policy profile</p>
          <h1>내 정책 조건</h1>
          <p>저장한 조건을 기준으로 관련성이 높은 청년 정책 후보를 찾아드려요.</p>
        </div>
        <Link href="/policies" className="button button--secondary">
          <ArrowLeft size={17} /> 목록으로
        </Link>
      </div>

      <article className="policy-conditions-notice">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <strong>조건은 로그인한 계정에 저장됩니다.</strong>
          <p>추천 후보를 좁히는 용도로만 사용하며 브라우저에 별도로 저장하지 않습니다.</p>
        </div>
      </article>

      <form className="ui-card policy-conditions-form" onSubmit={handleSubmit} noValidate>
        <section className="policy-conditions-section" aria-labelledby="basic-condition-title">
          <div className="policy-conditions-section__heading">
            <span>1</span>
            <div>
              <h2 id="basic-condition-title">기본 조건</h2>
              <p>나이와 거주 지역은 정책 대상 범위를 확인하는 필수 조건입니다.</p>
            </div>
          </div>

          <div className="policy-conditions-grid">
            <label className="policy-field">
              <span>
                만 나이 <em>필수</em>
              </span>
              <input
                type="number"
                min="18"
                max="39"
                inputMode="numeric"
                value={form.age}
                onChange={(event) => updateField('age', event.target.value)}
                aria-invalid={Boolean(errors.age)}
                aria-describedby={errors.age ? 'policy-age-error' : 'policy-age-help'}
              />
              {errors.age ? (
                <small className="policy-field__error" id="policy-age-error">
                  {errors.age}
                </small>
              ) : (
                <small id="policy-age-help">
                  회원 생년월일이 있으면 서버에서 계산한 값이 표시됩니다.
                </small>
              )}
            </label>

            <label className="policy-field">
              <span>
                거주 시·도 <em>필수</em>
              </span>
              <select
                value={form.regionCode}
                onChange={(event) => {
                  updateField('regionCode', event.target.value);
                  updateField('districtCode', '');
                }}
                aria-invalid={Boolean(errors.regionCode)}
                aria-describedby={errors.regionCode ? 'policy-region-error' : undefined}
              >
                <option value="">시·도를 선택해 주세요</option>
                {REGION_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.regionCode ? (
                <small className="policy-field__error" id="policy-region-error">
                  {errors.regionCode}
                </small>
              ) : null}
            </label>

            <label className="policy-field policy-field--wide">
              <span>
                거주 시·군·구 <small>선택</small>
              </span>
              <select
                value={form.districtCode}
                disabled={!form.regionCode || districtOptions.length === 0}
                onChange={(event) => updateField('districtCode', event.target.value)}
                aria-invalid={Boolean(errors.districtCode)}
                aria-describedby={
                  errors.districtCode ? 'policy-district-error' : 'policy-district-help'
                }
              >
                <option value="">
                  {form.regionCode ? '시·도 전체' : '시·도를 먼저 선택해 주세요'}
                </option>
                {districtOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.districtCode ? (
                <small className="policy-field__error" id="policy-district-error">
                  {errors.districtCode}
                </small>
              ) : (
                <small id="policy-district-help">
                  {form.regionCode && districtOptions.length === 0
                    ? '시·군·구가 없는 지역으로 시·도 전체 조건이 적용됩니다.'
                    : '시·도 전체 정책을 보려면 시·도 전체를 선택하세요.'}
                </small>
              )}
            </label>
          </div>
        </section>

        <section className="policy-conditions-section" aria-labelledby="current-state-title">
          <div className="policy-conditions-section__heading">
            <span>2</span>
            <div>
              <h2 id="current-state-title">현재 상황</h2>
              <p>모르는 항목은 선택하지 않아도 됩니다.</p>
            </div>
          </div>

          <div className="policy-conditions-grid policy-conditions-grid--three">
            <label className="policy-field">
              <span>근로 상태</span>
              <select
                value={form.workStatus}
                onChange={(event) =>
                  updateField('workStatus', event.target.value as WorkStatus | '')
                }
              >
                <option value="">선택하지 않음</option>
                {WORK_STATUS_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="policy-field">
              <span>현재 구직 여부</span>
              <select
                value={form.jobSeeking}
                onChange={(event) =>
                  updateField('jobSeeking', event.target.value as PreferenceFormState['jobSeeking'])
                }
              >
                <option value="">선택하지 않음</option>
                <option value="true">구직 중</option>
                <option value="false">구직 중이 아님</option>
              </select>
            </label>

            <label className="policy-field">
              <span>교육 상태</span>
              <select
                value={form.educationStatus}
                onChange={(event) =>
                  updateField('educationStatus', event.target.value as EducationStatus | '')
                }
              >
                <option value="">선택하지 않음</option>
                {EDUCATION_STATUS_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <fieldset className="policy-conditions-section policy-interest-fieldset">
          <legend className="policy-conditions-section__heading">
            <span>3</span>
            <span>
              <strong>관심 주제</strong>
              <small>여러 개 선택할 수 있으며 추천 우선순위에 반영됩니다.</small>
            </span>
          </legend>

          <div className="policy-interest-options">
            {POLICY_INTEREST_OPTIONS.map((option) => {
              const checked = form.interests.includes(option.value);
              return (
                <label
                  className={`policy-interest ${checked ? 'policy-interest--checked' : ''}`}
                  key={option.value}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInterest(option.value)}
                  />
                  <span className="policy-interest__check" aria-hidden="true">
                    {checked ? <Check size={15} /> : null}
                  </span>
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {saveError ? (
          <p className="policy-form-error" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="policy-conditions-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setSaveError(null);
            }}
            disabled={isSaving}
          >
            <RotateCcw size={16} /> 입력 초기화
          </button>
          <button className="button button--primary" type="submit" disabled={isSaving}>
            {isSaving ? '저장 중...' : '조건 저장하고 추천 보기'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PolicyConditionsPage;
