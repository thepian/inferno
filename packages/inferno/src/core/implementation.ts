/**
 * @module Inferno
 */ /** TypeDoc Comment */

import VNodeFlags from "inferno-vnode-flags";
import {
  isFunction,
  isNullOrUndef,
  isStatefulComponent,
  isString,
  isUndefined
} from "inferno-shared";
import {Component} from "../DOM/rendering";

export interface VNode {
  children: InfernoChildren;
  className: string | null;
  flags: number;
  key: any;
  props: Props | null;
  ref: Ref | Refs | null;
  type: any;
}
export type InfernoInput = VNode | null | string | number;
export type Ref = (node?: Element | null) => void;
export type InfernoChildren =
  | string
  | number
  | boolean
  | undefined
  | VNode
  | Array<string | number | VNode>
  | null;

export interface Props {
  children?: InfernoChildren;
  ref?: Ref | null;
  key?: any;
  className?: string;
  [k: string]: any;
}

export interface Refs {
  onComponentDidMount?: (domNode: Element) => void;
  onComponentWillMount?(): void;
  onComponentShouldUpdate?(lastProps, nextProps): boolean;
  onComponentWillUpdate?(lastProps, nextProps): void;
  onComponentDidUpdate?(lastProps, nextProps): void;
  onComponentWillUnmount?(domNode: Element): void;
}

export function createVNode(
  flags: number,
  type,
  className?: string | null,
  children?: InfernoChildren,
  props?: Props | null,
  key?: any,
  ref?: Ref | Refs | null,
  noNormalise?: boolean
): VNode {
  if ((flags & VNodeFlags.ComponentUnknown) > 0) {
    flags = isStatefulComponent(type)
      ? VNodeFlags.ComponentClass
      : VNodeFlags.ComponentFunction;
  }

  const vNode: VNode = {
    children: children === void 0 ? null : children,
    className: className === void 0 ? null : className,
    flags,
    key: key === void 0 ? null : key,
    props: props === void 0 ? null : props,
    ref: ref === void 0 ? null : ref,
    type
  };
  if (noNormalise !== true) {
    normalize(vNode);
  }
  if (isFunction(options.createVNode)) {
    options.createVNode(vNode);
  }

  return vNode;
}

export const enum IVTypes {
  Regular = 0,
  IsVirtualArray = 1 << 1
}

// Internal representation of VNode
export interface IV {
  b: IV | null; // Base - reference to IVs parent only used for Components to handle root changing
  c: IV | IV[] | null; // Children
  d: Element | null; // DOM
  f: number; // ChildFlags - number that tells what type of children this IV has
  i: Component<any, any>|null|number; // Component instance reference
  k: string | number | null; // Key (keyed algorithm)
  p: number; // Position (non keyed algorithm)
  t: number; // Type Flags about this IV
  v: VNode | string | number | any[];
}


export function createIV(
  value: string|number|VNode|any[],
  position
): IV {

  return {
    b: null,
    c: null,
    d: null,
    f: 0,
    i: null,
    k: isVNode(value) ? value.key : null,
    p: position,
    t: 0,
    v: value
  }
}

/*
 directClone is preferred over cloneVNode and used internally also.
 This function makes Inferno backwards compatible.
 And can be tree-shaked by modern bundlers

 Would be nice to combine this with directClone but could not do it without breaking change
 */

export function isVNode(o: any): o is VNode {
  return o.flags !== undefined;
}

function normalizeProps(vNode: VNode, props: Props, children: InfernoChildren) {
  // Deleting props is insanely slow, its better to ignore them in diff
  if ((vNode.flags & VNodeFlags.Element) > 0) {
    if (isNullOrUndef(children) && props.hasOwnProperty("children")) {
      vNode.children = props.children;
      props.children = undefined;
    }
    if (props.hasOwnProperty("className")) {
      vNode.className = props.className || null;
      props.className = undefined;
    }
  }
  if (props.hasOwnProperty("ref")) {
    vNode.ref = props.ref as any;
    props.ref = undefined;
  }
  if (props.hasOwnProperty("key")) {
    vNode.key = props.key;
    props.key = undefined;
  }
}

// TODO: This code should be moved to inferno-compat
export function getFlagsForElementVnode(type: string): number {
  if (type === "svg") {
    return VNodeFlags.SvgElement;
  } else if (type === "input") {
    return VNodeFlags.InputElement;
  } else if (type === "select") {
    return VNodeFlags.SelectElement;
  } else if (type === "textarea") {
    return VNodeFlags.TextareaElement;
  } else if (type === "media") {
    return VNodeFlags.MediaElement;
  }
  return VNodeFlags.HtmlElement;
}

export function normalize(vNode: VNode): void {
  let props = vNode.props;
  let children = vNode.children;

  // convert a wrongly created type back to element
  // Primitive node doesn't have defaultProps, only Component
  if ((vNode.flags & VNodeFlags.Component) > 0) {
    // set default props
    const type = vNode.type;
    const defaultProps = (type as any).defaultProps;

    if (!isNullOrUndef(defaultProps)) {
      if (!props) {
        props = vNode.props = defaultProps; // Create new object if only defaultProps given
      } else {
        for (const prop in defaultProps) {
          if (isUndefined(props[prop])) {
            props[prop] = defaultProps[prop];
          }
        }
      }
    }

    if (isString(type)) {
      vNode.flags = getFlagsForElementVnode(type as string);
      if (props && props.children) {
        vNode.children = props.children;
        children = props.children;
      }
    }
  }

  if (props) {
    normalizeProps(vNode, props, children);
  }

  // TODO Add validations and warnings
}

export interface Root {
  d: Element | SVGAElement;
  i: IV;
}

export const options: {
  afterMount: null | Function;
  afterRender: null | Function;
  afterUpdate: null | Function;
  beforeRender: null | Function;
  beforeUnmount: null | Function;
  createVNode: null | Function;
  findDOMNodeEnabled: boolean;
  roots: Root[];
} = {
  afterMount: null,
  afterRender: null,
  afterUpdate: null,
  beforeRender: null,
  beforeUnmount: null,
  createVNode: null,
  findDOMNodeEnabled: false,
  roots: []
};
