import { isStatefulComponent } from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { normalize } from "./normalization";
import { options } from "./options";

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
  onComponentDidMount?: (domNode: Element) => void;
  onComponentWillMount?(): void;
  onComponentShouldUpdate?(lastProps, nextProps): boolean;
  onComponentWillUpdate?(lastProps, nextProps): void;
  onComponentDidUpdate?(lastProps, nextProps): void;
  onComponentWillUnmount?(domNode: Element): void;
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
  ref?: Ref | Refs
) {
  if (flags & VNodeFlags.ComponentUnknown) {
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

export function cloneVNode() {}

export function isVNode(o: IVNode): boolean {
  return !!o.flags;
}
