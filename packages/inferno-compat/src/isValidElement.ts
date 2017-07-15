/**
 * @module Inferno-Compat
 */ /** TypeDoc Comment */

import { IVNode } from 'inferno';
import { isNull, isObject } from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";

export default function isValidElement(obj: IVNode): boolean {
  const isNotANullObject = isObject(obj) && isNull(obj) === false;
  if (isNotANullObject === false) {
    return false;
  }
  const flags = obj.flags;

  return (flags & (VNodeFlags.Component | VNodeFlags.Element)) > 0;
}
