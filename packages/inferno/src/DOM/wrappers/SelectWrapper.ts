/**
 * @module Inferno
 */ /** TypeDoc Comment */

import {isArray, isNull, isNullOrUndef} from "inferno-shared";
import {IV, VNode} from "../../core/implementation";
import { EMPTY_OBJ } from "../utils/common";
import { createWrappedFunction } from "./wrapper";

function updateChildOptionGroup(iv: IV, value) {
  const vNode = iv.v as VNode;
  const type = vNode.type;

  if (type === "optgroup") {
    const children = iv.c;

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
    updateChildOption(iv, value);
  }
}

function updateChildOption(iv: IV, value) {
  const vNode = iv.v as VNode;
  const props: any = vNode.props || EMPTY_OBJ;
  const dom: any = iv.d;

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

const onSelectChange = createWrappedFunction("onChange", applyValue);

export function processSelect(
  iv: IV,
  dom,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
) {
  applyValue(iv, dom, nextPropsOrEmpty, mounting);

  if (isControlled) {
    dom.iv = iv;

    if (mounting) {
      dom.onchange = onSelectChange;
    }
  }
}

function applyValue(iv, dom, nextPropsOrEmpty, mounting: boolean) {
  if (nextPropsOrEmpty.multiple !== dom.multiple) {
    dom.multiple = nextPropsOrEmpty.multiple;
  }
  const children = iv.c;

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
