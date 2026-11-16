(() => {
const notes = document.querySelector('.field-notes');
const wolfHotspot = document.querySelector('.wolf-hotspot');
wolfHotspot.addEventListener('click', () => {
  notes.open = true;
  notes.querySelector('summary').focus({preventScroll:true});
});
notes.addEventListener('toggle', () => wolfHotspot.setAttribute('aria-expanded', String(notes.open)));
const players = [...notes.querySelectorAll('.encounter-audio')];
function pauseClips() { players.forEach(player => player.querySelector('audio').pause()); }
for (const player of players) {
  const clip = player.querySelector('audio'), play = player.querySelector('button'), timer = player.querySelector('.audio-time');
  const start = Number(player.dataset.start ?? 0), end = Number(player.dataset.end ?? 23);
  let frame;
  const clock = t => { const seconds = Math.round(t); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); };
  function sync() {
    cancelAnimationFrame(frame);
    const elapsed = clip.ended ? end - start : Math.max(0, Math.min(end - start, Math.floor(clip.currentTime - start)));
    timer.textContent = clock(elapsed) + ' / ' + clock(end - start);
    if (clip.currentTime >= end) clip.pause();
    play.textContent = clip.paused ? (elapsed >= end - start ? '↻ Replay excerpt' : '▶ Play excerpt') : '⏸ Pause excerpt';
    if (!clip.paused) frame = requestAnimationFrame(sync);
  }
  play.addEventListener('click', async () => {
    if (!clip.paused) return clip.pause();
    try {
      if (clip.ended || clip.currentTime < start || clip.currentTime >= end - .15) clip.currentTime = start;
      await clip.play();
      if (!notes.open || player.closest('.note-chapter').hidden) clip.pause();
    } catch {
      if (notes.open) timer.textContent = 'Audio unavailable · please try again';
    }
  });
  for (const event of ['playing','pause','timeupdate','ended']) clip.addEventListener(event, sync);
}
notes.addEventListener('toggle', () => { if (!notes.open) pauseClips(); });
addEventListener('pagehide', pauseClips);

const page = document.querySelector('.wolf-page');
const noteBody = notes.querySelector('.note-body');
const sections = [null, ...notes.querySelectorAll('.note-chapter')];
const menu = document.querySelector('.location-menu');
const hashes = ['', '', '#friendship', '#coexistence', '#disappearance', '#coming-home'];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 1;
const artStage = page.querySelector('.wolf-stage');
const artLayers = [
  artStage.querySelector('.wolf-background'),
  artStage.querySelector('.friendship-art'),
  artStage.querySelector('.coexistence-art'),
  artStage.querySelector('.later-art'),
  artStage.querySelector('.memorial-art')
];
const artFor = chapter => artLayers[chapter - 1];
let artTurn = 0;
function setArt(chapter, instant) {
  const incoming = artFor(chapter);
  const outgoing = artStage.querySelector('.art-incoming, .art-active');
  if (incoming === outgoing) return;
  const turn = ++artTurn;
  artLayers.forEach(art => art.getAnimations().forEach(animation => animation.cancel()));
  artLayers.forEach(art => art.classList.remove('art-active','art-outgoing','art-incoming'));
  if (outgoing && !instant && !reducedMotion.matches) {
    outgoing.classList.add('art-outgoing');
    incoming.classList.add('art-incoming');
    const animation = incoming.animate([{opacity:0},{opacity:1}], {duration:580,easing:'ease-in-out',fill:'both'});
    animation.finished.then(() => {
      if (turn !== artTurn) return;
      incoming.classList.replace('art-incoming','art-active');
      outgoing.classList.remove('art-outgoing');
      animation.cancel();
    }).catch(() => {});
  } else incoming.classList.add('art-active');
}
const initialIndex = hashes.indexOf(location.hash);
setArt(initialIndex >= 2 ? initialIndex : 1, true);
artStage.dataset.artManaged = '';

function markChapter(chapter, instant) {
  if (chapter === current) return;
  current = chapter;
  page.classList.toggle('chapter-two', chapter === 2);
  page.dataset.chapter = chapter;
  setArt(chapter, instant);
  menu.querySelector('[aria-current="page"]')?.removeAttribute('aria-current');
  menu.querySelector(`a[href="wolf.html${hashes[chapter]}"]`).setAttribute('aria-current', 'page');
  document.title = String(chapter).padStart(2, '0') + ' — ' + sections[chapter].querySelector('h1').textContent + ' · Romeo';
  const url = new URL(location.href);
  url.hash = hashes[chapter];
  history.replaceState(history.state, '', url);
}
let turning = false;
let lastWheel = -Infinity;
let wheelIntent = 0;
let wheelDistance = 0;
async function showChapter(chapter, immediate = false) {
  notes.open = true;
  menu.open = false;
  if (chapter === current || turning) return;
  turning = true;
  const direction = chapter > current ? 1 : -1;
  const animate = !immediate && !reducedMotion.matches;
  const leaving = sections[current];
  pauseClips();
  if (animate && !artFor(chapter).complete) await artFor(chapter).decode().catch(() => {});
  if (animate) {
    await leaving.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:`translateY(${-18 * direction}px)`}],{duration:200,easing:'ease-in',fill:'forwards'}).finished;
    leaving.getAnimations().forEach(animation => animation.cancel());
  }
  leaving.hidden = true;
  const entering = sections[chapter];
  entering.hidden = false;
  noteBody.scrollTop = 0;
  markChapter(chapter, immediate);
  if (animate) {
    await entering.animate([{opacity:0,transform:`translateY(${23 * direction}px)`},{opacity:1,transform:'translateY(0)'}],{duration:580,easing:'cubic-bezier(.2,.72,.24,1)'}).finished;
  }
  turning = false;
  wheelIntent = 0;
  lastWheel = performance.now();
}
noteBody.addEventListener('wheel', event => {
  if (!notes.open || event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  const now = performance.now();
  const direction = Math.sign(event.deltaY);
  if (now - lastWheel > 180) {
    const atBottom = noteBody.scrollHeight - noteBody.scrollTop - noteBody.clientHeight <= 3;
    const atTop = noteBody.scrollTop <= 3;
    wheelIntent = current < 5 && atBottom && direction > 0 ? 1 : current > 1 && atTop && direction < 0 ? -1 : 0;
    wheelDistance = 0;
  }
  lastWheel = now;
  if (turning) { event.preventDefault(); return; }
  if (wheelIntent && direction !== wheelIntent) wheelIntent = 0;
  if (!wheelIntent) return;
  event.preventDefault();
  wheelDistance += Math.abs(event.deltaY) * (event.deltaMode ? 16 : 1);
  if (wheelDistance >= 18) {
    const target = current + wheelIntent;
    wheelIntent = 0;
    showChapter(target);
  }
},{passive:false});
const chapterFor = hash => Math.max(1, hashes.indexOf(hash));
page.showChapterByHash = hash => showChapter(chapterFor(hash));
if (chapterFor(location.hash) > 1) showChapter(chapterFor(location.hash), true);

const folder = document.querySelector('.case-file');
const folderButton = folder.querySelector('.folder-button');
const poster = folder.querySelector('.poster-reveal');
let posterTimer;
folderButton.addEventListener('click', () => {
  const open = folder.classList.toggle('is-open');
  folderButton.setAttribute('aria-expanded', String(open));
  folderButton.setAttribute('aria-label', (open ? 'Close' : 'Open') + ' the Romeo case file');
  poster.setAttribute('aria-hidden', String(!open));
  poster.inert = !open;
  clearTimeout(posterTimer);
  if (open) posterTimer = setTimeout(() => {
    if (!folder.closest('.note-chapter').hidden && notes.open) {
      poster.scrollIntoView({block:'nearest',behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    }
  }, reducedMotion.matches ? 0 : 690);
});
})();
