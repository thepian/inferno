import { LifecycleClass } from "inferno-shared";
import { IVNode } from "./vnode";

// FiberFLags are used to describe shape of its vNode
// Flags are used for internal optimizations
// TODO: Implement this to reduce diffing overhead
export const enum FiberFlags {
  HasNoChildren = 1 << 1,
  HasKeyedChildren = 1 << 2, // data is optimized for keyed algorithm
  HasNonKeydChildren = 1 << 3,
  HasSingleChildren = 1 << 4 // Single Element children
}

export interface IFiber {
  input: IVNode | string | number;
  children: null | IFiber | IFiber[];
  childrenKeys: Map<string | number, number>;
  dom: null | Element;
  lifeCycle: LifecycleClass;
  i: string | number;
  c: any;
  childFlags: number;
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
  this.lifeCycle = null;
  this.i = i;
  this.c = null;
  this.childFlags = 0;
}
