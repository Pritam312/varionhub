(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ============================================================
     AMBIENT BACKGROUND — constellation canvas + pointer parallax
     ============================================================ */
  (() => {
    const canvas = $('#bgCanvas');
    const context = canvas?.getContext('2d');
    const still = reduceMotion.matches;

    // --- Pointer parallax (feeds the --mx / --my custom properties) ---
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (finePointer.matches && !still) {
      let queued = false;
      let nextX = 0;
      let nextY = 0;

      const applyParallax = () => {
        queued = false;
        document.documentElement.style.setProperty('--mx', nextX.toFixed(3));
        document.documentElement.style.setProperty('--my', nextY.toFixed(3));
      };

      window.addEventListener('pointermove', (event) => {
        nextX = (event.clientX / window.innerWidth - 0.5) * 2;
        nextY = (event.clientY / window.innerHeight - 0.5) * 2;
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(applyParallax);
        }
      }, { passive: true });
    }

    if (!canvas || !context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pointer = { x: -9999, y: -9999, active: false };
    let width = 0;
    let height = 0;
    let nodes = [];
    let frame = null;

    const COLORS = [
      [24, 213, 232],
      [139, 92, 246],
      [56, 189, 248]
    ];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(Math.min(84, Math.max(26, (width * height) / 22000)));
      nodes = Array.from({ length: target }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.6,
        color: COLORS[index % COLORS.length]
      }));
    };

    const step = () => {
      context.clearRect(0, 0, width, height);
      const linkDistance = width < 720 ? 92 : 124;
      const linkDistanceSq = linkDistance * linkDistance;

      for (const node of nodes) {
        if (!still) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;

          if (pointer.active) {
            const dx = pointer.x - node.x;
            const dy = pointer.y - node.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq < 32400 && distanceSq > 0.01) {
              const push = (1 - Math.sqrt(distanceSq) / 180) * 0.6;
              node.x -= (dx / Math.sqrt(distanceSq)) * push;
              node.y -= (dy / Math.sqrt(distanceSq)) * push;
            }
          }
        }

        const [r, g, b] = node.color;
        context.beginPath();
        context.fillStyle = `rgba(${r},${g},${b},0.55)`;
        context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        context.fill();
      }

      context.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > linkDistanceSq) continue;
          const alpha = (1 - Math.sqrt(distanceSq) / linkDistance) * 0.16;
          context.strokeStyle = `rgba(126,196,226,${alpha.toFixed(3)})`;
          context.beginPath();
          context.moveTo(nodes[i].x, nodes[i].y);
          context.lineTo(nodes[j].x, nodes[j].y);
          context.stroke();
        }
      }
    };

    const loop = () => {
      step();
      frame = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (still || frame !== null) return;
      frame = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frame === null) return;
      window.cancelAnimationFrame(frame);
      frame = null;
    };

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        if (still) step();
      }, 180);
    }, { passive: true });

    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener('pointerleave', () => { pointer.active = false; });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reduceMotion.addEventListener?.('change', () => {
      if (reduceMotion.matches) {
        stop();
        step();
      } else {
        start();
      }
    });

    build();
    step();
    start();
  })();

  /* ============================================================
     TEAM PROFILES
     Add, remove or edit entries in this array only.
     photo : path relative to this page, e.g. "assets/team/priya.jpg"
             Leave as "" to show the initials avatar instead.
     tags  : short expertise labels shown under the biography.
     link  : optional profile URL (LinkedIn, personal site, ...).
     ============================================================ */
  const TEAM = [
    { name: '[Full name]', role: 'Founder & Managing Director', photo: '', tags: ['Domain & ecosystem', 'Partnerships'], bio: '[Two or three sentences: the domain you know best, what you have built, and the part of societal enablement you are driving at VarionHub.]', link: '' },
    { name: '[Full name]', role: 'Chief Technology Officer', photo: '', tags: ['Agentic infrastructure', 'Platform architecture'], bio: '[Two or three sentences covering your technology and infrastructure background, and how you are shaping the i-way.]', link: '' },
    { name: '[Full name]', role: 'Head — Skills & Workforce', photo: '', tags: ['Workforce enablement', 'New job profiles'], bio: '[Two or three sentences on your work in capability building, training and the creation of new job profiles.]', link: '' },
    { name: '[Full name]', role: 'Head — Agriculture & Rural Ecosystem', photo: '', tags: ['Agriculture', 'FPO & rural enterprise'], bio: '[Two or three sentences on your experience with farmers, producer organisations and rural value chains.]', link: '' },
    { name: '[Full name]', role: 'Head — MSME & Energy', photo: '', tags: ['MSME enablement', 'Energy'], bio: '[Two or three sentences on your work with small enterprises, industrial clusters and local energy systems.]', link: '' },
    { name: '[Full name]', role: 'Innovation & Ecosystem Partnerships', photo: '', tags: ['Startup enablement', 'Investor readiness'], bio: '[Two or three sentences on mentoring early-stage teams and helping them reach investors and market.]', link: '' }
  ];

  const teamGrid = null; // profiles hidden until TEAM array is populated
  if (teamGrid) {
    const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));

    const initials = (value) => value
      .replace(/[\[\]]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    teamGrid.innerHTML = TEAM.map((member) => {
      const photo = member.photo ? `<img src="${esc(member.photo)}" alt="${esc(member.name)}" loading="lazy">` : '';
      const fallback = member.photo
        ? '<span class="ph hide">Photo forthcoming</span>'
        : `<span class="initials" aria-hidden="true">${esc(initials(member.name || ''))}</span>`;
      const tags = (member.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join('');
      const link = member.link ? `<a class="lnk" href="${esc(member.link)}" target="_blank" rel="noopener">Profile &#8599;</a>` : '';

      return `<article class="person reveal">
        <div class="portrait">${photo}${fallback}</div>
        <div class="person-body">
          <h3>${esc(member.name)}</h3>
          <p class="role">${esc(member.role)}</p>
          <p class="bio">${esc(member.bio)}</p>
          <div class="ptags">${tags}</div>
          ${link}
        </div>
      </article>`;
    }).join('');

    $$('.portrait img', teamGrid).forEach((img) => {
      img.addEventListener('error', () => {
        img.remove();
        img.parentElement.querySelector('.ph')?.classList.remove('hide');
      });
    });
  }

  // Mobile navigation
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  if (menuBtn && navLinks) {
    const setMenu = (open) => {
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    $$('a', navLinks).forEach((link) => link.addEventListener('click', () => setMenu(false)));

    document.addEventListener('click', (event) => {
      if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) setMenu(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) setMenu(false);
    });
  }

  // Reveal-on-scroll, with a no-JS/reduced-motion fallback.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13 });
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('visible'));
  }

  // Capability modal
  const modalData = {
    innovators: {
      title: 'Innovators',
      intro: 'Young ventures and startups we mentor, connect and take to market — so good ideas reach the people who need them.',
      points: [
        ['Lab to market', 'We sharpen the proposition and get early-stage teams ready for investors and the market.'],
        ['Investment enablement', 'Helping unlock the investment, then hand-holding through the evolution that follows.'],
        ['Market access', 'Opening routes into the connected ecosystems we help design and grow.'],
        ['Built to grow', 'Support so they succeed individually and grow bigger as part of this ecosystem.']
      ]
    },
    digital: {
      title: 'Digital solutions',
      intro: 'The agentic i-way — connective infrastructure where many strong digital solutions plug in, cooperate and get discovered.',
      points: [
        ['Agentic i-way', 'Digital infrastructure that pulls existing and emerging solutions together into one useful ecosystem.'],
        ['AI orchestration', 'Agentic orchestration so solutions work together across a whole journey, not in isolation.'],
        ['Identity & payments', 'Digital identity, payments and direct market access the people in the ecosystem can rely on.'],
        ['Open by design', 'Open APIs and shared layers — not another walled garden competing to own the end user.']
      ]
    },
    domain: {
      title: 'Domain expertise',
      intro: 'Deep knowledge inside the sectors we build for, so the ecosystem starts from real needs rather than assumptions.',
      points: [
        ['Agriculture', 'Farmers and producer organisations connected to services, finance, markets and useful information.'],
        ['Skills', 'Capability as the first infrastructure for meaningful roles in digital workplaces and local economies.'],
        ['Energy', 'More accessible, responsive and smarter local energy ecosystems underpinning every other vertical.'],
        ['MSME', 'Helping smaller enterprises access capabilities, partners, finance and digital pathways.']
      ]
    },
    livelihoods: {
      title: 'New livelihoods',
      intro: 'Our mandate: the creation of new job profiles that elevate the application of human intelligence in daily life.',
      points: [
        ['Identify', 'The new work that connected physical and digital ecosystems create.'],
        ['Shape', 'Practical, real job profiles and pathways for local talent.'],
        ['Equip', 'People to apply judgement, creativity and care in their everyday work.'],
        ['Precede', 'Digital and AI enablement with workforce readiness — not after it.']
      ]
    }
  };

  const detailModal = $('#detailModal');
  const modalPanel = detailModal ? $('.modal-panel', detailModal) : null;
  const modalClose = $('#modalClose');
  const modalTitle = $('#modalTitle');
  const modalIntro = $('#modalIntro');
  const modalGrid = $('#modalGrid');
  let modalReturnFocus = null;

  const getFocusable = () => modalPanel ? $$('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modalPanel) : [];

  function openModal(key, trigger = null) {
    const data = modalData[key];
    if (!data || !detailModal || !modalPanel) return;

    modalReturnFocus = trigger || document.activeElement;
    modalTitle.textContent = data.title;
    modalIntro.textContent = data.intro;
    modalGrid.innerHTML = data.points
      .map(([title, body]) => `<div class="modal-point"><strong>${title}</strong><span>${body}</span></div>`)
      .join('');

    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalClose?.focus();
  }

  function closeModal() {
    if (!detailModal) return;
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
    modalReturnFocus = null;
  }

  $$('[data-modal]').forEach((el) => {
    el.addEventListener('click', () => openModal(el.dataset.modal, el));
  });
  modalClose?.addEventListener('click', closeModal);
  detailModal?.addEventListener('click', (event) => {
    if (event.target === detailModal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (!detailModal?.classList.contains('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Custom interest dropdown
  let validateInterest = () => true;
  let resetInterestUI = () => {};
  const interestWrap = $('#interestSelect');
  const interestNative = $('#cfInterest');

  if (interestWrap && interestNative) {
    const trigger = $('#interestTrigger');
    const valueEl = $('#interestValue');
    const menu = $('#interestMenu');
    const options = $$('.select-option', menu);
    let activeIndex = -1;

    const isOpen = () => interestWrap.classList.contains('open');

    const setActive = (index, scroll = true) => {
      activeIndex = index;
      options.forEach((option, i) => {
        option.classList.toggle('is-active', i === index);
        option.setAttribute('aria-selected', String(interestNative.value === option.dataset.value));
      });
      if (scroll && index >= 0) options[index].scrollIntoView({ block: 'nearest' });
    };

    const openMenu = () => {
      interestWrap.classList.add('open');
      interestWrap.classList.remove('error', 'shake');
      trigger.setAttribute('aria-expanded', 'true');
      const current = options.findIndex((option) => option.dataset.value === interestNative.value);
      setActive(current >= 0 ? current : 0);
    };

    const closeMenu = (refocus = false) => {
      interestWrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      setActive(-1, false);
      if (refocus) trigger.focus();
    };

    const choose = (option) => {
      interestNative.value = option.dataset.value;
      valueEl.textContent = option.dataset.value;
      valueEl.classList.remove('is-placeholder');
      options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
      interestWrap.classList.remove('error', 'shake');
      closeMenu(true);
    };

    trigger.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
    options.forEach((option, index) => {
      option.addEventListener('click', () => choose(option));
      option.addEventListener('mouseenter', () => setActive(index, false));
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !interestWrap.contains(event.target)) closeMenu();
    });

    interestWrap.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen()) openMenu();
          else setActive(Math.min(activeIndex + 1, options.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen()) openMenu();
          else setActive(Math.max(activeIndex - 1, 0));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isOpen()) openMenu();
          else if (activeIndex >= 0) choose(options[activeIndex]);
          break;
        case 'Escape':
          if (isOpen()) {
            event.preventDefault();
            closeMenu(true);
          }
          break;
        case 'Tab':
          if (isOpen()) closeMenu();
          break;
        default:
          break;
      }
    });

    validateInterest = () => {
      if (interestNative.value) return true;
      interestWrap.classList.add('error', 'shake');
      window.setTimeout(() => interestWrap.classList.remove('shake'), 500);
      trigger.focus();
      return false;
    };

    resetInterestUI = () => {
      valueEl.textContent = 'Select your interest';
      valueEl.classList.add('is-placeholder');
      interestNative.value = '';
      options.forEach((option) => option.setAttribute('aria-selected', 'false'));
      interestWrap.classList.remove('open', 'error', 'shake');
      trigger.setAttribute('aria-expanded', 'false');
    };
  }

  // Contact form — uses FormSubmit's JSON/AJAX endpoint and only shows success after a verified response.
  const contactForm = $('#contactForm');
  if (contactForm) {
    const formStatus = $('#formStatus');
    const sendBtn = $('#cfSend');
    const honey = $('.form-honeypot', contactForm);

    const setStatus = (type, html) => {
      formStatus.className = `form-status show ${type}`;
      formStatus.innerHTML = html;
    };

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (honey?.value) return;
      if (!validateInterest()) return;
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      sendBtn.disabled = true;
      setStatus('sending', '<span class="spinner" aria-hidden="true"></span><span><strong>Sending your message…</strong><br>Please hold on a moment.</span>');

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
          credentials: 'omit'
        });

        const payload = await response.json().catch(() => null);
        const success = response.ok && payload && (payload.success === true || payload.success === 'true');

        if (!success) throw new Error('The form provider did not confirm the submission.');

        setStatus('ok', '<span class="status-check" aria-hidden="true">✓</span><span><strong>Message sent successfully.</strong><br>Thank you for reaching out — our team will get back to you shortly.</span>');
        contactForm.reset();
        resetInterestUI();
      } catch (error) {
        console.error('Contact form submission failed:', error);
        setStatus('err', '<span class="status-error" aria-hidden="true">!</span><span><strong>We could not confirm your message.</strong><br>Please try again or email <a href="mailto:hello@varionhub.com">hello@varionhub.com</a>.</span>');
      } finally {
        sendBtn.disabled = false;
      }
    });
  }

  // Vertical cards — click to expand detail drawer below grid
  const verticalData = {
    energy: {
      title: 'Energy',
      color: '#18d5e8',
      body: '<p>Make clean energy easier to adopt, operate and manage.</p>'
    },
    agriculture: {
      title: 'Agriculture',
      color: '#10d9b0',
      body: `
        <p class="vd-bengali" lang="bn">চাষ থেকে বাজার পর্যন্ত — হিসাব, লেনদেন আর সহযোগিতা এক জায়গায়।</p>
        <p class="vd-translation">From the field to the market: records, transactions and support in one place.</p>
        <p>An FPO handles many everyday tasks: keeping member records, arranging seeds and fertiliser, collecting produce, recording weight and grade, finding buyers, tracking sales and paying farmers. We want to make that work easier to manage.</p>
        <p>Our focus includes farmer and member records; crop and input planning; produce collection, weighing and stock; buyer orders and sale prices; farmer payments; and the paperwork needed for banks, schemes and compliance. Clear records, local language and on-ground support are central to making it useful.</p>
      `
    },
    ai: {
      title: 'AI Enablement & Adoption',
      color: '#8b5cf6',
      body: '<p>Help people and organisations put AI to work in everyday processes.</p>'
    },
    msme: {
      title: 'MSME',
      color: '#4f8ef7',
      body: '<p>Help growing businesses improve operations and reach more customers.</p>'
    }
  };

  const drawer = $('#verticalsDrawer');
  let activeVertical = null;

  $$('.vertical-card').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.dataset.vertical;
      const isOpen = card.getAttribute('aria-expanded') === 'true';

      // Reset all cards
      $$('.vertical-card').forEach((c) => c.setAttribute('aria-expanded', 'false'));

      if (isOpen || !drawer) {
        // Close
        if (drawer) drawer.hidden = true;
        activeVertical = null;
        return;
      }

      // Open this card
      card.setAttribute('aria-expanded', 'true');
      activeVertical = key;
      const data = verticalData[key];
      drawer.style.setProperty('--drawer-color', data.color);
      drawer.innerHTML = `
        <div class="vd-inner">
          <div class="vd-header">
            <span class="vd-title">${data.title}</span>
            <button class="vd-close" aria-label="Close detail">&times;</button>
          </div>
          <div class="vd-body">${data.body}</div>
        </div>
      `;
      drawer.hidden = false;
      drawer.querySelector('.vd-close').addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.hidden = true;
        card.setAttribute('aria-expanded', 'false');
        activeVertical = null;
      });
      // Scroll drawer into view smoothly
      drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  // Mission pillar carousel
  const capSlider = $('#capSlider');
  const capTrack = $('#capTrack');
  if (capSlider && capTrack) {
    const slides = $$('.cap-slide', capTrack);
    const total = slides.length;
    const INTERVAL = 4800;
    let index = 0;
    let timer = null;
    let paused = false;
    let touchX = null;

    const stopAuto = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const render = () => {
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      capSlider.dataset.active = String(index + 1).padStart(2, '0');
    };

    const scheduleAuto = () => {
      stopAuto();
      if (paused || reduceMotion.matches || total < 2) return;
      timer = window.setTimeout(() => goTo(index + 1), INTERVAL);
    };

    const goTo = (next) => {
      index = (next + total) % total;
      render();
      if (!paused) scheduleAuto();
    };

    capSlider.addEventListener('mouseenter', () => {
      paused = true;
      stopAuto();
    });
    capSlider.addEventListener('mouseleave', () => {
      paused = false;
      scheduleAuto();
    });
    capSlider.addEventListener('focusin', () => {
      paused = true;
      stopAuto();
    });
    capSlider.addEventListener('focusout', (event) => {
      if (!capSlider.contains(event.relatedTarget)) {
        paused = false;
        scheduleAuto();
      }
    });

    capSlider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(total - 1);
      }
    });

    capTrack.addEventListener('touchstart', (event) => {
      touchX = event.touches[0].clientX;
      paused = true;
      stopAuto();
    }, { passive: true });

    capTrack.addEventListener('touchend', (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1));
      touchX = null;
      paused = false;
      scheduleAuto();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else if (!paused) scheduleAuto();
    });

    reduceMotion.addEventListener?.('change', scheduleAuto);
    render();
    scheduleAuto();
  }
})();
