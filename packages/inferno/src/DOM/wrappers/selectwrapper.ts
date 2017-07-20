/**
 * @module Inferno
 */ /** TypeDoc Comment */

import { isArray, isNull, isNullOrUndef } from "inferno-shared";
import { IVNode } from "../../core/vnode";
import { EMPTY_OBJ } from "../utils";
import { IFiber } from "packages/inferno/src/core/fiber";
import { wrap } from "./processelements";

function updateChildOptionGroup(fiber: IFiber, value) {
  const type = (fiber.input as IVNode).type;

  if (type === "optgroup") {
    const children = fiber.children;

    if (!isNull(children)) {
      if (isArray(children)) {
        for (let i = 0, len = children.length; i < len; i++) {
          updateChildOption(children[i], value);
        }
      } else {
        updateChildOption(children, value);
      }
    }
  } else {
    updateChildOption(fiber, value);
  }
}

function updateChildOption(fiber: IFiber, value) {
  const props: any = (fiber.input as IVNode).props || EMPTY_OBJ;
  const dom = fiber.dom as HTMLOptionElement;

  // we do this as multiple may have changed
  dom.value = props.value;
  if (
    (isArray(value) && value.indexOf(props.value) !== -1) ||
    props.value === value
  ) {
    dom.selected = true;
  } else if (!isNullOrUndef(value) || !isNullOrUndef(props.selected)) {
    dom.selected = props.selected || false;
  }
}

function applyValue(
  fiber: IFiber,
  dom: HTMLSelectElement,
  nextPropsOrEmpty,
  mounting: boolean
) {
  if (nextPropsOrEmpty.multiple !== dom.multiple) {
    dom.multiple = nextPropsOrEmpty.multiple;
  }
  const children = fiber.children;

  if (!isNull(children)) {
    let value = nextPropsOrEmpty.value;
    if (mounting && isNullOrUndef(value)) {
      value = nextPropsOrEmpty.defaultValue;
    }
    if (isArray(children)) {
      for (let i = 0, len = children.length; i < len; i++) {
        updateChildOptionGroup(children[i], value);
      }
    } else {
      updateChildOptionGroup(children, value);
    }
  }
}

function onSelectChange(e) {
  let fiber = this.fiber;
  const vNode = fiber.input;
  const props = vNode.props || EMPTY_OBJ;
  const dom = fiber.dom;
  const previousValue = props.value;

  if (props.onChange) {
    const event = props.onChange;

    if (event.event) {
      event.event(event.data, e);
    } else {
      event(e);
    }
  } else if (props.onchange) {
    props.onchange(e);
  }
  // the user may have updated the input from the above onInput events syncronously
  // so we need to get it from the context of `this` again
  fiber = this.fiber;
  const newVNode = fiber.input;
  const newProps = newVNode.props || EMPTY_OBJ;

  // If render is going async there is no value change yet, it will come back to process input soon
  if (previousValue !== newProps.value) {
    // When this happens we need to store current cursor position and restore it, to avoid jumping

    applyValue(fiber, dom, newProps, false);
  }
}

wrap(onSelectChange);

export function processSelect(
  fiber: IFiber,
  dom: HTMLSelectElement,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
) {
  applyValue(fiber, dom, nextPropsOrEmpty, mounting);

  if (isControlled) {
    dom.fiber = fiber;

    if (mounting) {
      dom.onchange = onSelectChange;
    }
  }
}
