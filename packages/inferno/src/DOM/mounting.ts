import {
  isArray,
  isFunction,
  isInvalid,
  isNull,
  isNullOrUndef,
  isObject,
  isStringOrNumber,
  isUndefined,
  throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { options } from "../core/options";
import { IVNode } from "../core/vnode";
import { patchProp } from "./patching";
import { recycleComponent, recycleElement } from "./recycling";
import {
  appendChild,
  documentCreateElement,
  EMPTY_OBJ,
  setTextContent
} from "./utils";
import {
  isControlledFormElement,
  processElement
} from "./wrappers/processelements";
import { IFiber, Fiber, FiberFlags } from "../core/fiber";
import { componentToDOMNodeMap } from "./rendering";

export function mount(
  fiber: IFiber,
  input: IVNode | string | number,
  parentDom: Element,
  lifecycle,
  context: Object,
  isSVG: boolean,
  insertIntoDOM: boolean
) {
  // Text - Number
  if (isStringOrNumber(input)) {
    return mountText(fiber, input, parentDom, insertIntoDOM);
  } else {
    // VNode
    const flags = (input as IVNode).flags;

    if ((flags & VNodeFlags.Element) > 0) {
      return mountElement(
        fiber,
        input,
        parentDom,
        lifecycle,
        context,
        isSVG,
        insertIntoDOM
      );
    } else if ((flags & VNodeFlags.Component) > 0) {
      return mountComponent(
        fiber,
        input,
        parentDom,
        lifecycle,
        context,
        isSVG,
        (flags & VNodeFlags.ComponentClass) > 0,
        insertIntoDOM
      );
    } else {
      if (process.env.NODE_ENV !== "production") {
        if (typeof input === "object") {
          throwError(
            `mount() received an object that's not a valid VNode, you should stringify it first. Object: "${JSON.stringify(
              input
            )}".`
          );
        } else {
          throwError(
            `mount() expects a valid VNode, instead it received an object with the type "${typeof input}".`
          );
        }
      }
      throwError();
    }
  }
}

export function mountText(
  fiber: IFiber,
  text: string | number,
  parentDom: Element | null,
  insertIntoDom: boolean
): any {
  const dom = document.createTextNode(text as string) as any;

  if (insertIntoDom) {
    fiber.dom = dom;
    appendChild(parentDom, dom);
  }

  fiber.childFlags = FiberFlags.HasTextChildren;

  return dom;
}

export function mountElement(
  fiber: IFiber,
  vNode: IVNode,
  parentDom: Element | null,
  lifecycle,
  context: {},
  isSVG: boolean,
  insertIntoDom: boolean
) {
  let dom;
  if (options.recyclingEnabled) {
    dom = recycleElement(vNode, lifecycle, context, isSVG);

    if (!isNull(dom)) {
      if (insertIntoDom) {
        appendChild(parentDom, dom);
      }
      return dom;
    }
  }
  const flags = vNode.flags;

  isSVG = isSVG || (flags & VNodeFlags.SvgElement) > 0;
  dom = documentCreateElement(vNode.type, isSVG);
  const children = vNode.children;
  const props = vNode.props;
  const className = vNode.className;
  const ref = vNode.ref;

  if (!isInvalid(children)) {
    if (isStringOrNumber(children)) {
      // Text
      setTextContent(dom, children as string | number);
      fiber.childFlags = FiberFlags.HasTextChildren;
    } else {
      const childrenIsSVG = isSVG === true && vNode.type !== "foreignObject";
      if (isArray(children)) {
        // Array
        mountArrayChildren(
          fiber,
          children,
          dom,
          lifecycle,
          context,
          childrenIsSVG,
          0,
          false,
          0
        );
      } else {
        // VNode
        const childFiber = new Fiber(children as IVNode, 0, null);

        fiber.children = childFiber;
        fiber.childFlags = FiberFlags.HasBasicChildren;

        mount(
          childFiber,
          children as IVNode,
          dom,
          lifecycle,
          context,
          childrenIsSVG,
          true
        );
      }
    }
  } else {
    fiber.childFlags = FiberFlags.HasInvalidChildren;
  }
  if (!isNull(props)) {
    let hasControlledValue = false;
    const isFormElement = (flags & VNodeFlags.FormElement) > 0;
    if (isFormElement) {
      hasControlledValue = isControlledFormElement(props);
    }
    for (const prop in props) {
      // do not add a hasOwnProperty check here, it affects performance
      patchProp(prop, null, props[prop], dom, isSVG, hasControlledValue);
    }
    if (isFormElement) {
      processElement(fiber, flags, dom, props, true, hasControlledValue);
    }
  }

  if (className !== null) {
    if (isSVG) {
      dom.setAttribute("class", className);
    } else {
      dom.className = className;
    }
  }

  if (!isNull(ref)) {
    mountRef(dom, ref, lifecycle);
  }
  if (insertIntoDom) {
    fiber.dom = dom;
    appendChild(parentDom, dom);
  }

  return dom;
}

export function mountArrayChildren(
  fiber: IFiber,
  children,
  dom: Element,
  lifecycle,
  context: Object,
  isSVG: boolean,
  prefix,
  isKeyed: boolean,
  counter: number
) {
  fiber.childFlags = FiberFlags.HasNonKeydChildren; // Default to non keyed
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];

    if (!isInvalid(child)) {
      if (isArray(child)) {
        // TODO: Add warning about nested arrays?
        mountArrayChildren(
          fiber,
          child,
          dom,
          lifecycle,
          context,
          isSVG,
          prefix + i + ".",
          isKeyed,
          counter
        );
      } else {
        if (fiber.children === null) {
          fiber.children = [];
          isKeyed = isKeyed || isObject(child)
            ? !isNullOrUndef((child as IVNode).key)
            : false;
          fiber.childFlags = isKeyed
            ? FiberFlags.HasKeyedChildren
            : FiberFlags.HasNonKeydChildren;
        }
        const childFiber = new Fiber(child, prefix + i, child.key);

        (fiber.children as IFiber[]).push(childFiber);
        mount(childFiber, child, dom, lifecycle, context, isSVG, true);
      }
    }
  }
}

const C = options.component;

export function mountComponent(
  fiber: IFiber,
  vNode: IVNode,
  parentDom: Element,
  lifecycle,
  context: Object,
  isSVG: boolean,
  isClass: boolean,
  insertIntoDom: boolean
) {
  let dom = null;
  if (options.recyclingEnabled) {
    dom = recycleComponent(vNode, lifecycle, context, isSVG);

    if (!isNull(dom)) {
      if (insertIntoDom) {
        appendChild(parentDom, dom);
      }

      return dom;
    }
  }
  const type = vNode.type as Function;
  const props = vNode.props || EMPTY_OBJ;
  const ref = vNode.ref;
  // let childFiber;

  if (isClass) {
    const instance = (C.create as Function)(
      fiber,
      vNode,
      type,
      props,
      context,
      isSVG,
      lifecycle,
      parentDom
    );
    fiber.c = instance;
    const childFiber = fiber.children as IFiber;
    if (!isInvalid(childFiber.input)) {
      childFiber.dom = dom = mount(
        childFiber,
        childFiber.input,
        parentDom,
        lifecycle,
        instance._childContext,
        isSVG,
        false
      );
      if (insertIntoDom && !isNull(dom)) {
        fiber.dom = dom;
        appendChild(parentDom, dom);
      }
    }
    mountClassComponentCallbacks(vNode, ref, instance, lifecycle);
    instance._updating = false;
    if (options.findDOMNodeEnabled) {
      componentToDOMNodeMap.set(instance, dom);
    }
  } else {
    const input = type(props, context);

    if (!isInvalid(input)) {
      const childFiber = new Fiber(input, 0, null);
      fiber.children = childFiber;
      childFiber.dom = dom = mount(
        childFiber,
        input,
        parentDom,
        lifecycle,
        context,
        isSVG,
        false
      );
      if (typeof input === "object") {
        if ((input.flags & VNodeFlags.Component) > 0) {
          (fiber.children as IFiber).parent = fiber;
        }
      }
    }

    mountFunctionalComponentCallbacks(props, ref, dom, lifecycle);
    if (insertIntoDom && !isNull(dom)) {
      fiber.dom = dom;
      appendChild(parentDom, dom);
    }
  }

  return dom;
}

export function mountClassComponentCallbacks(
  vNode: IVNode,
  ref,
  instance,
  lifecycle
) {
  if (ref) {
    if (isFunction(ref)) {
      ref(instance);
    } else {
      if (process.env.NODE_ENV !== "production") {
        if (isStringOrNumber(ref)) {
          throwError(
            'string "refs" are not supported in Inferno 1.0. Use callback "refs" instead.'
          );
        } else if (isObject(ref) && vNode.flags & VNodeFlags.ComponentClass) {
          throwError(
            "functional component lifecycle events are not supported on ES2015 class components."
          );
        } else {
          throwError(
            `a bad value for "ref" was used on component: "${JSON.stringify(
              ref
            )}"`
          );
        }
      }
      throwError();
    }
  }
  const hasDidMount = !isUndefined(instance.componentDidMount);
  const afterMount = options.afterMount;

  if (hasDidMount || !isNull(afterMount)) {
    lifecycle.addListener(() => {
      instance._updating = true;
      if (afterMount) {
        afterMount(vNode);
      }
      if (hasDidMount) {
        instance.componentDidMount();
      }
      instance._updating = false;
    });
  }
}

export function mountFunctionalComponentCallbacks(props, ref, dom, lifecycle) {
  if (ref) {
    if (!isNullOrUndef(ref.onComponentWillMount)) {
      ref.onComponentWillMount(props);
    }
    if (!isNullOrUndef(ref.onComponentDidMount)) {
      lifecycle.addListener(() => ref.onComponentDidMount(dom, props));
    }
  }
}

export function mountRef(dom: Element, value, lifecycle) {
  if (isFunction(value)) {
    lifecycle.addListener(() => value(dom));
  } else {
    if (isInvalid(value)) {
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
