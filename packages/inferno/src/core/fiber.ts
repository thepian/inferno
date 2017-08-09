import { IVNode } from "./vnode";

export const enum FiberFlags {
  HasKeyedChildren = 1,
  HasNonKeydChildren = 1 << 1
}

export interface IFiber {
  input: IVNode | string | number;
  children: null | IFiber | IFiber[];
  k: string | number | null;
  dom: null | Element;
  i: string;
  c: any;
  childFlags: number;
  parent: null | IFiber;
}

/**
 * Fiber represents internal vNode tree, which holds the reference to actual DOM.
 * This way user land virtual nodes become stateless and can be moved / hoisted / swapped freely at application level
 * @param {object|string|number} input reference to vNode or string of this Fiber
 * @param {string} inputPosition location of current Fiber in fiber tree
 * @param {string|number} k key for hosted input
 * @constructor
 */
export function Fiber(
  input: IVNode | string | number,
  inputPosition: string,
  k: string | number | null
) {
  this.input = input;
  this.dom = null;
  this.children = null; // This value is null for Fibers that hold text nodes
  this.k = k;
  this.i = inputPosition;
  this.c = null;
  this.childFlags = 0;
  this.parent = null; // Used only for nested components
}
