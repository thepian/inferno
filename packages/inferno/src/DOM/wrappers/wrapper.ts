import { isFunction } from "inferno-shared";
import {IV, Props, VNode} from "../../core/implementation";

export function createWrappedFunction(
  methodName: string,
  applyValue?: Function
): Function {
  const fnMethod = function(e) {
    e.stopPropagation();
    const iv = this.iv as IV;
    const vNode = iv.v as VNode;
    const props = vNode.props as Props;

    if (props[methodName]) {
      const listener = props[methodName];

      if (listener.event) {
        listener.event(listener.data, e);
      } else {
        listener(e);
      }
    } else {
      const nativeListenerName = methodName.toLowerCase();

      if (props[nativeListenerName]) {
        props[nativeListenerName](e);
      }
    }

    if (isFunction(applyValue)) {
      const newVNode = this.vNode;
      const newProps = newVNode.props;

      applyValue(newProps, iv.d);
    }
  };

  Object.defineProperty(fnMethod, "wrapped", {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });

  return fnMethod;
}
