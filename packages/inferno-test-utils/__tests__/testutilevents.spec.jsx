import Component from "inferno-component";
import sinon from "sinon";
import {
  findRenderedVNodeWithType,
  renderIntoDocument
} from "inferno-test-utils";

describe("TestUtils events", () => {
  it("Should work with Synthetic events", () => {
    const testObj = {
      clicker: () => {}
    };

    const sinonSpy = sinon.spy(testObj, "clicker");
    let d;
    class FooBar extends Component {
      render() {
        return (
          <div ref={div => (d = div)} onClick={testObj.clicker}>
            Test
          </div>
        );
      }
    }
    const tree = renderIntoDocument(<FooBar />);

    const vnode = findRenderedVNodeWithType(tree, "div");
    d.click();

    expect(sinonSpy.callCount).toEqual(1);
  });

  it("Should work with native events", () => {
    const testObj = {
      clicker: () => {}
    };

    const sinonSpy = sinon.spy(testObj, "clicker");
    let d;
    class FooBar extends Component {
      render() {
        return (
          <div ref={div => (d = div)} onclick={testObj.clicker}>
            Test
          </div>
        );
      }
    }
    const tree = renderIntoDocument(<FooBar />);

    const vnode = findRenderedVNodeWithType(tree, "div");
    d.click();

    expect(sinonSpy.callCount).toEqual(1);
  });
});
