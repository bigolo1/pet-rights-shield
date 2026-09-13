const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-nav');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.querySelectorAll('[data-delay]').forEach((el) => {
  el.style.setProperty('--delay', `${el.dataset.delay}ms`);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

const form = document.getElementById('case-form');
const status = document.getElementById('form-status');
const copyButton = document.getElementById('copy-case');

function caseText() {
  const data = new FormData(form);
  return [
    '[동편 × 쉴드 반려동물 의료분쟁 검토 요청]',
    '',
    `보호자 성함: ${data.get('guardian') || ''}`,
    `연락처: ${data.get('phone') || ''}`,
    `회신 이메일: ${data.get('email') || ''}`,
    `반려동물: ${data.get('pet') || ''} / ${data.get('species') || ''}`,
    `동물병원: ${data.get('hospital') || ''}`,
    `주요 진료일: ${data.get('treatmentDate') || ''}`,
    `도움이 필요한 부분: ${data.get('help') || ''}`,
    `긴급 여부: ${data.get('urgent') ? '긴급' : '일반'}`,
    '',
    '[사건 개요]',
    data.get('summary') || ''
  ].join('\n');
}

function validateForm() {
  if (!form.reportValidity()) {
    status.textContent = '필수 항목을 확인해 주세요.';
    return false;
  }
  return true;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  const data = new FormData(form);
  const urgent = data.get('urgent') ? '[긴급] ' : '';
  const subject = `${urgent}반려동물 의료분쟁 검토 요청 - ${data.get('guardian')} / ${data.get('pet')}`;
  status.textContent = '작성한 내용으로 이메일 앱을 여는 중입니다.';
  window.location.href = `mailto:bigolo1@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(caseText())}`;
});

copyButton.addEventListener('click', async () => {
  if (!validateForm()) return;
  try {
    await navigator.clipboard.writeText(caseText());
    status.textContent = '상담 내용을 복사했습니다. 이메일 본문에 붙여넣어 주세요.';
  } catch {
    status.textContent = '복사하지 못했습니다. 내용을 직접 선택해 복사해 주세요.';
  }
});
