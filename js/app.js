// Hash router. Each view renders into #view and may return a cleanup function.
(function (TA) {
  'use strict';
  const routes = {
    '#/': TA.views.dashboard,
    '#/fibonacci': TA.views.fibLesson,
    '#/fibonacci/exercise': TA.views.fibExercise,
    '#/liquidity': TA.views.liqLesson,
    '#/liquidity/exercise': TA.views.liqExercise,
    '#/mentor': TA.views.mentor,
  };
  let cleanup = null;
  TA.route = function () {
    const hash = routes[location.hash] ? location.hash : '#/';
    if (cleanup) { cleanup(); cleanup = null; }
    const view = document.getElementById('view');
    view.innerHTML = ''; view.scrollTop = 0; window.scrollTo(0, 0);
    document.body.dataset.route = hash;
    TA.renderNav(hash);
    cleanup = routes[hash](view) || null;
  };
  window.addEventListener('hashchange', TA.route);
  TA.route();
})(window.TA);
