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

const fieldNames = {
  guardian: '보호자 성함',
  phone: '연락처',
  email: '회신 받을 이메일',
  pet: '반려동물 이름',
  species: '동물 종류',
  hospital: '문제가 발생한 동물병원',
  treatmentDate: '주요 진료일',
  help: '현재 가장 필요한 도움',
  summary: '사건 개요',
  consent: '개인정보 제공 및 이메일 전송 동의'
};

function fieldContainer(field) {
  if (field.type === 'radio') return field.closest('fieldset');
  return field.closest('label');
}

function errorHost(field, container) {
  if (field.type === 'checkbox') return container.querySelector('span') || container;
  return container;
}

function errorMessage(field) {
  const label = fieldNames[field.name] || '이 항목';
  if (field.validity.typeMismatch) return `${label}: 올바른 형식으로 입력해 주세요.`;
  if (field.validity.valueMissing) {
    return field.type === 'checkbox'
      ? `${label}가 필요합니다.`
      : `${label}: 필수 항목입니다.`;
  }
  return `${label}에 입력한 내용을 확인해 주세요.`;
}

function clearFieldError(field) {
  const container = fieldContainer(field);
  if (!container) return;
  container.classList.remove('has-error');
  container.querySelector('.field-error')?.remove();
  form.querySelectorAll(`[name="${field.name}"]`).forEach((item) => {
    item.removeAttribute('aria-invalid');
    item.removeAttribute('aria-describedby');
  });
}

function showFieldError(field) {
  const container = fieldContainer(field);
  if (!container) return;
  const errorId = `error-${field.name}`;

  container.classList.add('has-error');
  form.querySelectorAll(`[name="${field.name}"]`).forEach((item) => {
    item.setAttribute('aria-invalid', 'true');
    item.setAttribute('aria-describedby', errorId);
  });

  if (!container.querySelector('.field-error')) {
    const message = document.createElement('span');
    message.className = 'field-error';
    message.id = errorId;
    message.textContent = errorMessage(field);
    errorHost(field, container).append(message);
  }
}

function validateForm() {
  form.querySelectorAll('[aria-invalid="true"]').forEach(clearFieldError);
  const invalidFields = [...form.querySelectorAll(':invalid')]
    .filter((field, index, fields) => fields.findIndex((item) => item.name === field.name) === index);

  if (!invalidFields.length) return true;

  invalidFields.forEach(showFieldError);
  status.className = 'form-status is-error';
  status.textContent = '빨간색으로 표시된 항목을 확인해 주세요.';
  invalidFields[0].focus();
  return false;
}

form.addEventListener('input', (event) => {
  if (event.target.validity?.valid) clearFieldError(event.target);
});

form.addEventListener('change', (event) => {
  if (event.target.validity?.valid) clearFieldError(event.target);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  const data = new FormData(form);
  const urgent = data.get('urgent') ? '[긴급] ' : '';
  const subject = `${urgent}반려동물 의료분쟁 검토 요청 - ${data.get('guardian')} / ${data.get('pet')}`;
  const originalButtonContent = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.textContent = '상담 내용을 전송하고 있습니다…';
  status.className = 'form-status';
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

    const result = await response.json().catch(() => null);
    if (!response.ok || String(result?.success).toLowerCase() !== 'true') {
      throw new Error(result?.message || `Submission failed: ${response.status}`);
    }

    form.reset();
    status.className = 'form-status is-success';
    status.textContent = '상담 내용이 전송되었습니다. 확인 후 입력하신 연락처로 안내드리겠습니다.';
  } catch {
    status.className = 'form-status is-error';
    status.textContent = '전송하지 못했습니다. 잠시 후 다시 시도하거나 bigolo1@naver.com으로 직접 문의해 주세요.';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});
