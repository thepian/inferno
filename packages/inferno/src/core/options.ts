export const options: {
  afterMount: null | Function;
  afterRender: null | Function;
  afterUpdate: null | Function;
  beforeRender: null | Function;
  beforeUnmount: null | Function;
  createVNode: null | Function;
  component: {
    create: null | Function;
    flush: null | Function;
    patch: null | Function;
    rendering: boolean;
  };
  findDOMNodeEnabled: boolean;
  hydrate?: (p1: any, p2: any, p3: any, p4: any) => boolean; // TODO: Add types and param names
  recyclingEnabled: boolean;
  roots: Map<any, any>;
} = {
  afterMount: null,
  afterRender: null,
  afterUpdate: null,
  beforeRender: null,
  beforeUnmount: null,
  component: {
    create: null,
    flush: null,
    patch: null,
    rendering: false
  },
  createVNode: null,
  findDOMNodeEnabled: false,
  hydrate: void 0,
  recyclingEnabled: false,
  roots: new Map()
};

if (process.env.NODE_ENV !== "production") {
  options.hydrate = function() {
    // Add basic validation and warn user if there is content in root node

    return false;
  };
}
