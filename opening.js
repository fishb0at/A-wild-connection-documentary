(() => {
const follow = document.querySelector('.follow');
const forest = document.querySelector('.forest');
const scene = document.querySelector('.scene');
let travelling = false;
follow.addEventListener('click', event => {
  if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  event.preventDefault();
  if (travelling) return;
  travelling = true;
  forest.classList.add('travel');
  let advanced = false;
  const advance = () => { if (travelling && !advanced) { advanced = true; (window.romeoScene?.go ?? (url => location.assign(url)))(follow.href); } };
  scene.addEventListener('transitionend', event => {
    if (event.propertyName === 'transform') advance();
  });
  setTimeout(advance, 1050);
});
addEventListener('pageshow', () => {
  travelling = false;
  forest.classList.remove('travel');
});

})();
