import {
  isArray,
  isInvalid,
  isNullOrUndef,
  LifecycleClass,
  throwError
} from "inferno-shared";
import { options } from "../core/options";
import { IVNode } from "../core/vnode";
import { svgNS } from "./constants";
import { mount } from "./mounting";
import { unmount } from "./unmounting";
import { IFiber } from "../core/fiber";

// We need EMPTY_OBJ defined in one place.
// Its used for comparison so we cant inline it into shared
export const EMPTY_OBJ = {};

if (process.env.NODE_ENV !== "production") {
  Object.freeze(EMPTY_OBJ);
}

// export function replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle: LifecycleClass, context: Object, isSVG: boolean, isRecycling: boolean) {
// 	replaceDOM(parentDom, mount(nextInput, null, lifecycle, context, isSVG), lastInput, lifecycle, isRecycling);
// }

export function replaceDOM(
  fiber: IFiber,
  parentDom,
  newDOM,
  lifecycle: LifecycleClass,
  isRecycling
) {
  unmount(fiber, null, lifecycle, false, isRecycling);
  replaceChild(parentDom, newDOM, fiber.dom);
  fiber.dom = newDOM;
}

export function handleComponentInput(input) {
  let out;

  // if (isInvalid(input)) {
  // 	// out = createVoidVNode();
  // } else if (isStringOrNumber(input)) {
  // 	// out = createTextVNode(input, null);
  // } else
  if (isArray(input)) {
    if (process.env.NODE_ENV !== "production") {
      throwError(
        "a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object."
      );
    }
    throwError();
  } else {
    // It's input
    out = input;
    // if ((out.flags & VNodeFlags.Component) > 0) {
    // 	// if we have an input that is also a component, we run into a tricky situation
    // 	// where the root input needs to always have the correct DOM entry
    // 	// so we break monomorphism on our input and supply it our input as parentVNode
    // 	// we can optimise this in the future, but this gets us out of a lot of issues
    // 	out.parentVNode = parentVNode;
    // }
  }
  return out;
}

export function setTextContent(dom, text: string | number) {
  if (text !== "") {
    dom.textContent = text;
  } else {
    dom.appendChild(document.createTextNode(""));
  }
}

export function updateTextContent(dom, text: string | number) {
  dom.firstChild.nodeValue = text;
}

export function appendChild(parentDom, dom) {
  parentDom.appendChild(dom);
}

export function insertOrAppend(parentDom, newNode, nextNode) {
  if (isNullOrUndef(nextNode)) {
    appendChild(parentDom, newNode);
  } else {
    parentDom.insertBefore(newNode, nextNode);
  }
}

export function documentCreateElement(tag, isSVG: boolean): Element {
  if (isSVG === true) {
    return document.createElementNS(svgNS, tag);
  } else {
    return document.createElement(tag);
  }
}

export function replaceWithNewNode(
  fiber: IFiber,
  nextNode: IVNode,
  parentDom,
  lifecycle: LifecycleClass,
  context: Object,
  isSVG: boolean,
  isRecycling: boolean
) {
  const oldNode = fiber.dom;
  unmount(fiber, null, lifecycle, false, isRecycling);
  // fiber.children = null;
  const newDom = mount(fiber, nextNode, null, lifecycle, context, isSVG);

  if (newDom !== null) {
    replaceChild(parentDom, newDom, oldNode);
  } else {
    removeChild(parentDom, oldNode as Element);
  }

  fiber.dom = newDom;
}

export function replaceChild(parentDom, nextDom, lastDom) {
  if (!parentDom) {
    parentDom = lastDom.parentNode;
  }
  parentDom.replaceChild(nextDom, lastDom);
}

export function removeChild(parentDom: Element, dom: Element) {
  parentDom.removeChild(dom);
}

export function removeAllChildren(
  dom: Element,
  children: IFiber[],
  lifecycle: LifecycleClass,
  isRecycling: boolean
) {
  if (!options.recyclingEnabled || (options.recyclingEnabled && !isRecycling)) {
    removeChildren(null, children, lifecycle, isRecycling);
  }
  dom.textContent = "";
}

function removeChildren(
  dom: Element | null,
  children: IFiber[],
  lifecycle: LifecycleClass,
  isRecycling: boolean
) {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];

    if (!isInvalid(child)) {
      unmount(child, dom, lifecycle, true, isRecycling);
    }
  }
}

// Reference to global object, rendering flag was moved there because v8 Chrome 59/60/61 crashed continously
// to "Oh snap" when using object literal...
export const G = (typeof window === "undefined" ? global : window) as any;
Object.defineProperty(G, "INFRender", {
  configurable: false,
  enumerable: false,
  value: false,
  writable: true
});

export function isKeyed(nextChildren: IVNode[]): boolean {
  return (
    nextChildren.length > 0 &&
    !isNullOrUndef(nextChildren[0]) &&
    !isNullOrUndef(nextChildren[0].key)
  );
}
