/* tslint:disable:object-literal-sort-keys */
import {
  LifecycleClass as _LifecycleClass,
  NO_OP,
  warning
} from "inferno-shared";
import _VNodeFlags from "inferno-vnode-flags";
import { IFiber, Fiber } from "./core/fiber";
import {
  getFlagsForElementVnode,
  normalize as internal_normalize
} from "./core/normalization";
import { options } from "./core/options";
import {
  createVNode,
  InfernoChildren,
  Props,
  Refs,
  IVNode,
  cloneVNode
} from "./core/vnode";
import { isUnitlessNumber as internal_isUnitlessNumber } from "./DOM/constants";
import { linkEvent } from "./DOM/events/linkEvent";
import { patch as internal_patch } from "./DOM/patching";
import {
  componentToDOMNodeMap as internal_DOMNodeMap,
  createRenderer,
  findDOMNode,
  render
} from "./DOM/rendering";
import { EMPTY_OBJ } from "./DOM/utils";
import { mount } from "./DOM/mounting";
import { unmount } from "./DOM/unmounting";

if (process.env.NODE_ENV !== "production") {
  /* tslint:disable-next-line:no-empty */
  const testFunc = function testFn() {};
  if (
    ((testFunc as Function).name || testFunc.toString()).indexOf("testFn") ===
    -1
  ) {
    warning(
      "It looks like you're using a minified copy of the development build " +
        "of Inferno. When deploying Inferno apps to production, make sure to use " +
        "the production build which skips development warnings and is faster. " +
        "See http://infernojs.org for more details."
    );
  }
}

// To please the TS God
// https://github.com/Microsoft/TypeScript/issues/6307
export declare const VNodeFlags: _VNodeFlags;
// export declare const IFiber: _IFiber;
// export declare const IVNode: _IVNode;
export declare const LifecycleClass: _LifecycleClass;

const version = "4.0.1";

// we duplicate it so it plays nicely with different module loading systems
export default {
  EMPTY_OBJ,
  Fiber,
  NO_OP,
  cloneVNode,
  createRenderer,
  createVNode,
  findDOMNode,
  getFlagsForElementVnode,
  internal_DOMNodeMap,
  internal_isUnitlessNumber,
  internal_normalize,
  internal_patch,
  linkEvent,
  options,
  render,
  version
};

export {
  EMPTY_OBJ,
  IFiber,
  InfernoChildren,
  IVNode,
  Fiber,
  NO_OP,
  Props,
  Refs,
  cloneVNode,
  createRenderer,
  createVNode,
  findDOMNode,
  getFlagsForElementVnode,
  internal_DOMNodeMap,
  internal_isUnitlessNumber,
  internal_normalize,
  internal_patch,
  linkEvent,
  mount,
  unmount,
  options,
  render,
  version
};
