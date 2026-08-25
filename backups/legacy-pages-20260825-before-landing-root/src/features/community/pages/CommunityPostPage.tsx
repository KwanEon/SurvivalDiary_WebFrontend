import { ArrowLeft, Bookmark, Heart, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { createCommunityComment, deleteCommunityComment, deleteCommunityPost, getCommunityComments, getCommunityPost, toggleCommunityBookmark, toggleCommunityLike } from '../api';
import type { CommunityComment, CommunityPost } from '../types';
import '../styles/community.css';

function CommunityPostPage() {
  const [, params] = useRoute('/community/:postId');
  const [, navigate] = useLocation();
  const postId = Number(params?.postId);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getCommunityPost(postId, controller.signal), getCommunityComments(postId, controller.signal)])
      .then(([loadedPost, loadedComments]) => { setPost(loadedPost); setComments(loadedComments); })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('게시글을 불러오지 못했어요.'); });
    return () => controller.abort();
  }, [postId]);

  if (error) return <div className="page"><p className="community-posts__state">{error}</p></div>;
  if (!post) return <div className="page"><p className="community-posts__state">게시글을 불러오는 중이에요.</p></div>;

  const updatePost = async (action: (id: number) => Promise<CommunityPost>) => setPost(await action(postId));
  const submitComment = async () => { if (!comment.trim()) return; const created = await createCommunityComment(postId, comment.trim()); setComments((current) => [...current, created]); setComment(''); };

  return <div className="page community">
    <Link className="community-detail__back" href="/community"><ArrowLeft size={17} /> 커뮤니티로 돌아가기</Link>
    <article className="ui-card community-detail">
      <header className="community-detail__header">
        <div><span>{post.category}</span><h1>{post.title}</h1><p>{post.nickname ?? post.author} · {new Date(post.createdAt).toLocaleString()}</p></div>
        {post.owner && <div className="community-detail__actions">
          <Link className="button button--soft" href={`/community/${post.postId}/edit`}>수정</Link>
          <button className="button button--soft" type="button" onClick={async () => { if (window.confirm('게시글을 삭제할까요?')) { await deleteCommunityPost(postId); navigate('/community'); } }}>삭제</button>
        </div>}
      </header>
      <div className="community-detail__content" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="community-detail__toolbar"><button type="button" onClick={() => void updatePost(toggleCommunityLike)}><Heart size={17} fill={post.liked ? 'currentColor' : 'none'} /> 좋아요 {post.likeCount}</button><button type="button" onClick={() => void updatePost(toggleCommunityBookmark)}><Bookmark size={17} fill={post.bookmarked ? 'currentColor' : 'none'} /> 북마크 {post.bookmarkCount}</button></div>
    </article>
    <section className="ui-card community-comments">
      <h2>댓글 {comments.length}</h2>
      {!post.commentsHidden && comments.map((item) => <div className="community-comment" key={item.commentId}><div><strong>{item.nickname ?? item.author}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></div><p>{item.content}</p>{item.owner && <button className="community-comment__delete" type="button" onClick={async () => { await deleteCommunityComment(item.commentId); setComments((current) => current.filter((value) => value.commentId !== item.commentId)); }}>삭제</button>}</div>)}
      {!post.commentsDisabled && !post.commentsHidden && <form className="community-comment-form" onSubmit={(event) => { event.preventDefault(); void submitComment(); }}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 남겨보세요" maxLength={1000} /><button className="button button--primary" type="submit"><Send size={16} /> 등록</button></form>}
    </section>
  </div>;
}

export default CommunityPostPage;
