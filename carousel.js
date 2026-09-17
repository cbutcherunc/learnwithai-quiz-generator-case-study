(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxTitle = lightbox.querySelector('.lightbox-title');

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
    lightboxImage.alt = '';
  });

  document.querySelectorAll('.journey').forEach((journey, journeyIndex) => {
    const screens = journey.querySelector('.screens');
    const slides = [...screens.children];
    let current = 0;
    let touchStart = null;
    let suppressClick = false;
    screens.id = `journey-slides-${journeyIndex + 1}`;
    journey.setAttribute('aria-roledescription', 'carousel');
    journey.classList.add('is-enhanced');

    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
      <span class="slide-position" aria-hidden="true"></span>
      <div class="slide-dots" role="group" aria-label="Choose a screenshot"></div>
      <div class="slide-arrows">
        <button class="slide-arrow" type="button" data-direction="-1" aria-label="Previous screenshot" aria-controls="${screens.id}">←</button>
        <button class="slide-arrow" type="button" data-direction="1" aria-label="Next screenshot" aria-controls="${screens.id}">→</button>
      </div>
      <span class="sr-only" role="status" aria-live="polite" aria-atomic="true"></span>`;
    screens.after(controls);
    const position = controls.querySelector('.slide-position');
    const status = controls.querySelector('[role="status"]');
    const dots = controls.querySelector('.slide-dots');

    const titles = slides.map(slide => slide.querySelector('figcaption strong').textContent);
    const buttons = slides.map((slide, index) => {
      slide.id = `journey-${journeyIndex + 1}-slide-${index + 1}`;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${slides.length}: ${titles[index]}`);
      // An explicit caption body keeps the two-column layout stable.
      const caption = slide.querySelector('figcaption');
      const body = document.createElement('span');
      [...caption.childNodes].filter(node => node !== caption.querySelector('strong')).forEach(node => body.append(node));
      caption.append(body);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slide-dot';
      button.setAttribute('aria-label', `Show screenshot ${index + 1}: ${titles[index]}`);
      button.setAttribute('aria-controls', screens.id);
      button.addEventListener('click', () => show(index));
      dots.append(button);
      return button;
    });

    function show(index, announce = true) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.hidden = i !== current;
        slide.classList.toggle('entering', i === current && announce && !reducedMotion.matches);
        if (i === current) buttons[i].setAttribute('aria-current', 'step');
        else buttons[i].removeAttribute('aria-current');
      });
      slides[current].querySelector('img').loading = 'eager';
      position.innerHTML = `<b>${String(current + 1).padStart(2, '0')}</b> / ${String(slides.length).padStart(2, '0')}`;
      if (announce) status.textContent = `Screenshot ${current + 1} of ${slides.length}: ${titles[current]}`;
    }

    controls.querySelectorAll('[data-direction]').forEach(button => {
      button.addEventListener('click', () => show(current + Number(button.dataset.direction)));
    });
    journey.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      const focusWasInSlide = screens.contains(document.activeElement);
      show(destinations[event.key]);
      if (focusWasInSlide) slides[current].querySelector('.screen').focus({ preventScroll: true });
    });

    screens.addEventListener('pointerdown', event => {
      suppressClick = false;
      touchStart = event.pointerType === 'touch' && event.isPrimary
        ? { x: event.clientX, y: event.clientY, id: event.pointerId }
        : null;
    });
    screens.addEventListener('pointerup', event => {
      if (!touchStart || event.pointerId !== touchStart.id) return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        suppressClick = true;
        show(current + (dx < 0 ? 1 : -1));
      }
    });
    screens.addEventListener('pointercancel', () => { touchStart = null; });
    screens.addEventListener('click', event => {
      const link = event.target.closest('.screen');
      if (!link) return;
      if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
      // Modified clicks retain the normal full-size image link behavior.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
      event.preventDefault();
      lightboxImage.src = link.href;
      lightboxImage.alt = link.querySelector('img').alt;
      lightboxTitle.textContent = titles[current];
      lightbox.showModal();
    });
    show(0, false);
  });

})();
