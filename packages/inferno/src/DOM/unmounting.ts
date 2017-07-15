import {
  isArray,
  isNullOrUndef,
  isFunction,
  isInvalid,
  isNull,
  isStringOrNumber,
  LifecycleClass,
  throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { options } from "../core/options";
import { Ref, IVNode } from "../core/vnode";
import { isAttrAnEvent, patchEvent } from "./patching";
import { componentPools, elementPools, pool } from "./recycling";
import { EMPTY_OBJ, removeChild } from "./utils";
import { IFiber } from "../core/fiber";
import { componentToDOMNodeMap } from "./rendering";

export function unmount(
  fiber: IFiber,
  parentDom: Element | null,
  lifecycle: LifecycleClass,
  canRecycle: boolean,
  isRecycling: boolean
) {
  const input = fiber.input;

  if (isStringOrNumber(input)) {
    if (!isNull(parentDom)) {
      removeChild(parentDom, fiber.dom as Element);
    }
  } else {
    // It's vNode
    const flags = input.flags;
    if (flags & VNodeFlags.Element) {
      unmountElement(fiber, parentDom, lifecycle, canRecycle, isRecycling);
    } else if (flags & VNodeFlags.Component) {
      unmountComponent(fiber, parentDom, lifecycle, canRecycle, isRecycling);
    }
  }
}

export function unmountComponent(
  fiber: IFiber,
  parentDom: Element | null,
  lifecycle: LifecycleClass,
  canRecycle: boolean,
  isRecycling: boolean
) {
  const vNode = fiber.input as IVNode;
  // const instance = vNode.children as any;
  const instance = fiber.c;
  const flags = vNode.flags;
  const isStatefulComponent: boolean = (flags & VNodeFlags.ComponentClass) > 0;
  const props = vNode.props || EMPTY_OBJ;
  const ref = vNode.ref as any;
  const dom = fiber.dom as Element;
  const childFiber = fiber.children as IFiber;

  if (!isRecycling) {
    if (isStatefulComponent) {
      if (!instance._unmounted) {
        if (isFunction(options.beforeUnmount)) {
          options.beforeUnmount(vNode);
        }
        if (isFunction(instance.componentWillUnmount)) {
          instance.componentWillUnmount();
        }
        if (isFunction(ref) && !isRecycling) {
          ref(null);
        }
        instance._unmounted = true;
        if (options.findDOMNodeEnabled) {
          componentToDOMNodeMap.delete(instance);
        }

        if (!isInvalid(childFiber.input)) {
          unmount(
            childFiber as IFiber,
            null,
            instance._lifecycle,
            false,
            isRecycling
          );
        }
      }
    } else {
      if (!isNullOrUndef(ref)) {
        if (isFunction(ref.onComponentWillUnmount)) {
          ref.onComponentWillUnmount(dom, props);
        }
      }

      if (!isInvalid(childFiber.input)) {
        unmount(childFiber as IFiber, null, lifecycle, false, isRecycling);
      }
    }
  }

  fiber.children = null;
  if (parentDom && !isNull(dom)) {
    // let lastInput = instance._lastInput;
    //
    // if (isNullOrUndef(lastInput)) {
    // 	lastInput = instance;
    // }
    removeChild(parentDom, dom);
  }
  if (
    options.recyclingEnabled &&
    !isStatefulComponent &&
    (parentDom || canRecycle)
  ) {
    const hooks = ref;
    if (
      hooks &&
      (hooks.onComponentWillMount ||
        hooks.onComponentWillUnmount ||
        hooks.onComponentDidMount ||
        hooks.onComponentWillUpdate ||
        hooks.onComponentDidUpdate)
    ) {
      return;
    }
    pool(vNode, componentPools);
  }
}

export function unmountElement(
  fiber: IFiber,
  parentDom: Element | null,
  lifecycle: LifecycleClass,
  canRecycle: boolean,
  isRecycling: boolean
) {
  const dom = fiber.dom as Element;
  const vNode = fiber.input as IVNode;
  const ref = vNode.ref as any;
  const props = vNode.props;

  if (ref && !isRecycling) {
    unmountRef(ref);
  }

  const childFibers = fiber.children;

  if (childFibers !== null) {
    if (isArray(childFibers)) {
      for (let i = 0, len = childFibers.length; i < len; i++) {
        unmount(childFibers[i], null, lifecycle, false, isRecycling);
      }
    } else {
      unmount(childFibers, null, lifecycle, false, isRecycling);
    }
  }

  // TODO: Optimize this for performance, use Fibers to store mounted events
  if (!isNull(props)) {
    for (const name in props) {
      // do not add a hasOwnProperty check here, it affects performance
      if (props[name] !== null && isAttrAnEvent(name)) {
        patchEvent(name, props[name], null, dom);
        // We need to set this null, because same props otherwise come back if SCU returns false and we are recyling
        props[name] = null;
      }
    }
  }
  if (!isNull(parentDom)) {
    removeChild(parentDom, dom);
  }
  fiber.children = null;
  if (options.recyclingEnabled && (parentDom || canRecycle)) {
    pool(vNode, elementPools);
  }
}

function unmountRef(ref: Ref) {
  if (isFunction(ref)) {
    ref(null);
  } else {
    if (isInvalid(ref)) {
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      throwError(
        'string "refs" are not supported in Inferno 1.0. Use callback "refs" instead.'
      );
    }
    throwError();
  }
}
