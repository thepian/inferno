import { createVNode, render } from "inferno";
import VNodeFlags from "inferno-vnode-flags";

describe("patching routine", () => {
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

  it("Should do nothing if lastVNode strictly equals nextVnode", () => {
    const yar = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      null,
      "123",
      null,
      null,
      null,
      true
    );
    const bar = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      null,
      "123",
      null,
      null,
      null,
      true
    );
    let foo = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      null,
      [bar, yar],
      null,
      null,
      null,
      true
    );

    render(foo, container);
    expect(container.innerHTML).toEqual(
      "<div><div>123</div><div>123</div></div>"
    );

    foo = createVNode(
      VNodeFlags.HtmlElement,
      "div",
      null,
      [bar, yar],
      null,
      null,
      null,
      true
    );

    render(foo, container);
    expect(container.innerHTML).toEqual(
      "<div><div>123</div><div>123</div></div>"
    );
  });

  // it("Should mount nextNode if lastNode crashed", () => {
  //   const validNode = createVNode(
  //     VNodeFlags.HtmlElement,
  //     "span",
  //     null,
  //     createVNode(VNodeFlags.HtmlElement, 'div', null, "a"),
  //     null,
  //     null,
  //     null,
  //     false
  //   );
  //   const invalidNode = createVNode(0, "span");
  //
  //   render(validNode, container);
  //   try {
  //     render(invalidNode, container);
  //   } catch (e) {
  //     expect(
  //       e.message.indexOf("Inferno Error: mount() received an object")
  //     ).not.toEqual(-1);
  //   }
  //   expect(container.innerHTML).toEqual("<span><div>a</div></span>");
  //
  //   render(validNode, container);
  //   expect(container.innerHTML).toEqual("<span><div>a</div></span>");
  // });

  // it("Patch operation when nextChildren is NOT Invalid/Array/StringOrNumber/VNode", () => {
  //   const validNode = createVNode(
  //     VNodeFlags.HtmlElement,
  //     "span",
  //     null,
  //     createVNode(
  //       VNodeFlags.HtmlElement,
  //       "span",
  //       null,
  //       createVNode(VNodeFlags.HtmlElement, 'div', null, "a"),
  //       null,
  //       null,
  //       null,
  //       false
  //     ),
  //     null,
  //     null,
  //     null,
  //     false
  //   );
  //
  //   const invalidChildNode = createVNode(
  //     VNodeFlags.HtmlElement,
  //     "span",
  //     null,
  //     createVNode(0, "span"),
  //     null,
  //     null,
  //     null,
  //     false
  //   );
  //
  //   render(validNode, container);
  //   render(invalidChildNode, container);
  // });

  it("Should not access real DOM property when text does not change", () => {
    render(createVNode(VNodeFlags.HtmlElement, "div", null, "a"), container);
    expect(container.textContent).toEqual("a");
    render(createVNode(VNodeFlags.HtmlElement, "div", null, "a"), container);
    expect(container.textContent).toEqual("a");
  });
});
