import { ArrowLeft, Bold, ImagePlus, Italic, Link2, List, Save, Underline } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { ApiError } from '../../auth';
import { createCommunityPost, getCommunityPost, updateCommunityPost } from '../api';
import type { CreatePostInput } from '../types';
import '../styles/community.css';

const categoryOptions = ['자유게시판', '정보 공유', '절약 인증', '질문'];

function CommunityPostFormPage() {
  const [, editParams] = useRoute('/community/:postId/edit');
  const [, navigate] = useLocation();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const postId = editParams?.postId ? Number(editParams.postId) : null;
  const [form, setForm] = useState<CreatePostInput>({ category: categoryOptions[0], title: '', content: '', hashtags: [], commentsDisabled: false, commentsHidden: false });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    const controller = new AbortController();
    getCommunityPost(postId, controller.signal)
      .then((post) => { setForm({ category: post.category, title: post.title, content: post.content, hashtags: post.hashtags, commentsDisabled: post.commentsDisabled, commentsHidden: post.commentsHidden }); setHashtags(post.hashtags); if (editorRef.current) editorRef.current.innerHTML = post.content; })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('게시글 정보를 불러오지 못했어요.'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [postId]);

  const exec = (command: string, value?: string) => { editorRef.current?.focus(); document.execCommand(command, false, value); };
  const insertImage = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 삽입할 수 있어요.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('이미지는 한 장당 2MB 이하만 삽입할 수 있어요.'); return; }
    const reader = new FileReader();
    reader.onload = () => { editorRef.current?.focus(); document.execCommand('insertImage', false, String(reader.result)); };
    reader.readAsDataURL(file);
  };
  const addHashtag = () => { const tag = hashtagInput.trim().replace(/^#/, ''); if (!tag || tag.length > 10 || hashtags.length >= 6 || hashtags.includes(tag)) return; setHashtags((current) => [...current, tag]); setHashtagInput(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = editorRef.current?.innerHTML ?? '';
    if (!form.title.trim() || !editorRef.current?.innerText.trim()) { setError('제목과 내용을 입력해 주세요.'); return; }
    setSaving(true); setError(null);
    try { const input = { ...form, content, hashtags, imageUrls: [] }; const saved = postId ? await updateCommunityPost(postId, input) : await createCommunityPost(input); navigate(`/community/${saved.postId}`); }
    catch (reason: unknown) { setError(reason instanceof ApiError ? reason.message : '저장하지 못했어요. 입력 내용을 확인해 주세요.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page"><p className="community-posts__state">게시글 정보를 불러오는 중이에요.</p></div>;
  return <div className="page community">
    <Link className="community-detail__back" href={postId ? `/community/${postId}` : '/community'}><ArrowLeft size={17} /> 커뮤니티로 돌아가기</Link>
    <section className="ui-card community-form-card">
      <div className="page-heading"><div><h1>{postId ? '게시글 수정' : '게시글 작성'}</h1><p>절약 경험과 정보를 다른 회원들과 나눠보세요.</p></div></div>
      <form className="community-form" onSubmit={(event) => void submit(event)}>
        <label>카테고리<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{categoryOptions.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
        <label>제목<input value={form.title} maxLength={200} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="제목을 입력해 주세요" /></label>
        <div className="community-editor-field"><span className="community-form__label">내용</span><div className="community-editor__toolbar"><button type="button" aria-label="굵게" onClick={() => exec('bold')}><Bold size={16} /></button><button type="button" aria-label="기울임" onClick={() => exec('italic')}><Italic size={16} /></button><button type="button" aria-label="밑줄" onClick={() => exec('underline')}><Underline size={16} /></button><button type="button" aria-label="목록" onClick={() => exec('insertUnorderedList')}><List size={16} /></button><button type="button" aria-label="링크 삽입" onClick={() => { const url = window.prompt('링크 주소를 입력해 주세요'); if (url) exec('createLink', url); }}><Link2 size={16} /></button><button type="button" aria-label="본문에 이미지 삽입" onClick={() => imageInputRef.current?.click()}><ImagePlus size={16} /></button><input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) insertImage(file); event.currentTarget.value = ''; }} /></div><div ref={editorRef} className="community-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder="내용을 입력해 주세요. 이미지 버튼으로 본문 안에 이미지를 넣을 수 있어요." /></div>
        <div className="community-comment-options" aria-label="댓글 설정"><span className="community-form__label">댓글 설정</span><label className="community-comment-option"><input type="checkbox" checked={Boolean(form.commentsDisabled)} onChange={(event) => setForm((current) => ({ ...current, commentsDisabled: event.target.checked }))} />댓글 중지</label><label className="community-comment-option"><input type="checkbox" checked={Boolean(form.commentsHidden)} onChange={(event) => setForm((current) => ({ ...current, commentsHidden: event.target.checked }))} />댓글 숨기기</label></div>
        <section className="community-hashtags" aria-label="해시태그"><div className="community-form__label">해시태그 <small>{hashtags.length}/6</small></div>{hashtags.length > 0 && <div className="community-hashtags__tags">{hashtags.map((tag) => <span className="community-hashtag" key={tag}>#{tag}<button type="button" aria-label={`${tag} 태그 삭제`} onClick={() => setHashtags((current) => current.filter((value) => value !== tag))}>×</button></span>)}</div>}{hashtags.length < 6 && <input className="community-hashtags__input" value={hashtagInput} maxLength={10} onChange={(event) => setHashtagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addHashtag(); } }} placeholder="태그 입력 후 Enter" />}<small className="community-form__hint">10자 이내 · Enter로 추가</small></section>
        {error && <p className="community-form__error" role="alert">{error}</p>}
        <div className="community-form__actions"><Link className="button button--soft" href={postId ? `/community/${postId}` : '/community'}>취소</Link><button className="button button--primary" type="submit" disabled={saving}><Save size={16} /> {saving ? '저장 중...' : '저장하기'}</button></div>
      </form>
    </section>
  </div>;
}

export default CommunityPostFormPage;
