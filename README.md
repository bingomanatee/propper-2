# Propper 3.0

This is a reduced version of Propper, a library intended to enforce type constratints
on class properties, and set type and default value with one stroke. 

Partly the desire was to vastly reduce the profile of propper; 
as it is fundamental to so many of my projects I wanted to reduce
the file size of it to be as small as possible. (It weighs in at 13k.)

Also I wanted to reduce the interface to emphasize the features I used the most 
to make it easy to use; also to make it similar in profile to looking glass -- property, value, type. 

Note - the name of this library *is* a pun -- it both creates properties
on classes and assures that only "proper" values can be set to them. 

## Usage

Proper is a function that returns a curried class with one user-facing method: addProp. 
AddProp adds a property definition to the prototype of the class you pass that 

1. returns an expected initial/default value
2. ensures that the property can be set only to a specific value

note - the default value is *never validated by Propper!*
Propper assumes you aren't a dumbass and are providing good defaultvalues -- 
OR that there are scenarios in which the default value might actually be invalid for a reason; as in you have a form, 
and all values are set to null, but you only accept strings of a given format as input. That way if a field is still null
you know that it hasn't been edited yet. 

```javascript
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      proppify(User)
        .addProp('last', '', 'string')
        .addProp('first', '', 'string');

```

Now, the user has a set of string properties for first and last name. 
If you attempt to set these properties to non-string values they will throw.
(error outcomes are customizable.) 

## `.addProp(name...)` options

name must be a valid property name - all word chars.
addProp returns the Propper class and so can be curry-called. 

note - in general whenever a function is specified, the instance will be passed in
so you don't / shouldn't rely on / use "this" in your functions. 

### `.addProp(name<string>)`
 
no validation, no default value.

### `.addProp(name<string>, defaultValue)` 

no validation; preset default value

### `.addProp(name<string>, defaultValue|startFunction, type<string>)` 

(type is a string - name of an is.js method) throws on error

### `.addProp(name<string>, startFn<function>)` 
### `.addProp(name<string>, startFn<function>, type)` 

Generated default value (start function is a factory for default value).
If you want to initialize a property to any non-scalar value (as in an array or object)
use a startFn to assure referential identity. 

### `addProp(name, value, type, onError)`

Any of the above three-value calls, plus a custom handler that 
is triggered when an error is generated. 

No matter what onError does, it will NOT go on to assign the value to
the property. Adding a fourth property will prevent your property from 
throwing errors on bad data - its up to you to use it to manage bad data.

onError receives `(value, target, result, name)`;

**functional initializers for value**

Some types are probelmatic when defined as value; objects, DOM, essentially any
referential type. To prevent referential conflicts you can pass a *function*
as an initializer; this will initialize the value of the property to a unique
value. Also useful if for some awful reason you want to initialize the value
to a unique/random value. 

```javascript

class Alpha {};
proppify(Alpha)
.addProp('myMap', () => new Map());

const a = new Alpha();
a.myMap.set('omega', 'o');
const b = new Alpha();
console.log('has omega:', b.myMap.has('omega')); // false
```

# Advanced AddProp forms

The above is ALL YOU NEED to use prop 90% of the time. 

Here -- for the other 10% -- is advanced usage.

### `.addProp(name<string>, defaultValue|startFunction, validationErrors<function>)` 

the validationError function is passed (value, target).

* if the value is valid return false(y). 
* if there are errors, return a result, ideally a string. 
* on errors the result of validationError is thrown as an Error instance. 

### `.addProp(name<string>, defaultValue|startFunction, regexTest<RegExp>)` 

* the value is tested for being a string, and against the regexp. 
* If it fails the regExp an error message is thrown. 

## Super advanced: configuration by object

I have retired parametric configuration as much as possible as its overblown
and verbose for this task. HOWEVER it still exists as an option:

```javascript

      class StupidBlogger {
        constructor(name, tags) {
          this.name = name;
          if (tags) this.tags = tags;
        }

        tagsToString() {
          return this.tags.join(',');
        }
      }

      const flawMessages = [];

      proppify(StupidBlogger)
        .addProp('name', { type: 'string', defaultValue: 'Stupid Blogger' })
        .addProp('flaws', ['stupid', 'fat', 'smelly'], {
          type: 'array',
          onBadValue(value, target) {
            flawMessages.push([value, target.name]);
          },
        })
        .addProp('tags', {
          type: 'array',
          start: () => ([]),
        });

```

Settable options of config include:

* **localName** - by default, the underscore-prefixed name. 
* **start** - a function that should be a factory to initialize the default value
* **onChange** - a function that watches any change to a property. so fuck off, Mobx.
* **enumerable** - boolean; see property definition parameters in JS objects. 
* **onBadValue** - a function to intercept bad prop set's. 
* **validationErrors** - a.k.a. the functional alias for type. 
* **setOnGet** - if you call get *before* setting the local prop,
  do you want to just return the default value and *not* set the local value;
  if true (default) getting your property value will actually change the properties'
  local alias. setOnGet is forced to true UNLESS you pass a non-array value
  for defaultValue, AND you don't define a start function. 
  
the following signatures allow you to config parametrically:

* `.addProp(name, config<object>)`
* `.addProp(name, defaultValue, config<object>)`
* `.addProp(name, defaultValue, type, config<object>)`

Since you are in the "advanced" section, one pro tip - the result of validationErrors
is passed to onBadValue as the third parameter. So if you want super fantastic 
error handling the two methods can intercommunicate. 

## Schema

As a little easter egg all the properties defined using .addProp
are stored in a `__schema` map attached to the prototype of your class. 
