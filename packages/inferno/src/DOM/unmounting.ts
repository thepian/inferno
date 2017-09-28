/**
 * @module Inferno
 */ /** TypeDoc Comment */

import {
  isArray,
  isFunction,
  isNull,
  isNullOrUndef,
  isStringOrNumber
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import {IV, options, isVNode} from "../core/implementation";
import { delegatedEvents } from "./constants";
import { handleEvent } from "./events/delegation";
import { componentToDOMNodeMap, removeChild } from "./utils/common";
import {Component} from "./rendering";

export function unmount(iv: IV, parentDOM: Element | null) {
  const input = iv.v;
  const dom = iv.d;

  if (!isStringOrNumber(input)) {
    if (isVNode(input)) {
      const flags = input.flags;
      const ref = input.ref as any;
      const props = input.props;
      const childIVs = iv.c;

      if ((flags & VNodeFlags.Element) > 0) {
        if (isFunction(ref)) {
          ref(null);
        }

        if (!isNull(props)) {
          for (const name in props) {
            // Remove all delegated events, regular events die with dom node
            if (delegatedEvents.has(name)) {
              handleEvent(name, null, dom);
            }
          }
        }
      } else if ((flags & VNodeFlags.Component) > 0) {
        const isClass: boolean = (flags & VNodeFlags.ComponentClass) > 0;

        if (isClass) {
          const instance = iv.i as Component<any, any>;

          if (isFunction(options.beforeUnmount)) {
            options.beforeUnmount(input);
          }
          if (isFunction(instance.componentWillUnmount)) {
            instance.componentWillUnmount();
          }
          if (isFunction(ref)) {
            ref(null);
          }
          instance.$UN = true;
          if (options.findDOMNodeEnabled) {
            componentToDOMNodeMap.delete(instance);
          }
        } else {
          if (!isNullOrUndef(ref)) {
            if (isFunction(ref.onComponentWillUnmount)) {
              ref.onComponentWillUnmount(dom, props);
            }
          }
        }

        iv.b = null;
      }

      if (!isNull(childIVs)) {
        if (isArray(childIVs)) {
          for (let i = 0, len = childIVs.length; i < len; i++) {
            unmount(childIVs[i], null);
          }
        } else {
          unmount(childIVs, null);
        }
      }
    }
  }

  if (!isNull(parentDOM) && !isNull(dom)) {
    removeChild(parentDOM, dom as Element);
  }
}
