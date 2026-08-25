import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getPolicyPreference, savePolicyPreference } from '../api';
import PolicyStateView from '../components/PolicyStateView';
import { isAbortError, policyErrorMessage } from '../errors';
import {
  EDUCATION_LEVEL_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
  getDistrictOptions,
  POLICY_INTEREST_OPTIONS,
  REGION_OPTIONS,
  WORK_STATUS_OPTIONS,
} from '../options';
import type {
  EducationLevel,
  EnrollmentStatus,
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
  educationLevel: EducationLevel | '';
  enrollmentStatus: EnrollmentStatus | '';
  interests: PolicyInterest[];
}

type FormErrors = Partial<Record<'age' | 'regionCode' | 'districtCode', string>>;

const EMPTY_FORM: PreferenceFormState = {
  age: '',
  regionCode: '',
  districtCode: '',
  workStatus: '',
  jobSeeking: '',
  educationLevel: '',
  enrollmentStatus: '',
  interests: [],
};

function toFormState(preference: PolicyPreference): PreferenceFormState {
  const educationLevel = preference.educationLevel ?? '';
  return {
    age: preference.age?.toString() ?? '',
    regionCode: preference.regionCode ?? '',
    districtCode: preference.districtCode ?? '',
    workStatus: preference.workStatus ?? '',
    jobSeeking: preference.jobSeeking === null ? '' : preference.jobSeeking ? 'true' : 'false',
    educationLevel,
    enrollmentStatus: educationLevel
      ? (preference.enrollmentStatus ?? legacyEnrollmentStatus(preference.educationStatus))
      : '',
    interests: preference.interests ?? [],
  };
}

function legacyEnrollmentStatus(status: string | null): EnrollmentStatus | '' {
  switch (status) {
    case 'STUDENT':
      return 'ENROLLED';
    case 'ON_LEAVE':
      return 'ON_LEAVE';
    case 'GRADUATED':
      return 'GRADUATED';
    case 'NOT_STUDENT':
    case 'OTHER':
      return 'NOT_APPLICABLE';
    default:
      return '';
  }
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
      educationLevel: form.educationLevel || null,
      enrollmentStatus: form.enrollmentStatus || null,
      interests: form.interests,
    };

    setIsSaving(true);
    try {
      await savePolicyPreference(input);
      navigate('/policies', { replace: true });
    } catch (error) {
      setSaveError(policyErrorMessage(error, '정책 조건을 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page policy-conditions-page">
        <PolicyStateView title="조건 불러오는 중" loading />
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
        <h1>내 정책 조건</h1>
        <Link href="/policies" className="button button--secondary">
          <ArrowLeft size={17} /> 목록으로
        </Link>
      </div>

      <form className="ui-card policy-conditions-form" onSubmit={handleSubmit} noValidate>
        <section className="policy-conditions-section" aria-labelledby="basic-condition-title">
          <div className="policy-conditions-section__heading">
            <span>1</span>
            <div>
              <h2 id="basic-condition-title">기본 조건</h2>
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
                aria-describedby={errors.age ? 'policy-age-error' : undefined}
              />
              {errors.age ? (
                <small className="policy-field__error" id="policy-age-error">
                  {errors.age}
                </small>
              ) : null}
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
                aria-describedby={errors.districtCode ? 'policy-district-error' : undefined}
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
              ) : null}
            </label>
          </div>
        </section>

        <section className="policy-conditions-section" aria-labelledby="current-state-title">
          <div className="policy-conditions-section__heading">
            <span>2</span>
            <div>
              <h2 id="current-state-title">현재 상황</h2>
            </div>
          </div>

          <div className="policy-conditions-grid">
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
              <span>교육 단계</span>
              <select
                value={form.educationLevel}
                onChange={(event) => {
                  const value = event.target.value as EducationLevel | '';
                  const changed = value !== form.educationLevel;
                  updateField('educationLevel', value);
                  if (changed) updateField('enrollmentStatus', '');
                }}
              >
                <option value="">선택하지 않음</option>
                {EDUCATION_LEVEL_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="policy-field">
              <span>현재 학적 상태</span>
              <select
                value={form.enrollmentStatus}
                disabled={!form.educationLevel}
                onChange={(event) =>
                  updateField('enrollmentStatus', event.target.value as EnrollmentStatus | '')
                }
              >
                <option value="">
                  {form.educationLevel ? '선택하지 않음' : '교육 단계를 먼저 선택해 주세요'}
                </option>
                {ENROLLMENT_STATUS_OPTIONS.map((option) => (
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
