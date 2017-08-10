import { createVNode, render } from "inferno";
import VNodeFlags from "inferno-vnode-flags";
import sinon from 'sinon';

describe("non Keyed simple", () => {
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

  function createNullOrDiv(text, ref) {
    if (text === null) {
      return null;
    }

    return createVNode(VNodeFlags.HtmlElement, "div", null, text, null, null, ref);
  }

  it('Should mount new nodes 4 & 5 before 6', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();
    const spy4 = sinon.spy();
    const spy5 = sinon.spy();
    const spy6 = sinon.spy();

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(1, spy1),
        createNullOrDiv(2, spy2),
        createNullOrDiv(3, spy3),
        createNullOrDiv(null), // Fibers for invalids should not be created
        createNullOrDiv(null),
        createNullOrDiv(6, spy6)
      ]),
      container
    );

    expect(container.textContent).toBe("1236");
    sinon.assert.callCount(spy1, 1); // mounted
    sinon.assert.callCount(spy2, 1); // mounted
    sinon.assert.callCount(spy3, 1); // mounted
    sinon.assert.callCount(spy4, 0);
    sinon.assert.callCount(spy5, 0);
    sinon.assert.callCount(spy6, 1); // mounted

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(1, spy1),
        createNullOrDiv(2, spy2),
        createNullOrDiv(3, spy3),
        createNullOrDiv(4, spy4), // Fibers for invalids should not be created
        createNullOrDiv(5, spy5),
        createNullOrDiv(6, spy6)
      ]),
      container
    );

    expect(container.textContent).toBe('123456');
    sinon.assert.callCount(spy1, 1); // patched
    sinon.assert.callCount(spy2, 1); // patched
    sinon.assert.callCount(spy3, 1); // patched
    sinon.assert.callCount(spy4, 1); // mounted
    sinon.assert.callCount(spy5, 1); // mounted
    sinon.assert.callCount(spy6, 1); // patched
  });

  it('Should add new ones to middle & end', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();
    const spy4 = sinon.spy();
    const spy5 = sinon.spy();
    const spy6 = sinon.spy();
    const spy7 = sinon.spy();

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(1, spy1),
        createNullOrDiv(null),
        createNullOrDiv(3, spy3),
        createNullOrDiv(null),
        createNullOrDiv(null),
      ]),
      container
    );

    expect(container.textContent).toBe("13");
    sinon.assert.callCount(spy1, 1);
    sinon.assert.callCount(spy2, 0);
    sinon.assert.callCount(spy3, 1);
    sinon.assert.callCount(spy4, 0);
    sinon.assert.callCount(spy5, 0);
    sinon.assert.callCount(spy6, 0);
    sinon.assert.callCount(spy7, 0);

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(1, spy1),
        createNullOrDiv(2, spy2),
        createNullOrDiv(3, spy3),
        createNullOrDiv(4, spy4), // Fibers for invalids should not be created
        createNullOrDiv(5, spy5),
        createNullOrDiv(6, spy6),
        createNullOrDiv(7, spy7)
      ]),
      container
    );

    expect(container.textContent).toBe('1234567');
    sinon.assert.callCount(spy1, 1);
    sinon.assert.callCount(spy2, 1);
    sinon.assert.callCount(spy3, 1);
    sinon.assert.callCount(spy4, 1);
    sinon.assert.callCount(spy5, 1);
    sinon.assert.callCount(spy6, 1);
    sinon.assert.callCount(spy7, 1);
  });

  it('Should remove old fibers when next vNode count is less', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();
    const spy4 = sinon.spy();
    const spy5 = sinon.spy();
    const spy6 = sinon.spy();
    const spy7 = sinon.spy();

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(1, spy1),
        createNullOrDiv(null),
        createNullOrDiv(3, spy3),
        createNullOrDiv(null),
        createNullOrDiv(5, spy5),
        createNullOrDiv(6, spy6),
        createNullOrDiv(7, spy7),
      ]),
      container
    );

    expect(container.textContent).toBe("13567");
    sinon.assert.callCount(spy1, 1);
    sinon.assert.callCount(spy2, 0);
    sinon.assert.callCount(spy3, 1);
    sinon.assert.callCount(spy4, 0);
    sinon.assert.callCount(spy5, 1);
    sinon.assert.callCount(spy6, 1);
    sinon.assert.callCount(spy7, 1);

    render(
      createVNode(VNodeFlags.HtmlElement, "div", null, [
        createNullOrDiv(null),
        createNullOrDiv(null),
        createNullOrDiv(null),
        createNullOrDiv(null),
        createNullOrDiv(5, spy5),
      ]),
      container
    );

    expect(container.textContent).toBe('5');
    sinon.assert.callCount(spy1, 2);
    sinon.assert.callCount(spy2, 0);
    sinon.assert.callCount(spy3, 2);
    sinon.assert.callCount(spy4, 0);
    sinon.assert.callCount(spy5, 1);
    sinon.assert.callCount(spy6, 2);
    sinon.assert.callCount(spy7, 2);
  });

  describe('Nested Arrays Recursion', () => {
    it('Should remove 3 + 5&6 together as they are in same array', () => {
      debugger;
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const spy3 = sinon.spy();
        const spy4 = sinon.spy();
        const spy5 = sinon.spy();
        const spy6 = sinon.spy();
        const spy7 = sinon.spy();
        const spyX = sinon.spy();

        render(
          createVNode(VNodeFlags.HtmlElement, "div", null, [
            createNullOrDiv(1, spy1),
            createNullOrDiv(null),
            [
              createNullOrDiv(3, spy3),
              createNullOrDiv(null)
            ],
            [
              createNullOrDiv(5, spy5),
              createNullOrDiv(6, spy6)
            ],
            createNullOrDiv(7, spy7),
          ]),
          container
        );

        expect(container.textContent).toBe("13567");
        sinon.assert.callCount(spy1, 1);
        sinon.assert.callCount(spy2, 0);
        sinon.assert.callCount(spy3, 1);
        sinon.assert.callCount(spy4, 0);
        sinon.assert.callCount(spy5, 1);
        sinon.assert.callCount(spy6, 1);
        sinon.assert.callCount(spy7, 1);

        render(
          createVNode(VNodeFlags.HtmlElement, "div", null, [
            createNullOrDiv(null),
            createNullOrDiv(null),
            createNullOrDiv(5, spyX), // This should replace whole array
            createNullOrDiv(null),
            createNullOrDiv(null)
          ]),
          container
        );

        expect(container.textContent).toBe('5');
        sinon.assert.callCount(spy1, 2);
        sinon.assert.callCount(spy2, 0);
        sinon.assert.callCount(spy3, 2);
        sinon.assert.callCount(spy4, 0);
        sinon.assert.callCount(spy5, 2);
        sinon.assert.callCount(spy6, 2);
        sinon.assert.callCount(spy7, 2);
        sinon.assert.callCount(spyX, 1); // mounted
      });
    });
});
