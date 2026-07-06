var e=`sunrays-theme`,t=`(function () {
  try {
    var pref = localStorage.getItem('${e}');
    var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;function n(){if(typeof localStorage>`u`)return`system`;let t=localStorage.getItem(e);return t===`light`||t===`dark`?t:`system`}function r(t){t===`system`?localStorage.removeItem(e):localStorage.setItem(e,t);let n=t===`dark`||t===`system`&&window.matchMedia(`(prefers-color-scheme: dark)`).matches;document.documentElement.classList.toggle(`dark`,n)}export{n,t as r,r as t};