import { IVNode, createVNode, render } from "inferno";
import Component from "inferno-component";
import {
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
  throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";
import { renderToSnapshot, vNodeToSnapshot } from "./jest";

// Type Checkers

export function isVNode(instance: any): instance is IVNode {
  return (
    Boolean(instance) &&
    isObject(instance) &&
    isNumber((instance as any).flags) &&
    (instance as any).flags > 0
  );
}

export function isVNodeOfType(
  instance: IVNode,
  type: string | Function
): boolean {
  return isVNode(instance) && instance.type === type;
}

export function isDOMVNode(inst: IVNode): boolean {
  return !isComponentVNode(inst);
}

export function isDOMVNodeOfType(instance: IVNode, type: string): boolean {
  return isDOMVNode(instance) && instance.type === type;
}

export function isFunctionalVNode(instance: IVNode): boolean {
  return (
    isVNode(instance) && Boolean(instance.flags & VNodeFlags.ComponentFunction)
  );
}

export function isFunctionalVNodeOfType(
  instance: IVNode,
  type: Function
): boolean {
  return isFunctionalVNode(instance) && instance.type === type;
}

export function isClassVNode(instance: IVNode): boolean {
  return (
    isVNode(instance) && Boolean(instance.flags & VNodeFlags.ComponentClass)
  );
}

export function isClassVNodeOfType(instance: IVNode, type: Function): boolean {
  return isClassVNode(instance) && instance.type === type;
}

export function isComponentVNode(inst: IVNode): boolean {
  return isFunctionalVNode(inst) || isClassVNode(inst);
}

export function isComponentVNodeOfType(inst: IVNode, type: Function): boolean {
  return (isFunctionalVNode(inst) || isClassVNode(inst)) && inst.type === type;
}

export function isDOMElement(instance: any): boolean {
  return (
    Boolean(instance) &&
    isObject(instance) &&
    (instance as any).nodeType === 1 &&
    isString((instance as any).tagName)
  );
}

export function isDOMElementOfType(instance: any, type: string): boolean {
  return (
    isDOMElement(instance) &&
    isString(type) &&
    instance.tagName.toLowerCase() === type.toLowerCase()
  );
}

export function isRenderedClassComponent(instance: any): boolean {
  return (
    Boolean(instance) &&
    isObject(instance) &&
    (instance as any)._fiber &&
    isFunction((instance as any).render) &&
    isFunction((instance as any).setState)
  );
}

export function isRenderedClassComponentOfType(
  instance: any,
  type: Function
): boolean {
  return (
    isRenderedClassComponent(instance) &&
    isFunction(type) &&
    instance._vNode.type === type
  );
}

// Render Utilities

export class Wrapper extends Component<any, any> {
  public render() {
    return this.props.children;
  }

  public repaint() {
    return new Promise<void>(resolve => this.setState({}, resolve));
  }
}

export function renderIntoDocument(input): any {
  let instance;
  const wrappedInput = createVNode(
    VNodeFlags.ComponentClass,
    Wrapper,
    null,
    null,
    {
      children: input
    },
    null,
    i => (instance = i)
  );
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  render(wrappedInput, parent);

  return instance;
}

// Recursive Finder Functions

export function findAllInRenderedTree(
  renderedTree: any,
  predicate: (vNode: IVNode) => boolean
): IVNode[] | any {
  if (isRenderedClassComponent(renderedTree)) {
    return findAllInVNodeTree(renderedTree._fiber.input, predicate);
  } else {
    throwError(
      "findAllInRenderedTree(renderedTree, predicate) renderedTree must be a rendered class component"
    );
  }
}

export function findAllInVNodeTree(
  vNodeTree: IVNode,
  predicate: (vNode: IVNode) => boolean
): any {
  if (isVNode(vNodeTree)) {
    let result: IVNode[] = predicate(vNodeTree) ? [vNodeTree] : [];
    const children: any =
      (vNodeTree.flags & VNodeFlags.Component) > 0
        ? vNodeTree.props ? vNodeTree.props.children : null
        : vNodeTree.children;

    if (isRenderedClassComponent(children)) {
      result = result.concat(
        findAllInVNodeTree(children._fiber.input, predicate) as IVNode[]
      );
    } else if (isVNode(children)) {
      result = result.concat(
        findAllInVNodeTree(children, predicate) as IVNode[]
      );
    } else if (isArray(children)) {
      (children as any[]).forEach(child => {
        result = result.concat(
          findAllInVNodeTree(child, predicate) as IVNode[]
        );
      });
    }
    return result;
  } else {
    throwError(
      "findAllInVNodeTree(vNodeTree, predicate) vNodeTree must be a VNode instance"
    );
  }
}

// Finder Helpers

// function parseSelector(filter) {
// 	if (isArray(filter)) {
// 		return filter;
// 	} else if (isString(filter)) {
// 		return filter.trim().split(/\s+/);
// 	} else {
// 		return [];
// 	}
// }

function findOneOf(
  tree: any,
  filter: any,
  name: string,
  finder: Function
): any {
  const all = finder(tree, filter);
  if (all.length > 1) {
    throwError(
      `Did not find exactly one match (found ${all.length}) for ${name}: ${filter}`
    );
  } else {
    return all[0];
  }
}

// Scry Utilities

// export function scryRenderedDOMElementsWithClass(renderedTree: any, classNames: string | string[]): Element[] {
// 	return findAllInRenderedTree(renderedTree, (instance) => {
// 		if (isDOMVNode(instance)) {
// 			let domClassName = (instance.dom as Element).className;
// 			if (
// 				!isString(domClassName) &&
// 				!isNullOrUndef(instance.dom) &&
// 				isFunction(instance.dom.getAttribute)
// 			) { // SVG || null, probably
// 				domClassName = (instance.dom as Element).getAttribute('class') || '';
// 			}
// 			const domClassList = parseSelector(domClassName);
// 			return parseSelector(classNames).every((className) => {
// 				return domClassList.indexOf(className) !== -1;
// 			});
// 		}
// 		return false;
// 	}).map((instance) => instance.dom);
// }

export function scryRenderedDOMElementsWithClass() {}

export function scryRenderedDOMElementsWithTag(
  renderedTree: any,
  tagName: string
): Element[] {
  return findAllInRenderedTree(renderedTree, instance => {
    return isDOMVNodeOfType(instance, tagName);
  }).map(instance => instance.dom);
}

export function scryRenderedVNodesWithType(
  renderedTree: any,
  type: string | Function
): IVNode[] {
  return findAllInRenderedTree(renderedTree, instance =>
    isVNodeOfType(instance, type)
  );
}

export function scryVNodesWithType(
  vNodeTree: IVNode,
  type: string | Function
): IVNode[] {
  return findAllInVNodeTree(vNodeTree, instance =>
    isVNodeOfType(instance, type)
  );
}

// Find Utilities

export function findRenderedDOMElementWithClass(
  renderedTree: any,
  classNames: string | string[]
): Element {
  return findOneOf(
    renderedTree,
    classNames,
    "class",
    scryRenderedDOMElementsWithClass
  );
}

export function findRenderedDOMElementWithTag(
  renderedTree: any,
  tagName: string
): Element {
  return findOneOf(
    renderedTree,
    tagName,
    "tag",
    scryRenderedDOMElementsWithTag
  );
}

export function findRenderedVNodeWithType(
  renderedTree: any,
  type: string | Function
): IVNode {
  return findOneOf(renderedTree, type, "component", scryRenderedVNodesWithType);
}

export function findVNodeWithType(
  vNodeTree: IVNode,
  type: string | Function
): IVNode {
  return findOneOf(vNodeTree, type, "VNode", scryVNodesWithType);
}

export function getTagNameOfVNode(inst: any) {
  return (
    (inst && inst.dom && inst.dom.tagName.toLowerCase()) ||
    (inst &&
      inst._vNode &&
      inst._vNode.dom &&
      inst._vNode.dom.tagName.toLowerCase()) ||
    undefined
  );
}

export default {
  findAllInRenderedTree,
  findAllInVNodeTree,
  findRenderedDOMElementWithClass,
  findRenderedDOMElementWithTag,
  findRenderedVNodeWithType,
  findVNodeWithType,
  getTagNameOfVNode,
  isClassVNode,
  isClassVNodeOfType,
  isComponentVNode,
  isComponentVNodeOfType,
  isDOMElement,
  isDOMElementOfType,
  isDOMVNode,
  isDOMVNodeOfType,
  isFunctionalVNode,
  isFunctionalVNodeOfType,
  isRenderedClassComponent,
  isRenderedClassComponentOfType,
  isVNode,
  isVNodeOfType,
  renderIntoDocument,
  renderToSnapshot,
  scryRenderedDOMElementsWithClass,
  scryRenderedDOMElementsWithTag,
  scryRenderedVNodesWithType,
  scryVNodesWithType,
  vNodeToSnapshot
};
