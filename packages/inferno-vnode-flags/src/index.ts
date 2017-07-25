/**
 * @module Inferno-Vnode-Flags
 */ /** TypeDoc Comment */

const enum VNodeFlags {
  HtmlElement = 1,

  ComponentClass = 1 << 1,
  ComponentFunction = 1 << 2,
  ComponentUnknown = 1 << 3,

  HasKeyedChildren = 1 << 4,
  HasNonKeyedChildren = 1 << 5,

  SvgElement = 1 << 6,
  InputElement = 1 << 7,
  TextareaElement = 1 << 8,
  SelectElement = 1 << 9,
  MediaElement = 1 << 10,

  FormElement = InputElement | TextareaElement | SelectElement,
  Element = HtmlElement |
    SvgElement |
    MediaElement |
    InputElement |
    TextareaElement |
    SelectElement,
  Component = ComponentFunction | ComponentClass | ComponentUnknown
}

export default VNodeFlags;
