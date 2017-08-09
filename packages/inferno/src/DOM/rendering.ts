import {
  isBrowser,
  isFunction,
  isInvalid,
  isUndefined,
  isNullOrUndef,
  NO_OP,
  throwError,
  warning
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { options } from "../core/options";
import { InfernoChildren, IVNode } from "../core/vnode";
import { mount } from "./mounting";
import { patch } from "./patching";
import { unmount } from "./unmounting";
import { EMPTY_OBJ, G } from "./utils";
import { Fiber, IFiber } from "../core/fiber";

// rather than use a Map, like we did before, we can use an array here
// given there shouldn't be THAT many roots on the page, the difference
// in performance is huge: https://esbench.com/bench/5802a691330ab09900a1a2da
export const componentToDOMNodeMap = new Map();
const C = options.component;
const roots = options.roots;
/**
 * When inferno.options.findDOMNOdeEnabled is true, this function will return DOM Node by component instance
 * @param ref Component instance
 * @returns {*|null} returns dom node
 */
export function findDOMNode(ref) {
  if (!options.findDOMNodeEnabled) {
    if (process.env.NODE_ENV !== "production") {
      throwError(
        "findDOMNode() has been disabled, use Inferno.options.findDOMNodeEnabled = true; enabled findDOMNode(). Warning this can significantly impact performance!"
      );
    }
    throwError();
  }
  const dom = ref && ref.nodeType ? ref : null;

  return componentToDOMNodeMap.get(ref) || dom;
}

if (process.env.NODE_ENV !== "production") {
  if (isBrowser && document.body === null) {
    warning(
      'Inferno warning: you cannot initialize inferno without "document.body". Wait on "DOMContentLoaded" event, add script to bottom of body, or use async/defer attributes on script tag.'
    );
  }
}

export function Lifecycle() {
  this.listeners = [];
}

Lifecycle.prototype.addListener = function addListener(callback) {
  this.listeners.push(callback);
};
Lifecycle.prototype.trigger = function trigger() {
  const listeners = this.listeners;

  let listener;
  // We need to remove current listener from array when calling it, because more listeners might be added
  // TODO: Performance - Check if this can be converted to for loop
  while ((listener = listeners.shift())) {
    listener();
  }
};

const documentBody = isBrowser ? document.body : null;
/**
 * Renders virtual node tree into parent node.
 * @param {IVNode | null | string | number} input input to be rendered
 * @param {*} parentDom DOM node which content will be replaced by virtual node
 * @param {Function?} callback Callback to be called after rendering has finished
 * @returns {InfernoChildren} rendered virtual node
 */
export function render(
  input: IVNode | null | string | undefined,
  parentDom:
    | Element
    | SVGAElement
    | DocumentFragment
    | null
    | HTMLElement
    | Node,
  callback?: Function
): InfernoChildren {
  if (documentBody === parentDom) {
    if (process.env.NODE_ENV !== "production") {
      throwError(
        'you cannot render() to the "document.body". Use an empty element as a container instead.'
      );
    }
    throwError();
  }
  if ((input as any) === NO_OP) {
    return;
  }
  G.INFRender = true;
  const root = roots.get(parentDom);
  let rootFiber;
  let lifecycle;
  if (root === undefined) {
    if (isInvalid(input)) {
      return;
    }
    rootFiber = new Fiber(input, "0", null) as IFiber; // Stupid typescript... why casting needed???
    lifecycle = new Lifecycle();
    if (
      isUndefined(options.hydrate) ||
      !options.hydrate(rootFiber, input, parentDom as any, lifecycle)
    ) {
      mount(
        rootFiber,
        input as IVNode,
        parentDom as Element,
        lifecycle,
        EMPTY_OBJ,
        false,
        true
      );
    }

    // rootFiber = setRoot(parentDom as any, input, lifecycle);
    roots.set(parentDom, {
      fiber: rootFiber,
      lifeCycle: lifecycle
    });
    lifecycle.trigger();
  } else {
    rootFiber = root.fiber;
    lifecycle = root.lifeCycle;

    lifecycle.listeners = [];
    if (isNullOrUndef(input) && !isInvalid(rootFiber.input)) {
      unmount(rootFiber, parentDom as Element, lifecycle, false, false);
      roots.delete(parentDom);
    } else {
      patch(
        rootFiber,
        input as IVNode,
        parentDom as Element,
        lifecycle,
        EMPTY_OBJ,
        false,
        false
      );
    }
  }
  lifecycle.trigger();
  if (!isNullOrUndef(callback)) {
    callback();
  }
  if (isFunction(C.flush)) {
    C.flush();
  }
  G.INFRender = false;

  if (rootFiber) {
    const rootInput: IVNode = rootFiber.input as IVNode;

    if (rootInput && rootInput.flags & VNodeFlags.Component) {
      return rootInput.children;
    }
  }
}

export function createRenderer(parentDom?) {
  return function renderer(lastInput, nextInput) {
    if (!parentDom) {
      parentDom = lastInput;
    }
    render(nextInput, parentDom);
  };
}
