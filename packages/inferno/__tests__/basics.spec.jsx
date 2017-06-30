import { render, createVNode } from "inferno";
import VNodeFlags from 'inferno-vnode-flags';

const comparer = document.createElement("div");
function innerHTML(HTML) {
  comparer.innerHTML = HTML;
  return comparer.innerHTML;
}

describe("Basic JSX", () => {
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

  it("Should work correctly when removing nodes", () => {
    function Functional({ children }) {
      return (
        <div>
          {children}
        </div>
      );
    }

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        null,
        [
          <Functional>
            {["1", "2", "3"]}
          </Functional>,
          <Functional>
            {["4", "5"]}
          </Functional>
        ],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML("<div><div>123</div><div>45</div></div>")
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        null,
        [
          <Functional>
            {["3", "4", "5"]}
          </Functional>,
          <Functional>
            {["6", "7"]}
          </Functional>
        ],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML("<div><div>345</div><div>67</div></div>")
    );

    render(
      createVNode(
        VNodeFlags.HtmlElement,
        "div",
        null,
        [
          <Functional>
            {["3", "4", "5"]}
          </Functional>,
          <Functional>
            {["6", "7"]}
          </Functional>,
          <Functional>
            {["3", "4", "5"]}
          </Functional>
        ],
        null,
        null,
        null
      ),
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML("<div><div>345</div><div>67</div><div>345</div></div>")
    );
  });

  it("Basic Keyed algo test", () => {
    render(
      <div>
        <div key="a">A</div>
        <div key="b">B</div>
        <div key="c">C</div>
        <div key="d">D</div>
        <div key="e">E</div>
        <div key="f">F</div>
        <div key="g">G</div>
        <div key="h">H</div>
      </div>,
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        "<div><div>A</div><div>B</div><div>C</div><div>D</div><div>E</div><div>F</div><div>G</div><div>H</div></div>"
      )
    );

    render(
      <div>
        <div key="d">D</div>
        <div key="g">G</div>
        <div key="a">A</div>
        <div key="x">X</div>
        <div key="z">Z</div>
        <div key="b">B</div>
        <div key="1">1</div>
        <div key="2">2</div>
      </div>,
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        "<div><div>D</div><div>G</div><div>A</div><div>X</div><div>Z</div><div>B</div><div>1</div><div>2</div></div>"
      )
    );

    render(
      <div>
        <div key="1">1</div>
        <div key="g">G</div>
        <div key="b">B</div>
        <div key="a">A</div>
        <div key="2">2</div>
        <div key="c">C</div>
      </div>,
      container
    );

    expect(innerHTML(container.innerHTML)).toEqual(
      innerHTML(
        "<div><div>1</div><div>G</div><div>B</div><div>A</div><div>2</div><div>C</div></div>"
      )
    );
  });
});
