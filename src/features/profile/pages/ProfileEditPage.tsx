import { ArrowLeft, LoaderCircle, Save, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import ProfileAvatar from '../../../shared/components/ProfileAvatar';
import { useAuth } from '../../auth/AuthContext';
import { deleteProfileImage, updateProfile, uploadProfileImage } from '../api';
import '../styles/profile.css';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageSize = 5 * 1024 * 1024;

function yesterdayValue() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function ProfileEditPage() {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const changeImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    if (!image) return;
    setError('');

    if (!allowedImageTypes.has(image.type)) {
      setError('JPG, PNG, WEBP, GIF 형식의 이미지만 등록할 수 있어요.');
      event.target.value = '';
      return;
    }
    if (image.size > maxImageSize) {
      setError('프로필 사진은 5MB 이하로 선택해 주세요.');
      event.target.value = '';
      return;
    }

    setImageBusy(true);
    try {
      const currentUser = await uploadProfileImage(image);
      updateUser(currentUser);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : '프로필 사진을 저장하지 못했어요.',
      );
    } finally {
      setImageBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async () => {
    if (!window.confirm('현재 프로필 사진을 삭제할까요?')) return;
    setImageBusy(true);
    setError('');
    try {
      const currentUser = await deleteProfileImage();
      updateUser(currentUser);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : '프로필 사진을 삭제하지 못했어요.',
      );
    } finally {
      setImageBusy(false);
    }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    setError('');

    if (!trimmedName) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (trimmedName.length > 50) {
      setError('이름은 50자 이하로 입력해 주세요.');
      return;
    }
    if (trimmedPhone && !/^[0-9+\- ]+$/.test(trimmedPhone)) {
      setError('휴대폰 번호 형식을 확인해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const currentUser = await updateProfile({
        name: trimmedName,
        phone: trimmedPhone || null,
        birthDate: birthDate || null,
        gender: gender === 'MALE' || gender === 'FEMALE' ? gender : null,
        region: user.region,
        bio: user.bio,
      });
      updateUser(currentUser);
      setLocation('/profile');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '회원 정보를 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page profile-edit-page">
      <div className="page-heading profile-edit-page__heading">
        <div>
          <p className="page-heading__eyebrow">Edit profile</p>
          <h1>회원 정보 수정</h1>
          <p>App과 같은 회원 정보와 프로필 사진을 관리할 수 있어요.</p>
        </div>
        <Link className="button button--secondary" href="/profile">
          <ArrowLeft size={17} /> 마이페이지로
        </Link>
      </div>

      <form className="profile-edit-layout" onSubmit={(event) => void saveProfile(event)}>
        <section className="ui-card profile-photo-card">
          <div className="profile-photo-card__preview">
            <ProfileAvatar
              className="profile-avatar profile-avatar--edit"
              imageUrl={user.profileImageUrl}
              name={user.name}
            />
            {imageBusy && (
              <span className="profile-photo-card__loading" aria-label="프로필 사진 처리 중">
                <LoaderCircle className="spin" size={28} />
              </span>
            )}
          </div>
          <div>
            <h2>프로필 사진</h2>
            <p>JPG, PNG, WEBP, GIF 형식을 5MB 이하로 등록할 수 있어요.</p>
          </div>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => void changeImage(event)}
          />
          <div className="profile-photo-card__actions">
            <button
              className="button button--soft"
              type="button"
              disabled={imageBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={17} /> {user.profileImageUrl ? '새 사진으로 변경' : '사진 등록'}
            </button>
            {user.profileImageUrl && (
              <button
                className="button profile-button--danger"
                type="button"
                disabled={imageBusy}
                onClick={() => void removeImage()}
              >
                <Trash2 size={17} /> 현재 사진 삭제
              </button>
            )}
          </div>
        </section>

        <section className="ui-card profile-form-card">
          <div className="profile-section__heading">
            <div>
              <span>Personal information</span>
              <h2>기본 정보</h2>
            </div>
          </div>

          {error && (
            <div className="profile-message profile-message--error" role="alert">
              {error}
            </div>
          )}

          <div className="profile-form-grid">
            <label className="profile-field">
              <span>이름</span>
              <input
                value={name}
                maxLength={50}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="profile-field">
              <span>이메일</span>
              <input value={user.email ?? ''} readOnly />
              <small>로그인 이메일은 변경할 수 없어요.</small>
            </label>
            <label className="profile-field">
              <span>휴대폰 번호</span>
              <input
                value={phone}
                maxLength={20}
                inputMode="tel"
                placeholder="010-0000-0000"
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="profile-field">
              <span>생년월일</span>
              <input
                type="date"
                value={birthDate}
                min="1900-01-01"
                max={yesterdayValue()}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <label className="profile-field profile-field--wide">
              <span>성별</span>
              <select value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">선택 안 함</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </label>
          </div>

          <button
            className="button button--primary profile-form-card__submit"
            type="submit"
            disabled={saving || imageBusy}
          >
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            {saving ? '저장 중...' : '회원 정보 저장'}
          </button>
        </section>
      </form>
    </div>
  );
}

export default ProfileEditPage;
