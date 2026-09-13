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
const submitButton = form.querySelector('.form-submit');

function validateForm() {
  if (!form.reportValidity()) {
    status.textContent = '필수 항목을 확인해 주세요.';
    return false;
  }
  return true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const data = new FormData(form);
  const urgent = data.get('urgent') ? '[긴급] ' : '';
  const subject = `${urgent}반려동물 의료분쟁 검토 요청 - ${data.get('guardian')} / ${data.get('pet')}`;
  const originalButtonContent = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.textContent = '상담 내용을 전송하고 있습니다…';
  status.textContent = '잠시만 기다려 주세요.';

  try {
    const response = await fetch('https://formsubmit.co/ajax/bigolo1@naver.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        _honey: '',
        email: data.get('email'),
        '보호자 성함': data.get('guardian'),
        '연락처': data.get('phone'),
        '회신 이메일': data.get('email'),
        '반려동물': `${data.get('pet')} / ${data.get('species')}`,
        '동물병원': data.get('hospital'),
        '주요 진료일': data.get('treatmentDate'),
        '도움이 필요한 부분': data.get('help'),
        '긴급 여부': data.get('urgent') ? '긴급' : '일반',
        '사건 개요': data.get('summary')
      })
    });

    if (!response.ok) throw new Error(`Submission failed: ${response.status}`);

    form.reset();
    status.textContent = '상담 내용이 전송되었습니다. 확인 후 입력하신 연락처로 안내드리겠습니다.';
  } catch {
    status.textContent = '전송하지 못했습니다. 잠시 후 다시 시도하거나 bigolo1@naver.com으로 직접 문의해 주세요.';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});
