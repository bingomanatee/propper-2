/* eslint-disable no-param-reassign,prefer-const */
import validators from '@wonderlandlabs/validators';

const val = validators();

const isFunction = val.is('function');
const isObject = val.is('object');
const isString = val.is('string');

class SchemaDef {
  constructor(name, type, config = {}) {
    this.name = name;
    this.type = type;
    this.config = config;
  }
}

function makeTypeTest(name, type) {
  if (val.has(type)) {
    const isTest = val.is(type);
    // eslint-disable-next-line arrow-body-style
    return (value) => {
      return (isTest(value) ? null : `attempt to assign bad value to ${name} ${value} failed type test ${type}`);
    };
  }
  throw new Error(`no validator named ${type}`);
}

function makeRETest(name, re) {
  const subTest = makeTypeTest(name, 'string');

  return (value) => {
    const typeResult = subTest(value);
    if (typeResult) return typeResult;
    const message = `attempt to assign bad value to ${name} "${value}" failed test ${re}`;
    return (re.test(value) ? null : message);
  };
}

const propNameTest = makeRETest('property', /^[\w]+$/);

export default class Propper {
  constructor(targetClass, instanceName = 'instance') {
    this.targetClass = targetClass;
    this.instanceName = instanceName;
  }

  makeOnBadValue(name, type) {
    const { instanceName } = this;

    let clause = '';

    if (type && isString(type)) {
      clause = `; requires ${type}`;
    }

    return (value, target, message) => {
      if (!message) {
        try {
          message = `attempt to assign bad value ${value} to ${name} of ${instanceName}${clause}`;
        } catch {
          message = `attempt to assign bad value to ${name} of ${instanceName}${clause}`;
        }
      }
      const error = new Error(message);
      error.value = value;
      error.target = target;
      throw error;
    };
  }

  addProp(name, defaultValue = undefined, type = null, config = {}) {
    const nameErr = propNameTest(name);
    if (nameErr) throw new Error(nameErr);

    let uOnBadValue = null;

    if (isFunction(config)) {
      uOnBadValue = config;
      config = {};
    } else if (isObject(defaultValue) && !type) {
      config = defaultValue;
    } else if (isObject(type)) {
      if (!(type instanceof RegExp)) {
        config = type;
        type = type.type || null;
      }
    }

    let {
      onChange, localName,
      start,
      enumerable,
      defaultValue: defDefaultValue,
      onBadValue,
      test: validationErrors,
    } = {
      localName: `_${name}`,
      onChange: () => {
      },
      onBadValue: this.makeOnBadValue(name, type),
      enumerable: true,
      ...config,
    };

    if (defDefaultValue) {
      defaultValue = defDefaultValue;
    }

    if (uOnBadValue) onBadValue = uOnBadValue;

    /**
     * start exists as a factory for the initial value.
     * it can be set in config or passed as a second parameter.
     * In the latter scenario, it is intended to be called once.
     *
     * In most use cases the DEFAULT is for start to simply return
     * defaultValue.
     *
     * The reason this can be BAD is that if it is a reference type
     * (object, or array) every class property will have a reference
     * to the SAME value, which can be bad.
     */
    if (!start) {
      if (isFunction(defaultValue) && (!isFunction(type))) {
        start = defaultValue;
      } else if (Array.isArray(defaultValue)) {
        // we really try to save you from yourself....
        start = () => {
          if (!defaultValue.length) return [];
          // but not THAT hard;
          return [...defaultValue];
        };
      } else {
        start = () => defaultValue;
      }
    }

    if (type) {
      if (isString(type)) {
        validationErrors = makeTypeTest(name, type);
      } else if (isFunction(type)) {
        validationErrors = (value) => type(value, name);
      } else if (type instanceof RegExp) {
        validationErrors = makeRETest(name, type);
      }
    } else if (isString(validationErrors)) {
      validationErrors = makeTypeTest(name, validationErrors);
    }

    if (!isFunction(validationErrors)) {
      validationErrors = null;
    }

    const propDef = {
      configurable: false,
      enumerable,
      get() {
        if (!(localName in this)) {
          this[localName] = start();
        }
        return this[localName];
      },
      set(value) {
        if (localName in this) {
          if (this[localName] === value) {
            return;
          }
        }

        if (validationErrors) {
          const result = validationErrors(value, this);
          if (result) {
            onBadValue(value, this, result, name);
            return;
          }
        }
        const lastValue = this[localName];
        this[localName] = value;
        if (onChange && (value !== lastValue)) onChange(value, lastValue, this, name);
      },
    };

    Object.defineProperty(this.targetClass.prototype, name, propDef);

    /**
     * capture creation information in a static map
     */
    if (!this.targetClass.prototype.__schema) {
      this.targetClass.prototype.__schema = new Map();
    }
    this.targetClass.prototype.__schema.set(name, new SchemaDef(name, type, config));

    return this;
  }
}
