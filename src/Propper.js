/* eslint-disable no-param-reassign */
import is from 'is';
import lGet from './lodash/get';

class SchemaDef {
  constructor(name, type, config = {}) {
    this.name = name;
    this.type = type;
    this.config = config;
  }
}

function makeTypeTest(name, type) {
  if (type in is) {
    const isTest = is[type];
    // eslint-disable-next-line arrow-body-style
    return (value) => {
      return (isTest(value) ? null : `attempt to assign bad value to ${name} ${value} failed type test ${type}`);
    };
  }
  throw new Error(`no test named ${type}`);
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
    this.instanceName = instanceName || lGet(targetClass, 'constructor.name', 'instance');
  }

  makeOnBadValue(name, type) {
    const { instanceName } = this;

    let clause = '';

    if (type && typeof type === 'string') {
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

  makeOnBadValueWarn(name, type) {
    const { instanceName } = this;

    let clause = '';

    if (type && typeof type === 'string') {
      clause = `; requires ${type}`;
    }

    return (value) => {
      let message = '';
      try {
        message = `attempt to assign bad value ${value} to ${name} of ${instanceName}${clause}`;
      } catch {
        message = `attempt to assign bad value to ${name} of ${instanceName}${clause}`;
      }
      console.log(message);
    };
  }

  addProp(name, defaultValue = undefined, type = null, config = {}) {
    const nameErr = propNameTest(name);
    if (nameErr) throw new Error(nameErr);

    let uOnBadValue = null;
    if (is.function(config)) {
      uOnBadValue = config;
      config = {};
    } else if (is.object(defaultValue) && !type) {
      config = defaultValue;
    } else if (is.object(type)) {
      config = type;
      type = lGet(type, 'type', null);
    }

    /**
     * whether the first attempt to get actually sets the local property.
     *
     * @type {*}
     */
    let setOnGet = lGet(config, 'setOnGet', true);
    const localName = lGet(config, 'localName', `_${name}`);
    let start = lGet(config, 'start', false);
    const onChange = lGet(config, 'onChange', () => {
    });
    const enumerable = lGet(config, 'enumerable', true);
    if ('defaultValue' in config) {
      defaultValue = lGet(config, 'defaultValue');
    }

    let onBadValue = uOnBadValue || lGet(config, 'onBadValue', this.makeOnBadValue(name, type));
    if (onBadValue === 'warn') {
      onBadValue = this.makeOnBadValueWarn(name, type);
    }

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
      if (is.function(defaultValue) && (type !== 'function')) {
        start = defaultValue;
        setOnGet = true;
      } else if (Array.isArray(defaultValue)) {
        // we really try to save you from yourself....
        start = () => {
          if (!defaultValue.length) return [];
          // but not THAT hard;
          return [...defaultValue];
        };
        setOnGet = true;
      } else {
        start = () => defaultValue;
      }
    }

    let validationErrors = lGet(config, 'test', null);

    if (type) {
      if (typeof type === 'string') {
        validationErrors = makeTypeTest(name, type);
      } else if (typeof type === 'function') {
        validationErrors = (value) => type(value, name);
      } else if (is.regexp(type)) {
        validationErrors = makeRETest(name, type);
      }
    } else if (typeof validationErrors === 'string') {
      validationErrors = makeTypeTest(name, validationErrors);
    }

    if (typeof validationErrors !== 'function') {
      validationErrors = null;
    }

    const propDef = {
      configurable: false,
      enumerable,
      get() {
        if (!(localName in this)) {
          if (setOnGet) {
            this[localName] = start();
          } else {
            return start();
          }
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
        const lastValue = lGet(this, localName, undefined);
        this[localName] = value;
        if (value !== lastValue) onChange(value, lastValue, this, name);
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
