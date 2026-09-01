import {
  Bold,
  ImagePlus,
  Italic,
  Link2,
  List,
  MessageSquareText,
  Save,
  Trash2,
  Underline,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  answerAdminPost,
  deleteAdminPost,
  getAdminPost,
  getAdminPosts,
  updateAdminPost,
  type CommunityPost,
} from '../api';
import type { CommunityPostUpdateRequest } from '../types';

const categories = ['자유게시판', '정보 공유', '절약 인증', '질문'];

function toUpdateRequest(post: CommunityPost): CommunityPostUpdateRequest {
  return {
    category: post.category,
    title: post.title,
    content: post.content,
    hashtags: post.hashtags,
    imageUrls: post.imageUrls,
    imageAlignment: post.imageAlignment,
    commentsDisabled: post.commentsDisabled,
    commentsHidden: post.commentsHidden,
  };
}

export default function AdminCommunityManagement() {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [draft, setDraft] = useState<CommunityPostUpdateRequest | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    if (editorRef.current && draft) editorRef.current.innerHTML = draft.content;
  }, [selectedPost?.postId]);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      setPosts((await getAdminPosts()).content);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '게시글 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function openPost(postId: number) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const post = await getAdminPost(postId);
      setSelectedPost(post);
      setDraft(toUpdateRequest(post));
      setHashtags(post.hashtags.join(', '));
      setAnswer('');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '게시글 상세를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || !draft) return;
    const content = editorRef.current?.innerHTML.trim() ?? '';
    if (!editorRef.current?.innerText.trim()) {
      setError('게시글 본문을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateAdminPost(selectedPost.postId, {
        ...draft,
        category: draft.category.trim(),
        title: draft.title.trim(),
        content,
        hashtags: hashtags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setSelectedPost(updated);
      setDraft(toUpdateRequest(updated));
      setHashtags(updated.hashtags.join(', '));
      setPosts((current) =>
        current.map((post) => (post.postId === updated.postId ? updated : post)),
      );
      setMessage('게시글을 수정했습니다.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '게시글을 수정하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  function executeEditorCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function insertImage(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 삽입할 수 있습니다.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('이미지는 한 장당 2MB 이하만 삽입할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      editorRef.current?.focus();
      document.execCommand('insertImage', false, String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function removePost() {
    if (!selectedPost || !window.confirm('이 게시글을 삭제할까요? 삭제 후 복구할 수 없습니다.'))
      return;
    setError(null);
    try {
      await deleteAdminPost(selectedPost.postId);
      setPosts((current) => current.filter((post) => post.postId !== selectedPost.postId));
      setSelectedPost(null);
      setDraft(null);
      setMessage('게시글을 삭제했습니다.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '게시글을 삭제하지 못했습니다.',
      );
    }
  }

  async function submitAnswer() {
    if (!selectedPost || answer.trim() === '') return;
    setError(null);
    try {
      await answerAdminPost(selectedPost.postId, answer.trim());
      setAnswer('');
      setMessage('관리자 답변을 등록했습니다.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : '답변을 등록하지 못했습니다.',
      );
    }
  }

  return (
    <section className="admin-workspace">
      <div className="admin-workspace__header">
        <div>
          <h2>커뮤니티 관리</h2>
          <p>게시글 상세 내용을 확인하고 수정하거나 삭제합니다.</p>
        </div>
        <button type="button" onClick={() => void loadPosts()}>
          새로고침
        </button>
      </div>
      {error && (
        <p className="admin-feedback admin-feedback--error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="admin-feedback admin-feedback--success" role="status">
          {message}
        </p>
      )}
      <div className="admin-community-layout">
        <div className="admin-post-list">
          {posts.map((post) => (
            <button
              type="button"
              className={`ui-card admin-post ${selectedPost?.postId === post.postId ? 'is-selected' : ''}`}
              key={post.postId}
              onClick={() => void openPost(post.postId)}
            >
              <span>{post.category}</span>
              <h3>{post.title}</h3>
              <p>
                {post.nickname ?? post.author} · {new Date(post.createdAt).toLocaleString()}
              </p>
              <small>
                댓글 {post.commentCount} · 좋아요 {post.likeCount}
              </small>
            </button>
          ))}
          {!loading && posts.length === 0 && (
            <p className="admin-empty">관리할 게시글이 없습니다.</p>
          )}
        </div>
        {selectedPost && draft ? (
          <form className="ui-card admin-edit-form admin-post-detail" onSubmit={savePost}>
            <div className="admin-detail-heading">
              <div>
                <MessageSquareText size={20} />
                <h3>게시글 상세</h3>
              </div>
              <span>{selectedPost.authorRole}</span>
            </div>
            <div className="admin-readonly-grid">
              <p>
                <span>작성자</span>
                <strong>{selectedPost.nickname ?? selectedPost.author}</strong>
              </p>
              <p>
                <span>작성일</span>
                <strong>{new Date(selectedPost.createdAt).toLocaleString()}</strong>
              </p>
            </div>
            <div className="admin-form-grid">
              <label>
                카테고리
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {categories.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-form-grid__wide">
                제목
                <input
                  required
                  maxLength={200}
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </label>
              <div className="admin-form-grid__wide admin-editor-field">
                <span className="admin-editor-label">본문</span>
                <div className="admin-editor-toolbar" aria-label="본문 편집 도구">
                  <button
                    type="button"
                    aria-label="굵게"
                    onClick={() => executeEditorCommand('bold')}
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="기울임"
                    onClick={() => executeEditorCommand('italic')}
                  >
                    <Italic size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="밑줄"
                    onClick={() => executeEditorCommand('underline')}
                  >
                    <Underline size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="목록"
                    onClick={() => executeEditorCommand('insertUnorderedList')}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="링크 삽입"
                    onClick={() => {
                      const url = window.prompt('링크 주소를 입력해 주세요.');
                      if (url) executeEditorCommand('createLink', url);
                    }}
                  >
                    <Link2 size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="본문에 이미지 삽입"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) insertImage(file);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>
                <div
                  ref={editorRef}
                  className="admin-rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  data-placeholder="게시글 내용을 입력해 주세요."
                />
              </div>
              <label className="admin-form-grid__wide">
                해시태그
                <input
                  value={hashtags}
                  onChange={(event) => setHashtags(event.target.value)}
                  placeholder="절약, 생활비, 질문"
                />
              </label>
            </div>
            <div className="admin-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={draft.commentsDisabled}
                  onChange={(event) =>
                    setDraft({ ...draft, commentsDisabled: event.target.checked })
                  }
                />{' '}
                댓글 작성 차단
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.commentsHidden}
                  onChange={(event) => setDraft({ ...draft, commentsHidden: event.target.checked })}
                />{' '}
                댓글 숨김
              </label>
            </div>
            {selectedPost.category === '질문' && (
              <div className="admin-answer">
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="관리자 답변을 입력하세요"
                  maxLength={1000}
                />
                <button
                  type="button"
                  className="button button--soft"
                  onClick={() => void submitAnswer()}
                >
                  답변 등록
                </button>
              </div>
            )}
            <div className="admin-form-actions">
              <button
                className="button button--danger"
                type="button"
                onClick={() => void removePost()}
              >
                <Trash2 size={16} /> 삭제
              </button>
              <button className="button button--primary" type="submit" disabled={saving}>
                <Save size={16} /> {saving ? '저장 중...' : '변경 저장'}
              </button>
            </div>
          </form>
        ) : (
          <div className="ui-card admin-selection-placeholder">
            <MessageSquareText size={28} />
            <p>상세 내용을 확인할 게시글을 선택해 주세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
