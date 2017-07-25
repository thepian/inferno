import { IVNode } from "./vnode";

export const enum FiberFlags {
  HasKeyedChildren = 1, // data is optimized for keyed algorithm
  HasNonKeydChildren = 1 << 2
}

export interface IFiber {
  input: IVNode | string | number;
  children: null | IFiber | IFiber[];
  childrenKeys: Map<string | number, number>;
  dom: null | Element;
  i: string | number;
  c: any;
  childFlags: number;
  parent: null | IFiber;
}

/**
 * Fiber represents internal vNode tree, which holds the reference to actual DOM.
 * This way user land virtual nodes become stateless and can be moved / hoisted / swapped freely at application level
 * @param {object|string|number} input reference to vNode or string of this Fiber
 * @param {string} i location of current Fiber in fiber tree
 * @constructor
 */
export function Fiber(input, i) {
  this.input = input;
  this.dom = null;
  this.children = null; // This value is null for Fibers that hold text nodes
  this.childrenKeys = null;
  this.i = i;
  this.c = null;
  this.childFlags = 0;
  this.parent = null; // Used only for nested components
}
