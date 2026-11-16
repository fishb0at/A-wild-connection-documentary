(() => {
const locationMenu = document.querySelector('.location-menu');
const locationControl = locationMenu.querySelector('summary');
const scope = window.romeoScene?.signal;
document.addEventListener('click', event => {
  if (locationMenu.open && !locationMenu.contains(event.target)) locationMenu.open = false;
}, {signal: scope});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && locationMenu.open) {
    locationMenu.open = false;
    locationControl.focus();
  }
}, {signal: scope});
locationMenu.querySelector('[aria-current="page"]').addEventListener('click', event => {
  event.preventDefault();
  locationMenu.open = false;
  locationControl.focus();
});
addEventListener('pageshow', () => { locationMenu.open = false; });

})();
