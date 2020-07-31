/* eslint-disable camelcase */
const tap = require('tap');
const validators = require('@wonderlandlabs/validators');
const p = require('./../package.json');

const val = validators();
const isString = val.is('string');
const isNumber = val.is('number');
const isInteger = val.is('integer');

const { proppify } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('Propper', (p) => {
    p.test('really simple - no type or default', (nodef) => {
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      proppify(User)
        .addProp('last')
        .addProp('first');

      const mike = new User();
      mike.first = 'Mike';

      nodef.same(mike.first, 'Mike');
      nodef.same(mike.last, undefined);
      nodef.same(mike.fullName, 'Mike undefined');

      mike.last = 'Jones';

      nodef.same(mike.first, 'Mike');
      nodef.same(mike.last, 'Jones');
      nodef.same(mike.fullName, 'Mike Jones');

      mike.first = ['Bob']; // because why not.

      nodef.same(mike.first, ['Bob']);
      nodef.same(mike.last, 'Jones');
      nodef.same(mike.fullName, 'Bob Jones'); // ?? well, ok then
      nodef.end();
    });
    p.test('simple untyped', (u) => {
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      proppify(User)
        .addProp('last', '')
        .addProp('first', '');

      const mike = new User();
      mike.first = 'Mike';

      u.same(mike.first, 'Mike');
      u.same(mike.last, '');
      u.same(mike.fullName, 'Mike');

      mike.last = 'Jones';

      u.same(mike.first, 'Mike');
      u.same(mike.last, 'Jones');
      u.same(mike.fullName, 'Mike Jones');

      mike.first = ['Bob'];

      u.same(mike.first, ['Bob']);
      u.same(mike.last, 'Jones');
      u.same(mike.fullName, 'Bob Jones'); // ?? well, ok then
      u.end();
    });

    p.test('simple strings', (s) => {
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      proppify(User)
        .addProp('last', '', 'string')
        .addProp('first', '', 'string');

      const mike = new User();
      mike.first = 'Mike';

      p.same(mike.first, 'Mike');
      p.same(mike.last, '');
      p.same(mike.fullName, 'Mike');

      mike.last = 'Jones';

      p.same(mike.first, 'Mike');
      p.same(mike.last, 'Jones');
      p.same(mike.fullName, 'Mike Jones');

      let e;
      try {
        mike.first = ['Bob'];
      } catch (err) {
        e = err;
        p.same(err.message, 'attempt to assign bad value to first Bob failed type test string');
      }
      p.ok(e, 'should have thrown error');

      let e2;
      try {
        mike.first = -1;
      } catch (err) {
        e2 = err;
        p.same(err.message, 'attempt to assign bad value to first -1 failed type test string');
      }

      p.ok(e2, 'should have thrown error');

      p.same(mike.first, 'Mike');
      p.same(mike.last, 'Jones');
      p.same(mike.fullName, 'Mike Jones');
      s.end();
    });

    p.test('custom test', (ct) => {
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      const goodName = (value, fieldName) => {
        let message = false;

        if (!isString(value)) {
          message = `attempt to set ${fieldName} to ${value}; string required`;
        } else if (!/^[\w]+$/.test(value)) {
          message = `attempt to set ${fieldName} to ${value}; only word characters accepted`;
        }

        return message;
      };

      proppify(User)
        .addProp('last', '', goodName)
        .addProp('first', '', goodName);

      const mike = new User();
      mike.first = 'Mike';

      ct.same(mike.first, 'Mike');
      ct.same(mike.last, '');
      ct.same(mike.fullName, 'Mike');

      mike.last = 'Jones';

      ct.same(mike.first, 'Mike');
      ct.same(mike.last, 'Jones');
      ct.same(mike.fullName, 'Mike Jones');

      let e;
      try {
        mike.first = ['Bob'];
      } catch (err) {
        e = err;
        ct.same(err.message, 'attempt to set first to Bob; string required');
      }
      ct.ok(e, 'should have thrown error');

      let e2;
      try {
        mike.first = -1;
      } catch (err) {
        e2 = err;
        ct.same(e2.message,
          'attempt to set first to -1; string required');
      }

      ct.ok(e2, 'should have thrown error');

      let e3;
      try {
        mike.first = '$sapphireWonderLoveBead';
      } catch (err) {
        e3 = err;
        ct.same(err.message, 'attempt to set first to $sapphireWonderLoveBead; only word characters accepted');
      }
      ct.ok(e3, 'should have thrown error');

      ct.same(mike.first, 'Mike');
      ct.same(mike.last, 'Jones');
      ct.same(mike.fullName, 'Mike Jones');
      ct.end();
    });

    p.test('regular expression test', (re) => {
      class User {
        get fullName() {
          return (`${this.first} ${this.last}`).trim();
        }
      }

      const goodName = /^[\w]+$/;

      proppify(User)
        .addProp('last', '', goodName)
        .addProp('first', '', goodName);

      const mike = new User();
      mike.first = 'Mike';

      re.same(mike.first, 'Mike');
      re.same(mike.last, '');
      re.same(mike.fullName, 'Mike');

      mike.last = 'Jones';

      re.same(mike.first, 'Mike');
      re.same(mike.last, 'Jones');
      re.same(mike.fullName, 'Mike Jones');

      let e;
      try {
        mike.first = ['Bob'];
      } catch (err) {
        e = err;
        re.same(err.message,
          'attempt to assign bad value to first Bob failed type test string');
      }
      re.ok(e, 'should have thrown error');

      let e2;
      try {
        mike.first = -1;
      } catch (err) {
        e2 = err;
        re.same(err.message,
          'attempt to assign bad value to first -1 failed type test string');
      }

      re.ok(e2, 'should have thrown error');

      let e3;
      try {
        mike.first = '$sapphireWonderLoveBead';
      } catch (err) {
        e3 = err;
        re.same(err.message, 'attempt to assign bad value to first "$sapphireWonderLoveBead" failed test /^[\\w]+$/');
      }
      re.ok(e3, 'should have thrown error');

      re.same(mike.first, 'Mike');
      re.same(mike.last, 'Jones');
      re.same(mike.fullName, 'Mike Jones');
      re.end();
    });

    p.test('custom bad value test', (cbv) => {
      class Range {
        get extent() {
          return this.max - this.min;
        }
      }

      proppify(Range)
        .addProp('min', 0, 'integer', (value, target, result) => {
          if (isNumber(value) && !isInteger(value)) {
            target.min = Math.round(value);
          }
        })
        .addProp('max', 0, 'integer');

      const r = new Range();

      cbv.same(r.min, 0);
      cbv.same(r.max, 0);
      cbv.same(r.extent, 0);

      r.min = 2.1;
      r.max = 5;

      cbv.same(r.min, 2);
      cbv.same(r.max, 5);
      cbv.same(r.extent, 3);

      cbv.end();
    });

    p.test('Superheroic default arrays', (a) => {
      class StupidBlogger {
        constructor(name, tags) {
          this.name = name;
          if (tags) this.tags = tags;
        }

        tagsToString() {
          return this.tags.join(',');
        }
      }


      proppify(StupidBlogger)
        .addProp('name', '', 'string')
        .addProp('flaws', ['stupid', 'fat', 'smelly'])
        .addProp('tags', []);

      // this is really bad practice but in the case of arrays
      // propper really tries to fix your stupid bad programming.

      const mike = new StupidBlogger('Mike');
      const bob = new StupidBlogger('Bob');

      // note - the default value of tags is an array - in theory it would be
      // the same array; but blogger senses this and returns unique arrays for each instance.

      a.same(mike.tags, []);
      a.same(bob.tags, []);
      a.same(mike.flaws, ['stupid', 'fat', 'smelly']);
      a.same(bob.flaws, ['stupid', 'fat', 'smelly']);

      bob.tags.push('manga');

      a.same(mike.tags, []);
      a.same(bob.tags, ['manga']);

      mike.flaws.push('short');
      a.same(mike.flaws, ['stupid', 'fat', 'smelly', 'short']);
      a.same(bob.flaws, ['stupid', 'fat', 'smelly']);

      a.end();
    });

    p.test('config objects', (a) => {
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

      const mike = new StupidBlogger('Mike');
      const bob = new StupidBlogger('Bob');

      a.same(mike.tags, []);
      a.same(bob.tags, []);
      a.same(mike.flaws, ['stupid', 'fat', 'smelly']);
      a.same(bob.flaws, ['stupid', 'fat', 'smelly']);

      bob.tags.push('manga');

      a.same(mike.tags, []);
      a.same(bob.tags, ['manga']);

      mike.flaws.push('short');
      a.same(mike.flaws, ['stupid', 'fat', 'smelly', 'short']);
      a.same(bob.flaws, ['stupid', 'fat', 'smelly']);

      mike.flaws = 'arrogant';

      a.same(flawMessages, [['arrogant', 'Mike']]);
      a.same(mike.flaws, ['stupid', 'fat', 'smelly', 'short']);

      a.end();
    });

    p.test('functional defaultValue', (fdv) => {
      fdv.test('problem - referential identity', (ri) => {
        class Alpha {

        }

        proppify(Alpha)
          .addProp('myMap', new Map());

        const a1 = new Alpha();
        a1.myMap.set('omega', 'o');
        const a2 = new Alpha();

        ri.ok(a1.myMap === a2.myMap); // problematic - we don't want referential types to be the same.
        const omega2 = a2.myMap.get('omega');
        ri.equal(omega2, 'o');
        ri.end();
      });

      fdv.test('solution - functional initializers', (fi) => {
        class Alpha {

        }

        proppify(Alpha)
          .addProp('myMap', () => new Map());

        const a1 = new Alpha();

        a1.myMap.set('omega', 'o');
        const a2 = new Alpha();

        fi.notOk(a1.myMap === a2.myMap); // problematic - we don't want referential types to be the same.
        fi.notStrictEqual(a2.myMap.get('omega'), 'o');

        fi.end();
      });


      fdv.end();
    });

    p.end();
  });

  suite.end();
});
