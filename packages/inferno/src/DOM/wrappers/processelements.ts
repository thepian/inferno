/**
 * @module Inferno
 */ /** TypeDoc Comment */

import { isNullOrUndef } from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { isCheckedType, processInput } from "./inputwrapper";
import { processSelect } from "./selectwrapper";
import { processTextarea } from "./textareawrapper";
import { IFiber } from "../../core/fiber";

export function wrap(fn) {
  Object.defineProperty(fn, "wrapper", {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
}

/**
 * There is currently no support for switching same input between controlled and nonControlled
 * If that ever becomes a real issue, then re design controlled elements
 * Currently user must choose either controlled or non-controlled and stick with that
 */
export function processElement(
  fiber: IFiber,
  flags: number,
  dom: Element,
  nextPropsOrEmpty,
  mounting: boolean,
  isControlled: boolean
): void {
  if ((flags & VNodeFlags.InputElement) > 0) {
    processInput(
      fiber,
      dom as HTMLInputElement,
      nextPropsOrEmpty,
      mounting,
      isControlled
    );
  } else if ((flags & VNodeFlags.SelectElement) > 0) {
    processSelect(
      fiber,
      dom as HTMLSelectElement,
      nextPropsOrEmpty,
      mounting,
      isControlled
    );
  } else if ((flags & VNodeFlags.TextareaElement) > 0) {
    processTextarea(
      fiber,
      dom as HTMLTextAreaElement,
      nextPropsOrEmpty,
      mounting,
      isControlled
    );
  }
}

export function isControlledFormElement(nextPropsOrEmpty): boolean {
  return nextPropsOrEmpty.type && isCheckedType(nextPropsOrEmpty.type)
    ? !isNullOrUndef(nextPropsOrEmpty.checked)
    : !isNullOrUndef(nextPropsOrEmpty.value);
}
