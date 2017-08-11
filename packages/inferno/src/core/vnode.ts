import { combineFrom, isStatefulComponent, isUndefined } from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { normalize } from "./normalization";
import { options } from "./options";
import { EMPTY_OBJ } from "../DOM/utils";

export type Ref = (node?: Element | null) => void | null;
export type InfernoChildren =
  | string
  | number
  | boolean
  | undefined
  | IVNode
  | Array<string | number | IVNode>
  | null;
export type Type = string | null | Function;

export interface Props {
  children?: InfernoChildren;
  [k: string]: any;
}

export interface Refs {
  onComponentDidMount?: (domNode: Element, nextProps) => void;
  onComponentWillMount?(nextProps): void;
  onComponentShouldUpdate?(lastProps, nextProps): boolean;
  onComponentWillUpdate?(lastProps, nextProps): void;
  onComponentDidUpdate?(lastProps, nextProps): void;
  onComponentWillUnmount?(domNode: Element, nextProps): void;
}

export interface IVNode {
  children: InfernoChildren;
  className: string;
  flags: VNodeFlags;
  key: any;
  props: Props | null;
  ref: Ref | Refs;
  type: Type;
}

function VNode(children, className, flags, key, props, ref, type) {
  this.children = children;
  this.className = className;
  this.flags = flags;
  this.key = key;
  this.props = props;
  this.ref = ref;
  this.type = type;
}

/**
 * Creates virtual node
 * @param {number} flags
 * @param {string|Function|null} type
 * @param {string|null=} className
 * @param {object=} children
 * @param {object=} props
 * @param {*=} key
 * @param {object|Function=} ref
 * @returns {VNode} returns new virtual node
 */
export function createVNode(
  flags: VNodeFlags,
  type: Type,
  className?: string | null,
  children?: InfernoChildren,
  props?: Props | null,
  key?: any,
  ref?: Ref | Refs | null
) {
  if ((flags & VNodeFlags.ComponentUnknown) > 0) {
    flags = isStatefulComponent(type)
      ? VNodeFlags.ComponentClass
      : VNodeFlags.ComponentFunction;
  }

  const vNode = new VNode(
    children === void 0 ? null : children,
    className === void 0 ? null : className,
    flags,
    key === void 0 ? null : key,
    props === void 0 ? null : props,
    ref === void 0 ? null : ref,
    type
  );

  normalize(vNode);

  if (options.createVNode !== null) {
    options.createVNode(vNode);
  }

  return vNode;
}

export function cloneVNode(
  vNodeToClone: IVNode,
  props?: Props,
  ..._children: InfernoChildren[]
): IVNode {
  let children: any = _children;
  const childrenLen = _children.length;

  if (childrenLen > 0) {
    if (!props) {
      props = {};
    }
    if (childrenLen === 1) {
      children = _children[0];
    }

    if (!isUndefined(children)) {
      props.children = children;
    }
  }

  const flags = vNodeToClone.flags;
  let className = vNodeToClone.className;
  let key = vNodeToClone.key;
  let ref = vNodeToClone.ref;
  const newProps = {} as any;
  const isElement = (flags & VNodeFlags.Element) > 0;

  if (props) {
    const propKeys = Object.keys(props);

    for (let i = 0, len = propKeys.length; i < len; i++) {
      const prop = propKeys[i];

      if (isElement && (prop === "className" || prop === "class")) {
        className = props[prop];
      } else if (prop === "key") {
        key = props[prop];
      } else if (prop === "ref") {
        ref = props[prop];
      } else if (prop === "children") {
        children = props[prop];
      } else if (!isElement && prop.substr(0, 11) === "onComponent") {
        if (!ref) {
          ref = {};
        }
        ref[prop] = props[prop];
      } else {
        newProps[prop] = props[prop];
      }
    }
  }

  const vNodeToCloneProps = vNodeToClone.props;

  if (isElement) {
    children =
      props && !isUndefined(props.children)
        ? props.children
        : vNodeToClone.children;
  } else {
    children = null;
    newProps.children =
      props && !isUndefined(props.children)
        ? props.children
        : vNodeToCloneProps ? vNodeToCloneProps.children : null;
  }

  return createVNode(
    flags,
    vNodeToClone.type,
    className,
    children,
    !vNodeToCloneProps && !props
      ? EMPTY_OBJ
      : combineFrom(vNodeToCloneProps, newProps),
    key,
    ref
  );
}

export function isVNode(o: any): o is IVNode {
  return !!o.flags;
}
