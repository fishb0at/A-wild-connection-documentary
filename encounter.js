const journey = document.querySelector('.journey');
const clamp = value => Math.max(0, Math.min(1, value));
let frame = 0;
function update() {
  frame = 0;
  const bounds = journey.getBoundingClientRect();
  const desktop = matchMedia("(min-width: 721px)").matches;
  const distance = desktop ? scrollY : innerHeight * .63 - bounds.top;
  const progress = clamp(distance / (desktop ? 305 : Math.max(220, innerHeight * .64)));
  journey.style.setProperty('--progress', progress);
  journey.style.setProperty('--zoom', 1 + progress * .22);
  for (let i = 1; i <= 3; i++) {
    journey.style.setProperty('--track' + i, clamp((progress - (i - 1) * .21) / .18));
  }
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule);
update();
