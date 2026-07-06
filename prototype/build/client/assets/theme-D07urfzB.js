function e(){}function t(e,t){window.umami?.track(e,t)}var n=`sunrays-theme`,r=`(function () {
  try {
    var pref = localStorage.getItem('${n}');
    var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;function i(){if(typeof localStorage>`u`)return`system`;let e=localStorage.getItem(n);return e===`light`||e===`dark`?e:`system`}function a(e){e===`system`?localStorage.removeItem(n):localStorage.setItem(n,e);let t=e===`dark`||e===`system`&&window.matchMedia(`(prefers-color-scheme: dark)`).matches;document.documentElement.classList.toggle(`dark`,t)}export{t as a,e as i,i as n,r,a as t};