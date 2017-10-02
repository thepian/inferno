/**
 * @module Inferno
 */ /** TypeDoc Comment */

import {
  combineFrom,
  isBrowser,
  isFunction,
  isInvalid,
  isNull,
  isNullOrUndef,
  NO_OP,
  throwError,
  warning
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import {
  createIV,
  createVNode,
  InfernoChildren,
  InfernoInput, IV,
  options,
  Props,
  Root,
  VNode
} from "../core/implementation";
import { hydrateRoot } from "./hydration";
import { mount } from "./mounting";
import { patch, updateClassComponent } from "./patching";
import { unmount } from "./unmounting";
import { callAll, componentToDOMNodeMap, EMPTY_OBJ } from "./utils/common";

const roots = options.roots;
let renderInProgress: boolean = false;

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

function getRoot(dom): Root | null {
  for (let i = 0, len = roots.length; i < len; i++) {
    const root = roots[i];

    if (root.d === dom) {
      return root;
    }
  }
  return null;
}

function setRoot(dom: Element | SVGAElement, internalVNode: IV): Root {
  const root: Root = {
    d: dom,
    i: internalVNode
  };

  roots.push(root);
  return root;
}

function removeRoot(root: Root): void {
  for (let i = 0, len = roots.length; i < len; i++) {
    if (roots[i] === root) {
      roots.splice(i, 1);
      return;
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  if (isBrowser && document.body === null) {
    warning(
      'Inferno warning: you cannot initialize inferno without "document.body". Wait on "DOMContentLoaded" event, add script to bottom of body, or use async/defer attributes on script tag.'
    );
  }
}

const documentBody = isBrowser ? document.body : null;

export function render(
  input: InfernoInput,
  parentDOM:
    | Element
    | SVGAElement
    | DocumentFragment
    | null
    | HTMLElement
    | Node,
  callback?: Function
): InfernoChildren {
  // Development warning
  if (process.env.NODE_ENV !== "production") {
    if (documentBody === parentDOM) {
      throwError(
        'you cannot render() to the "document.body". Use an empty element as a container instead.'
      );
    }
  }
  if ((input as string) === NO_OP) {
    return;
  }
  renderInProgress = true;
  const lifecycle = [];
  let root = getRoot(parentDOM);
  let rootIV: IV;

  if (isNull(root)) {
    if (!isInvalid(input)) {
      rootIV = createIV(input, 0);

      if (!hydrateRoot(input, parentDOM as any, lifecycle)) {
        mount(
          rootIV,
          input as VNode,
          parentDOM as Element,
          null,
          lifecycle,
          EMPTY_OBJ,
          false,
          true
        );
      }
      root = setRoot(parentDOM as any, rootIV);
    }
  } else {
    if (isNullOrUndef(input)) {
      unmount(root.i, parentDOM as Element);
      removeRoot(root);
    } else {
      patch(
        root.i,
        input as VNode,
        parentDOM as Element,
        null,
        lifecycle,
        EMPTY_OBJ,
        false
      );
    }
  }

  callAll(lifecycle);

  if (isFunction(callback)) {
    callback();
  }
  flushSetStates();
  renderInProgress = false;
  if (root) {
    const rootInput: VNode = root.i.v as any;

    if (rootInput && rootInput.flags & VNodeFlags.Component) {
      return rootInput;
    }
  }
}

export function createRenderer(parentDOM?) {
  return function renderer(lastInput, nextInput) {
    if (!parentDOM) {
      parentDOM = lastInput;
    }
    render(nextInput, parentDOM);
  };
}

export function createPortal(children, container) {
  return createVNode(
    VNodeFlags.Portal,
    container,
    null,
    children,
    null,
    isInvalid(children) ? null : children.key,
    null,
    true
  );
}

// Component needs to be in this file, because rendering shared common boolean value
let componentFlushQueue: Array<Component<any, any>> = [];

export function flushSetStates() {
  const length = componentFlushQueue.length;

  if (length > 0) {
    for (let i = 0; i < length; i++) {
      const component = componentFlushQueue[i];

      applyState(component, false);

      const callbacks = component.$Q;

      if (!isNull(callbacks)) {
        for (let j = 0, len = callbacks.length; j < len; j++) {
          callbacks[i].call(component);
        }
        component.$Q = null;
      }
      component.$FP = false; // Flush no longer pending for this component
    }
    componentFlushQueue = [];
  }
}

function queueStateChanges<P, S>(
  component: Component<P, S>,
  newState: S | Function,
  callback?: Function
): void {
  if (isFunction(newState)) {
    newState = (newState as any)(
      component.state,
      component.props,
      component.$CX
    ) as S;
  }
  let pending = component.$PS;
  let key;

  if (isNullOrUndef(pending)) {
    component.$PS = pending = newState;
  } else {
    for (key in newState as S) {
      pending[key] = newState[key];
    }
  }

  if (!component.$PSS && !component.$BR) {
    if (renderInProgress) {
      if (!component.$FP) {
        component.$FP = true;
        componentFlushQueue.push(component);
      }

      if (isFunction(callback)) {
        const callbacks = component.$Q;

        if (isNull(callbacks)) {
          component.$Q = [callback];
        } else {
          callbacks.push(callback);
        }
      }
    } else {
      renderInProgress = true;

      applyState(component, false, callback);
      flushSetStates();

      renderInProgress = false;
    }
  } else {
    component.$PSS = true;
    if (component.$BR && isFunction(callback)) {
      (component._lifecycle as any).push(callback.bind(component));
    }
  }
}

function applyState<P, S>(
  component: Component<P, S>,
  force: boolean,
  callback?: Function
): void {
  if (component.$UN) {
    return;
  }
  if (force || !component.$BR) {
    component.$PSS = false;
    const pendingState = component.$PS;
    const prevState = component.state;
    const nextState = combineFrom(prevState, pendingState) as any;
    const props = component.props as P;
    const context = component.context;

    component.$PS = null;

    updateClassComponent(
      component,
      nextState,
      component.$IV,
      props,
      component.$PE,
      component._lifecycle as any,
      context,
      force,
      true
    );
    if (component.$UN) {
      return;
    }

    // Root Handling
    // if ((component.$LI.flags & VNodeFlags.Portal) === 0) {
    //   const dom = component.$LI.dom;
    //   while (!isNull((iv = iv.parentVNode as any))) {
    //     if ((iv.f & VNodeFlags.Component) > 0) {
    //       iv.d = dom;
    //     }
    //   }
    // }

    callAll(component._lifecycle as any);
  } else {
    component.state = component.$PS as any;
    component.$PS = null;
  }
  if (isFunction(callback)) {
    callback.call(component);
  }
}

export class Component<P, S> {
  // Public
  public static defaultProps: {} | null = null;
  public state: S | null = null;
  public props: P & Props;
  public context: any;

  // Internal properties
  public $BR: boolean = false; // BLOCK RENDER
  public $BS: boolean = true; // BLOCK STATE
  public $PSS: boolean = false; // PENDING SET STATE
  public $PS: S | null = null; // PENDING STATE (PARTIAL or FULL)
  public $UN = false; // UNMOUNTED
  public _lifecycle: Function[]; // TODO: Remove this from here, lifecycle should be pure.
  public $CX; // CHILDCONTEXT
  public $UPD: boolean = true; // UPDATING
  public $Q: Function[] | null = null; // QUEUE
  public $FP: boolean = false; // FLUSH PENDING
  public $IV: IV;
  public $PE: Element; // PARENT ELEMENT

  constructor(props?: P, context?: any) {
    /** @type {object} */
    this.props = props || (EMPTY_OBJ as P);

    /** @type {object} */
    this.context = context || EMPTY_OBJ; // context should not be mutable
  }

  // LifeCycle methods
  public componentDidMount?(): void;

  public componentWillMount?(): void;

  public componentWillReceiveProps?(nextProps: P, nextContext: any): void;

  public shouldComponentUpdate?(
    nextProps: P,
    nextState: S,
    nextContext: any
  ): boolean;

  public componentWillUpdate?(
    nextProps: P,
    nextState: S,
    nextContext: any
  ): void;

  public componentDidUpdate?(
    prevProps: P,
    prevState: S,
    prevContext: any
  ): void;

  public componentWillUnmount?(): void;

  public getChildContext?(): void;

  public forceUpdate(callback?: Function) {
    if (this.$UN) {
      return;
    }

    applyState(this, true, callback);
  }

  public setState(
    newState: { [k in keyof S]?: S[k] } | Function,
    callback?: Function
  ) {
    if (this.$UN) {
      return;
    }
    if (!this.$BS) {
      queueStateChanges(this, newState, callback);
    } else {
      // Development warning
      if (process.env.NODE_ENV !== "production") {
        throwError(
          "cannot update state via setState() in componentWillUpdate() or constructor."
        );
      }
      return;
    }
  }

  // tslint:disable-next-line:no-empty
  public render(nextProps?: P, nextState?, nextContext?): any {}
}
