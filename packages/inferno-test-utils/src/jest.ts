/**
 * @module Inferno-Test-Utils
 */ /** TypeDoc Comment */

import { IVNode } from "inferno";
import { isArray, isNull, isObject, isString } from "inferno-shared";
import { getTagNameOfVNode, isDOMVNode, renderIntoDocument } from "./index";
import VNodeFlags from "inferno-vnode-flags";

// Jest Snapshot Utilities
// Jest formats it's snapshots prettily because it knows how to play with the React test renderer.
// Symbols and algorithm have been reversed from the following file:
// https://github.com/facebook/react/blob/v15.4.2/src/renderers/testing/ReactTestRenderer.js#L98

function createSnapshotObject(object: object) {
  Object.defineProperty(object, "$$typeof", {
    value: Symbol.for("react.test.json")
  });

  return object;
}

export function vNodeToSnapshot(node: IVNode) {
  let object;
  const children: any[] = [];
  if (isDOMVNode(node)) {
    const props = { className: node.className || undefined, ...node.props };

    // Remove undefined props
    Object.keys(props).forEach(propKey => {
      if (props[propKey] === undefined) {
        delete props[propKey];
      }
    });

    // Create the actual object that Jest will interpret as the snapshot for this VNode
    object = createSnapshotObject({
      props,
      type: getTagNameOfVNode(node)
    });
  }
  const _children =
    node.flags & VNodeFlags.Component
      ? node.props ? node.props.children : null
      : node.children;

  if (isArray(_children)) {
    _children.forEach(child => {
      const asJSON = vNodeToSnapshot(child as IVNode);
      if (asJSON) {
        children.push(asJSON);
      }
    });
  } else if (isString(_children)) {
    children.push(_children);
  } else if (isObject(_children) && !isNull(_children)) {
    const asJSON = vNodeToSnapshot(_children);
    if (asJSON) {
      children.push(asJSON);
    }
  }

  if (object) {
    object.children = children.length ? children : null;
    return object;
  }

  if (children.length > 1) {
    return children;
  } else if (children.length === 1) {
    return children[0];
  }

  return object;
}

export function renderToSnapshot(input: IVNode) {
  const wrapper = renderIntoDocument(input);

  if (!isNull(wrapper.props)) {
    const vnode = wrapper.props.children;
    const snapshot = vNodeToSnapshot(vnode as IVNode);
    delete snapshot.props.children;
    return snapshot;
  }

  return undefined;
}

export default {
  createSnapshotObject,
  renderToSnapshot,
  vNodeToSnapshot
};
