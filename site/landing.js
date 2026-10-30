// Turns the three audience sections into tabs routed by #patients, #pcp and #specialists.
// Without this script every section stays visible and the tab links simply jump to them.
(function () {
  var ids = ["patients", "pcp", "specialists"];
  var list = document.querySelector(".tabs");
  if (!list) return;
  document.documentElement.classList.add("js");
  list.setAttribute("role", "tablist");

  var tabs = ids.map(function (id) { return document.getElementById("tab-" + id); });
  var panels = ids.map(function (id) { return document.getElementById(id); });

  tabs.forEach(function (tab, i) {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", ids[i]);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("tabindex", "0");
  });

  function select(id, focus) {
    var at = ids.indexOf(id);
    if (at < 0) at = 0;
    tabs.forEach(function (tab, i) {
      var on = i === at;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.setAttribute("tabindex", on ? "0" : "-1");
      panels[i].hidden = !on;
    });
    if (focus) tabs[at].focus();
  }

  list.addEventListener("click", function (e) {
    var tab = e.target.closest('[role="tab"]');
    if (!tab) return;
    e.preventDefault();
    var id = tab.getAttribute("aria-controls");
    history.replaceState(null, "", "#" + id);
    select(id, false);
  });

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  list.addEventListener("keydown", function (e) {
    var at = tabs.indexOf(document.activeElement);
    if (at < 0) return;
    var next = e.key === "ArrowRight" ? at + 1 : e.key === "ArrowLeft" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? ids.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    var id = ids[(next + ids.length) % ids.length];
    history.replaceState(null, "", "#" + id);
    select(id, true);
  });

  window.addEventListener("hashchange", function () { select(location.hash.slice(1), false); });
  select(location.hash.slice(1), false);
})();
