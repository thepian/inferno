(function() {
  "use strict";
  var elem = document.getElementById("app");
  Inferno.options.recyclingEnabled = true; // Advanced optimisation

  perfMonitor.startFPSMonitor();
  perfMonitor.startMemMonitor();
  perfMonitor.initProfiler("view update");

  var createVNode = Inferno.createVNode;
  var VNodeFlags = Inferno.VNodeFlags;

  var arrow = createVNode(
    VNodeFlags.HtmlElement,
    "div",
    "arrow",
    null,
    null,
    null,
    null,
    true
  );

  function renderBenchmark(dbs) {
    var length = dbs.length;
    var databases = new Array(length);

    for (var i = 0; i < length; i++) {
      var db = dbs[i];
      var lastSample = db.lastSample;
      var children = new Array(7);

      children[0] = createVNode(
        VNodeFlags.HtmlElement,
        "td",
        "dbname",
        db.dbname,
        null,
        null,
        null,
        true
      );
      children[1] = createVNode(
        VNodeFlags.HtmlElement,
        "td",
        "query-count",
        createVNode(
          VNodeFlags.HtmlElement,
          "span",
          lastSample.countClassName,
          lastSample.nbQueries,
          null,
          null,
          null,
          true
        ),
        null,
        null,
        null,
        true
      );

      for (var i2 = 0; i2 < 5; i2++) {
        var query = lastSample.topFiveQueries[i2];

        children[i2 + 2] = createVNode(
          66,
          "td",
          query.elapsedClassName,
          [
            createVNode(
              VNodeFlags.HtmlElement,
              "div",
              "foo",
              query.formatElapsed,
              null,
              null,
              null,
              true
            ),
            createVNode(
              66,
              "div",
              "popover left",
              [
                createVNode(
                  VNodeFlags.HtmlElement,
                  "div",
                  "popover-content",
                  query.query,
                  null,
                  null,
                  null,
                  true
                ),
                arrow
              ],
              null,
              null,
              null,
              true
            )
          ],
          null,
          null,
          null,
          true
        );
      }
      databases[i] = createVNode(
        66,
        "tr",
        null,
        children,
        null,
        null,
        null,
        true
      );
    }

    Inferno.render(
      createVNode(
        VNodeFlags.HtmlElement,
        "table",
        "table table-striped latest-data",
        createVNode(66, "tbody", null, databases, null, null, null, true),
        null,
        null,
        null,
        true
      ),
      elem
    );
  }

  function render() {
    var dbs = ENV.generateData(false).toArray();
    perfMonitor.startProfile("view update");
    renderBenchmark(dbs);
    perfMonitor.endProfile("view update");
    setTimeout(render, ENV.timeout);
  }
  render();
})();
