/**
 * @module Inferno-Clone-VNode
 */ /** TypeDoc Comment */
import {createVNode, EMPTY_OBJ, VNode} from 'inferno';
import {isNull, isStringOrNumber, isUndefined, isInvalid, isArray, combineFrom} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";

function directClone(vNodeToClone: VNode): VNode {
  let newVNode;
  const flags = vNodeToClone.flags;

  if (flags & VNodeFlags.Component) {
    let props;
    const propsToClone = vNodeToClone.props;

    if (isNull(propsToClone)) {
      props = EMPTY_OBJ;
    } else {
      props = {};
      for (const key in propsToClone) {
        props[key] = propsToClone[key];
      }
    }
    newVNode = createVNode(
      flags,
      vNodeToClone.type,
      null,
      null,
      props,
      vNodeToClone.key,
      vNodeToClone.ref,
      true
    );
    const newProps = newVNode.props;

    const newChildren = newProps.children;
    // we need to also clone component children that are in props
    // as the children may also have been hoisted
    if (newChildren) {
      if (isArray(newChildren)) {
        const len = newChildren.length;
        if (len > 0) {
          const tmpArray: any[] = [];

          for (let i = 0; i < len; i++) {
            const child = newChildren[i];

            if (isStringOrNumber(child)) {
              tmpArray.push(child);
            } else if (!isInvalid(child) && !!child.flags) {
              tmpArray.push(directClone(child));
            }
          }
          newProps.children = tmpArray;
        }
      } else if (!!newChildren.flags) {
        newProps.children = directClone(newChildren);
      }
    }

    newVNode.children = null;
  } else if (flags & VNodeFlags.Element) {
    const children = vNodeToClone.children;
    let props;
    const propsToClone = vNodeToClone.props;

    if (propsToClone === null) {
      props = EMPTY_OBJ;
    } else {
      props = {};
      for (const key in propsToClone) {
        props[key] = propsToClone[key];
      }
    }
    newVNode = createVNode(
      flags,
      vNodeToClone.type,
      vNodeToClone.className,
      children,
      props,
      vNodeToClone.key,
      vNodeToClone.ref,
      !children
    );
  } else if (flags & VNodeFlags.Portal) {
    newVNode = vNodeToClone;
  }

  return newVNode;
}

/**
 * Deeply clones given virtual node and all its children by creating new instance of it
 * @param {VNode} vNodeToClone virtual node to be cloned
 * @param {Props=} props additional props for new virtual node
 * @param {...*} _children new children for new virtual node
 * @returns {VNode} new virtual node
 */
export default function cloneVNode(
  vNodeToClone: VNode,
  props?,
  ..._children
): VNode {
  let children: any = _children;
  const childrenLen = _children.length;

  if (childrenLen > 0 && !isUndefined(_children[0])) {
    if (!props) {
      props = {};
    }
    if (childrenLen === 1) {
      children = _children[0];
    }

    if (!isUndefined(children)) {
      props.children = children as VNode;
    }
  }

  let newVNode;

  if (isArray(vNodeToClone)) {
    const tmpArray: any[] = [];
    for (let i = 0, len = (vNodeToClone as any).length; i < len; i++) {
      tmpArray.push(directClone(vNodeToClone[i]));
    }

    newVNode = tmpArray;
  } else {
    const flags = vNodeToClone.flags;
    let className = vNodeToClone.className;
    let key = vNodeToClone.key;
    let ref = vNodeToClone.ref;
    if (props) {
      if (props.hasOwnProperty("className")) {
        className = props.className as string;
      }
      if (props.hasOwnProperty("ref")) {
        ref = props.ref;
      }

      if (props.hasOwnProperty("key")) {
        key = props.key;
      }
    }

    if (flags & VNodeFlags.Component) {
      newVNode = createVNode(
        flags,
        vNodeToClone.type,
        className,
        null,
        !vNodeToClone.props && !props
          ? EMPTY_OBJ
          : combineFrom(vNodeToClone.props, props),
        key,
        ref,
        true
      );
      const newProps = newVNode.props;

      if (newProps) {
        const newChildren = newProps.children;
        // we need to also clone component children that are in props
        // as the children may also have been hoisted
        if (newChildren) {
          if (isArray(newChildren)) {
            const len = newChildren.length;
            if (len > 0) {
              const tmpArray: any[] = [];

              for (let i = 0; i < len; i++) {
                const child = newChildren[i];

                if (isStringOrNumber(child)) {
                  tmpArray.push(child);
                } else if (!isInvalid(child) && !!child.flags) {
                  tmpArray.push(directClone(child));
                }
              }
              newProps.children = tmpArray;
            }
          } else if (!!newChildren.flags) {
            newProps.children = directClone(newChildren);
          }
        }
      }
      newVNode.children = null;
    } else if (flags & VNodeFlags.Element) {
      children =
        props && !isUndefined(props.children)
          ? props.children
          : vNodeToClone.children;
      newVNode = createVNode(
        flags,
        vNodeToClone.type,
        className,
        children,
        !vNodeToClone.props && !props
          ? EMPTY_OBJ
          : combineFrom(vNodeToClone.props, props),
        key,
        ref,
        false
      );
    }
  }
  return newVNode;
}
