import { render, createVNode } from "inferno";
import VNodeFlags from 'inferno-vnode-flags';

const comparer = document.createElement("div");

function innerHTML(HTML) {
  comparer.innerHTML = HTML;
  return comparer.innerHTML;
}

describe("Basic use-cases", () => {
  let container;

  beforeEach(function() {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(function() {
    render(null, container);
    container.innerHTML = "";
    document.body.removeChild(container);
  });

  it("Should be possible to render and remove single div", () => {
    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        "2",
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">2</div>')
    );

    render(null, container);

    expect(innerHTML(container.innerHTML)).toEqual("");
  });

  it("Should be possible to render and unmount single div with 2 text nodes as children", () => {
    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["1", "2"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">12</div>')
    );

    render(null, container);

    expect(innerHTML(container.innerHTML)).toEqual("");
  });

  it("Should be possible to render and unmount text nodes #1", () => {
    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["1", "2", "3"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">123</div>')
    );

    render(null, container);

    expect(innerHTML(container.innerHTML)).toEqual("");

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["1", "3"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">13</div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["1", "3", "4"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">134</div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["4"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">4</div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        ["4", "4"],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test">44</div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        null,
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test"></div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        "",
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test"></div>')
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "1st-test",
        [],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML('<div class="1st-test"></div>')
    );
  });

  it("Should unmount and mount correctly when doing nonKeyed", () => {
    let div1mountCount = 0;
    let div1unMountCount = 0;
    const div1 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "1",
      "one",
      null,
      null,
      function(n) {
        if (n === null) {
          div1unMountCount++;
        } else {
          div1mountCount++;
        }
      }
    );

    let div2mountCount = 0;
    let div2unMountCount = 0;
    const div2 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "2",
      "second",
      null,
      null,
      function(n) {
        if (n === null) {
          div2unMountCount++;
        } else {
          div2mountCount++;
        }
      }
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [div1, "2", div2],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent"><div class="1">one</div>2<div class="2">second</div></div>'
      )
    );

    expect(div1mountCount).toEqual(1);
    expect(div2mountCount).toEqual(1);

    render(null, container);

    expect(div2unMountCount).toEqual(1);
    expect(div2unMountCount).toEqual(1);

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, null, div1, null, null, div2],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent"><div class="1">one</div><div class="2">second</div></div>'
      )
    );
    expect(div1mountCount).toEqual(2);
    expect(div2mountCount).toEqual(2);

    div1mountCount = 0;
    div1unMountCount = 0;

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, div1, div1, null, div1, div2],
        null,
        null,
        null
      ),
      container
    );
    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent"><div class="1">one</div><div class="1">one</div><div class="1">one</div><div class="2">second</div></div>'
      )
    );
    expect(div1mountCount).toEqual(2); // 2 added
    expect(div1unMountCount).toEqual(0); // 0 removed

    div1unMountCount = 0;

    render(null, container);

    expect(div1unMountCount).toEqual(3);

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, null, div1, null, null, div2],
        null,
        null,
        null
      ),
      container
    );

    div1mountCount = 0;
    div1unMountCount = 0;
    div2unMountCount = 0;
    div2mountCount = 0;

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, div1, null, div1, null, null, div2],
        null,
        null,
        null
      ),
      container
    );
    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent">' +
          '<div class="1">one</div>' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          "</div>"
      )
    );

    expect(div1mountCount).toEqual(2);
    expect(div1unMountCount).toEqual(1);
    expect(div2mountCount).toEqual(1);
    expect(div2unMountCount).toEqual(1);
  });

  it("Should unmount and mount correctly when doing nonKeyed with nested arrays", () => {
    let div1mountCount = 0;
    let div1unMountCount = 0;
    const div1 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "1",
      "one",
      null,
      null,
      function(n) {
        if (n === null) {
          div1unMountCount++;
        } else {
          div1mountCount++;
        }
      }
    );

    let div2mountCount = 0;
    let div2unMountCount = 0;
    const div2 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "2",
      "second",
      null,
      null,
      function(n) {
        if (n === null) {
          div2unMountCount++;
        } else {
          div2mountCount++;
        }
      }
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [[[null, [[[["1"], false]]]]]],
        null,
        null,
        null
      ),
      container
    );

    expect(container.innerHTML).toEqual('<div class="parent">1</div>');

    render(null, container);

    div1mountCount = 0;
    div1unMountCount = 0;
    div2unMountCount = 0;
    div2mountCount = 0;

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, [div1, div1, div1], null, null, [div2, div2, div2], null],
        null,
        null,
        null
      ),
      container
    );
    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent">' +
          '<div class="1">one</div>' +
          '<div class="1">one</div>' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          '<div class="2">second</div>' +
          '<div class="2">second</div>' +
          "</div>"
      )
    );

    expect(div1unMountCount).toEqual(0);
    expect(div2unMountCount).toEqual(0);
    expect(div1mountCount).toEqual(3);
    expect(div2mountCount).toEqual(3);

    div1mountCount = 0;
    div1unMountCount = 0;
    div2unMountCount = 0;
    div2mountCount = 0;

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, [div1, div1], [div2, div2, div2], null, null],
        null,
        null,
        null
      ),
      container
    );
    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent">' +
          '<div class="1">one</div>' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          '<div class="2">second</div>' +
          '<div class="2">second</div>' +
          "</div>"
      )
    );

    expect(div1mountCount).toEqual(0);
    expect(div1unMountCount).toEqual(1);
    expect(div2mountCount).toEqual(3);
    expect(div2unMountCount).toEqual(3);
  });

  it("Should be possible to swap vNodes freely", () => {
    let div1mountCount = 0;
    let div1unMountCount = 0;
    const div1 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "1",
      "one",
      null,
      null,
      function(n) {
        if (n === null) {
          div1unMountCount++;
        } else {
          div1mountCount++;
        }
      }
    );

    let div2mountCount = 0;
    let div2unMountCount = 0;
    const div2 = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      "2",
      "second",
      null,
      null,
      function(n) {
        if (n === null) {
          div2unMountCount++;
        } else {
          div2mountCount++;
        }
      }
    );

    const array1 = [div1, div2];

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, array1, array1, div1, null],
        null,
        null,
        null
      ),
      container
    );
    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent">' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          '<div class="1">one</div>' +
          "</div>"
      )
    );

    expect(div1mountCount).toEqual(3);
    expect(div2mountCount).toEqual(2);

    array1.reverse();

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        "parent",
        [null, array1, array1, div1, null],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        '<div class="parent">' +
          '<div class="2">second</div>' +
          '<div class="1">one</div>' +
          '<div class="2">second</div>' +
          '<div class="1">one</div>' +
          '<div class="1">one</div>' +
          "</div>"
      )
    );
    // It will call ref because ref function is different, but thats ok it goes through patch anyway
  });
});
