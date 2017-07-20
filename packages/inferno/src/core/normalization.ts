import {
  isInvalid,
  isNullOrUndef,
  isString,
  isUndefined
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { IVNode } from "./vnode";

export function getFlagsForElementVnode(type: string): number {
  if (type === "svg") {
    return VNodeFlags.SvgElement;
  } else if (type === "input") {
    return VNodeFlags.InputElement;
  } else if (type === "select") {
    return VNodeFlags.SelectElement;
  } else if (type === "textarea") {
    return VNodeFlags.TextareaElement;
  } else if (type === "media") {
    return VNodeFlags.MediaElement;
  }
  return VNodeFlags.HtmlElement;
}

// tslint:disable-next-line
let validateChildren: Function = function() {};
if (process.env.NODE_ENV !== "production") {
  validateChildren = function validateChildren(vNode: IVNode, children) {
    if ((vNode.flags & VNodeFlags.InputElement) > 0) {
      throw new Error(
        "Failed to set children, input elements can't have children."
      );
    }
    if ((vNode.flags & VNodeFlags.MediaElement) > 0) {
      throw new Error(
        "Failed to set children, media elements can't have children."
      );
    }
  };
}

export function normalize(vNode: IVNode): void {
  let props = vNode.props;
  let children = vNode.children;

  // convert a wrongly created type back to element
  // Primitive node doesn't have defaultProps, only Component
  if ((vNode.flags & VNodeFlags.Component) > 0) {
    // set default props
    const type = vNode.type;
    const defaultProps = (type as any).defaultProps;

    if (!isNullOrUndef(defaultProps)) {
      if (!props) {
        props = vNode.props = defaultProps; // Create new object if only defaultProps given
      } else {
        for (const prop in defaultProps) {
          if (isUndefined(props[prop])) {
            props[prop] = defaultProps[prop];
          }
        }
      }
    }

    if (isString(type)) {
      vNode.flags = getFlagsForElementVnode(type as string);
      if (props && props.children) {
        vNode.children = props.children;
        children = props.children;
      }
    }
  } else {
    if (props) {
      if (vNode.className === null) {
        vNode.className = props.hasOwnProperty("className")
          ? props.className
          : null;
      }
      if (vNode.children === null) {
        vNode.children = props.hasOwnProperty("children")
          ? props.children
          : null;
      }
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (props) {
      // TODO: Add validation for ref / key in props className in props
      // TODO: + children being in props if element
      if (!isInvalid(props.children)) {
        if (process.env.NODE_ENV !== "production") {
          validateChildren(vNode, props.children);
        }
      }
    }
    if (!isInvalid(children)) {
      if (process.env.NODE_ENV !== "production") {
        validateChildren(vNode, children);
      }
    }

    // This code will be stripped out from production CODE
    // It helps users to track errors in their applications.

    // const vNodeChildren = vNode.children;
    // if (vNodeChildren && Array.isArray(vNodeChildren)) {
    // 	// TODO: ADD VAlidations for these cases:
    // 	// - When there is invalid children of any kind - dont allow keys
    // 	// - When there are no invalid children, verify keys are unique
    // 	//
    // 	// let hasAnyInvalidValue = false;
    // 	//
    // 	// const nullIndex = vNodeChildren.indexOf(null);
    // 	// const falseIndex = vNodeChildren.indexOf(false);
    // 	// const trueIndex = vNodeChildren.indexOf(true);
    // 	// const undefIndex = vNodeChildren.indexOf(void 0);
    // 	//
    // 	// hasAnyInvalidValue = nullIndex >= 0 || falseIndex >= 0 || trueIndex >= 0 || undefIndex >= 0;
    // 	//
    // 	// if (hasAnyInvalidValue) {
    // 	// 	const result = [];
    // 	// 	let item;
    // 	// 	while (vNodeChildren.length > 0) {
    // 	// 		item = array.shift();
    // 	// 		if (!Array.isArray(item)){
    // 	// 			result.push(item);
    // 	// 		} else {
    // 	// 			array = item.concat(array);
    // 	// 		}
    // 	// 	}
    // 	//
    // 	// 	// There should not be any keys
    // 	// 	throwError();
    // 	// } else {
    // 	// 	throwError();
    // 	// }
    // 	//
    // 	// const keyValues = vNodeChildren.map(function(vnode) {
    // 	// 	return vnode.key;
    // 	// });
    // 	// keyValues.some(function(item, idx) {
    // 	// 	const hasDuplicate = keyValues.indexOf(item) !== idx;
    // 	//
    // 	// 	if (hasDuplicate) {
    // 	// 		warning('Inferno normalisation(...): Encountered two children with same key, all keys must be unique within its siblings. Duplicated key is:' + item);
    // 	// 	}
    // 	//
    // 	// 	return hasDuplicate;
    // 	// });
    // }
  }
}
