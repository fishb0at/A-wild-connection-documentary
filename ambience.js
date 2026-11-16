(() => {
  if (window.romeoScene) return;
  const music = new Audio('assets/hymn-to-the-dawn.mp3');
  const step = new Audio('assets/snow-step.mp3');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let scope = new AbortController(), moving = false, frame, stepTimer;
  music.loop = true;
  music.volume = 0;
  step.volume = .38;
  const cached = new Map();
  function prepare(url) {
    const key = new URL(url, location.href).pathname;
    if (!cached.has(key)) cached.set(key, fetch(key).then(r => {
      if (!r.ok) throw Error('Scene unavailable');
      return r.text();
    }).catch(() => null));
    return cached.get(key);
  }
  function fade(target) {
    cancelAnimationFrame(frame);
    const from = music.volume, start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / 450);
      music.volume = from + (target - from) * t;
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function mix() {
    const voice = document.querySelector('.note-chapter:not([hidden]) .encounter-audio audio');
    fade(voice && !voice.paused ? .18 : .26);
  }
  function begin() {
    if (music.paused) music.play().then(mix).catch(() => {});
  }
  function stopSteps() {
    clearTimeout(stepTimer);
    step.pause();
  }
  function footsteps() {
    stopSteps();
    step.currentTime = 0;
    if (step.paused) step.play().catch(() => {});
    stepTimer = setTimeout(stopSteps, 1250);
  }
  function bind() {
    const voice = document.querySelector('.wolf-page');
    for (const clip of document.querySelectorAll('.encounter-audio audio')) {
      for (const event of ['play','playing','pause','ended']) clip.addEventListener(event, mix, {signal:scope.signal});
    }
    mix();
    if (document.querySelector('.forest')) prepare('wolf.html');
    else if (voice) prepare('footprints.html');
  }
  function sheet(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    // Load the next screen's styles before applying them.
    link.media = 'not all';
    const ready = new Promise(resolve => {link.onload = () => resolve(link); link.onerror = () => resolve(link);});
    document.head.append(link);
    return ready;
  }
  async function go(value) {
    if (moving) return;
    moving = true;
    const url = new URL(value, location.href);
    try {
      const html = await prepare(url);
      if (!html) throw Error('Scene unavailable');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const oldStyles = [...document.querySelectorAll('link[rel="stylesheet"]')];
      const nextStyles = await Promise.all([...doc.querySelectorAll('link[rel="stylesheet"]')].map(link => sheet(new URL(link.getAttribute('href'), url))));
      document.querySelector('.note-chapter:not([hidden]) .encounter-audio audio')?.pause();
      scope.abort();
      scope = new AbortController();
      const scripts = [...doc.body.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).filter(src => src !== 'ambience.js');
      doc.body.querySelectorAll('script').forEach(s => s.remove());
      history.pushState(null, '', url);
      document.documentElement.classList.toggle('from-trail', url.searchParams.get('from') === 'trail');
      document.documentElement.classList.toggle('backtrack', url.searchParams.get('from') === 'lake');
      document.documentElement.dataset.romeoEntry = url.hash.slice(1);
      document.title = doc.title;
      nextStyles.forEach(link => { link.media = 'all'; });
      oldStyles.forEach(link => link.remove());
      document.body.className = doc.body.className;
      document.body.replaceChildren(...doc.body.childNodes);
      scrollTo(0,0);
      document.querySelector('main')?.setAttribute('tabindex','-1');
      document.querySelector('main')?.focus({preventScroll:true});
      moving = false;
      for (const src of scripts) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.body.append(script);
      }
      bind();
    } catch { location.assign(url); }
  }
  window.romeoScene = {go, get signal(){return scope.signal;}};
  document.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('.start, .follow, .back, .location-menu a, .pager a, .note-body .next');
    if (!link || link.matches('[aria-current]')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !/\/(?:index|footprints|wolf|0[2-5])(?:\.html)?$/.test(url.pathname)) return;
    const stage = document.querySelector('.wolf-page');
    if (stage?.showChapterByHash && /\/wolf(?:\.html)?$/.test(url.pathname)) {
      event.preventDefault();
      stage.showChapterByHash(url.hash);
      return;
    }
    if (link.matches('.start')) begin();
    if (link.matches('.follow') && !document.querySelector('.forest.travel')) footsteps();
    if (link.matches('.follow,.back') && !reduce.matches) return;
    event.preventDefault();
    go(link.href);
  }, {capture:true});
  addEventListener('popstate', () => location.reload());
  addEventListener('pagehide', () => {music.pause();stopSteps();});
  if (document.querySelector('.start')) prepare('footprints.html');
  bind();
})();
