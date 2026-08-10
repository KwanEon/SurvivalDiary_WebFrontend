import { ExternalLink, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { PolicyOfficialLinkType } from '../types';

export interface PolicyExternalLinkRequest {
  title: string;
  url: string;
  kind: 'application' | 'reference';
  officialLinkType: PolicyOfficialLinkType;
}

interface PolicyExternalLinkDialogProps {
  request: PolicyExternalLinkRequest;
  onClose: () => void;
}

interface DialogCopy {
  heading: string;
  description: string;
  addressLabel: string;
  notice: string;
  buttonLabel: string;
}

export function isAllowedPolicyExternalUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function dialogCopy(request: PolicyExternalLinkRequest): DialogCopy {
  if (request.kind === 'reference') {
    return {
      heading: '정책 안내 페이지로 이동할까요?',
      description: `${request.title} 관련 참고 정보가 등록된 외부 페이지예요. 실제 신청 사이트와 다를 수 있어요.`,
      addressLabel: '참고 링크 주소',
      notice:
        '정책 안내나 관련 기관 정보를 확인하는 참고 링크이며 실제 신청 경로임을 보장하지 않아요.',
      buttonLabel: '참고 링크 열기',
    };
  }

  switch (request.officialLinkType) {
    case 'APPLICATION_CANDIDATE':
      return {
        heading: '신청 페이지 후보로 이동할까요?',
        description: `${request.title} 신청 주소로 등록된 페이지예요. 최신 공고와 신청 조건을 최종 확인해 주세요.`,
        addressLabel: '신청 사이트 주소',
        notice: '실제 접수 화면 대신 상세 안내 화면이 열릴 수 있어요.',
        buttonLabel: '신청 페이지 열기',
      };
    case 'LOGIN_REQUIRED':
      return {
        heading: '로그인이 필요한 서비스입니다',
        description: `${request.title} 신청 내용을 확인하려면 제공기관 계정 로그인이 필요할 수 있어요.`,
        addressLabel: '로그인 사이트 주소',
        notice: '로그인 후 신청 메뉴가 바로 열리지 않으면 정책명을 다시 검색해 주세요.',
        buttonLabel: '로그인 페이지 열기',
      };
    case 'INSTITUTION_HOME':
      return {
        heading: '기관 홈페이지로 이동할까요?',
        description: `${request.title} 전용 신청 주소가 아닌 기관 홈페이지예요. 이동 후 정책명을 검색해 주세요.`,
        addressLabel: '기관 홈페이지 주소',
        notice: '기관 홈페이지에서 정책명이나 담당 기관을 검색해 신청 경로를 찾아야 해요.',
        buttonLabel: '기관 홈페이지 열기',
      };
    default:
      return {
        heading: '신청 사이트로 이동할까요?',
        description: `${request.title} 신청 조건과 최신 공고를 제공기관 사이트에서 최종 확인해 주세요.`,
        addressLabel: '신청 사이트 주소',
        notice: '제공기관이 등록한 주소이며 기관 홈페이지나 로그인 화면이 열릴 수 있어요.',
        buttonLabel: '신청 사이트 열기',
      };
  }
}

function PolicyExternalLinkDialog({ request, onClose }: PolicyExternalLinkDialogProps) {
  const openLinkRef = useRef<HTMLAnchorElement>(null);
  const copy = dialogCopy(request);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    openLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="policy-external-dialog__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="policy-external-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-external-dialog-title"
      >
        <button
          className="policy-external-dialog__close"
          type="button"
          aria-label="외부 링크 안내 닫기"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <span className="policy-external-dialog__icon" aria-hidden="true">
          <ExternalLink size={28} />
        </span>
        <h2 id="policy-external-dialog-title">{copy.heading}</h2>
        <p className="policy-external-dialog__description">{copy.description}</p>

        <div className="policy-external-dialog__address">
          <span>{copy.addressLabel}</span>
          <strong>{request.url}</strong>
        </div>

        <div className="policy-external-dialog__notice">
          <Info size={19} aria-hidden="true" />
          <p>버튼을 누르면 생존일기를 벗어나 새 탭으로 이동합니다. {copy.notice}</p>
        </div>

        <div className="policy-external-dialog__actions">
          <button className="button button--secondary" type="button" onClick={onClose}>
            정책 상세로 돌아가기
          </button>
          <a
            ref={openLinkRef}
            className="button button--primary"
            href={request.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            {copy.buttonLabel} <ExternalLink size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}

export default PolicyExternalLinkDialog;
