adv-parser
----------

[![Build Status](https://travis-ci.com/redexp/adv-parser.svg?branch=master)](https://travis-ci.com/redexp/adv-parser)

Parser for special simplified syntax of json schema.

Default json schema
```javascript
schema = {
    type: "object",
    additionalProperties: false,
    required: ['id', /* "name", */ 'enabled', 'list', 'user', 'enumOfStrings'],
    properties: {
        id: {
            type: "number",
        },
        name: {
            type: "string",
        },
        enabled: {
            type: "boolean",
        },
        list: {
            type: "array",
            items: {type: "number"}
        },
        user: {
            type: "object",
            additionalProperties: false,
            required: ['id', 'type'],
            properties: {
                id: {type: 'number'},
                type: {type: 'string'},
            }
        },
        enumOfStrings: {
            type: "string",
            enum: ["user", "guest", "owner"]
        },
    }
}
```

Simplified syntax of same schema
```javascript
schema = {
    id: number,
    [name]: string,
    enabled: boolean,
    list: [number],
    user: {
        id: number,
        type: string,
    },
    enumOfStrings: "user" || "guest" || "owner",
}
```

* [Usage](#usage)
  * [Schemas cache](#schemas-cache)
  * [Custom methods](#custom-methods)
  * [Custom functions](#custom-functions)
  * [Custom object inline options](#custom-object-inline-options)
* [Optional object fields](#optional-object-fields)
* [Array syntax](#array-syntax)
* [Number patterns](#number-patterns)
* [String patterns](#string-patterns)
* [Inject external schema](#inject-external-schema)
* [anyOf schema](#anyof-schema)
* [allOf schema](#allof-schema)
* [Extend schema](#extend-schema)
* [Switch syntax](#switch-syntax)
* [Schema methods](#schema-methods)
  * [prop](#prop)
  * [props](#props)
  * [merge](#merge)
  * [remove](#remove)
  * [required](#required)
  * [notRequired](#notrequired)
  * [set](#set)
  * [get](#get)
* [Schema options as methods](#schema-options-as-methods)
* [Object schema inline options](#object-schema-inline-options)


## Usage

```js
const parser = require('adv-parser');

let schema = parser(`{id: number}`);

// or as arrow function (which will be converted to string and parsed) 
// if you want free syntax highlighting

schema = parser(() => ({id: number}));

schema == {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: {type: 'number'}
    }
};
```

### Schemas cache

```js
const parser = require('adv-parser');
const defaultSchemas = require('adv-parser/schemas');

const schemas = {
    ...defaultSchemas
};

const schema1 = parser(`User = {id: number}`, {schemas});
const schema2 = parser(`Test.SubTest = {name: string}`, {schemas});
const schema3 = parser(Product => ({id: uuid}), {schemas});
const schema4 = parser(() => Company = {name: /^\w+$/}, {schemas});

schema1 == schemas.User;
schema2 == schemas['Test.SubTest'];
schema3 == schemas.Product;
schema4 == schemas.Company;
```

### Custom methods

All methods work with the schema as [AST](https://github.com/babel/babel/blob/main/packages/babel-parser/ast/spec.md). 
It gives you ability to create your own meta programming language 

More about default methods see [Schema methods](#schema-methods) and [Schema options as methods](#schema-options-as-methods)

```js
const parser = require('adv-parser');
const defaultMethods = require('adv-parser/methods');
const {set} = defaultMethods;

const schema = parser(`number.test(true)`, {
    methods: {
        ...defaultMethods,
        
        test: function (schema, args, params) {
            return set(schema, ['test', args[0]], params);
        }
    }
});

schema == {
    type: 'number',
    test: true,
};
```

### Custom functions

You can define custom functions like

```js
const parser = require('adv-parser');
const t = require('@babel/types');

const schema = parser(`{id: test(1, 2)}`, {
    functions: {
        test: function (args) {
            return t.numericLiteral(
                args.reduce((sum, item) => sum + item.value, 0)
            );
        }
    }
});

schema == {
    type: 'object',
    test: true,
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: 3
    }
};
```

### Custom object inline options

More about default object inline options see [Object schema inline options](#object-schema-inline-options)

```js
const parser = require('adv-parser');
const defaultObjectOptions = require('adv-parser/methods/object');
const set = require('adv-parser/methods/set');

const schema = parser(`{id: number, $test: true}`, {
    objectOptions: {
        ...defaultObjectOptions,
        
        test: function (schema, args, params) {
            return set(schema, ['test', args[0]], params);
        }
    }
});

schema == {
    type: 'object',
    test: true,
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: {type: 'number'}
    }
};
```

## Optional object fields

By default, all fields in an object are required. To make field optional just put it in brackets.
```javascript
schema = {
    id: number,
    [name]: string,
    'age?': number,
}

schema == {
    type: "object",
    additionalProperties: false,
    required: ["id"],
    properties: {
        id: {type: "number"},
        name: {type: "string"},
        age: {type: "number"},
    },
}
```

## Array syntax

Here example of array where all items should be validated with one schema
```js
schema = [number]

schema == {
  type: 'array',
  items: {type: 'number'}
}
```

Here example how we can validate items through many schemas
```js
schema = [number || string || {id: number}]

schema == {
  type: 'array',
  items: {
    anyOf: [
      {type: 'number'},
      {type: 'string'},
      {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: {type: 'number'}
        }
      },
    ]
  }
}
```

Here index relative validation
```js
schema = [number, string]
```
Which means that first element must be a number and second a string. Rest elements validation depends on array options like `additionalItems`.
In this example valid will be: `[1]`, `[1, "abc"]`, `[1, "abc", 2]`, `[]`. Not valid: `["abc", 1]`, `["abc"]`
```js
schema == {
  type: 'array',
  items: [
    {type: 'number'},
    {type: 'string'}
  ]
}
```
You can add any array option with it methods
```js
schema = [number, string].additionalItems(false)

schema == {
  type: 'array',
  items: [
    {type: 'number'},
    {type: 'string'}
  ],
  additionalItems: false,
}
```
If you need one index relative element validation than you can use `items` method like
```js
firstNumber = [].items([number])
firstString = array.items([string])

firstNumber == {
  type: 'array',
  items: [{type: 'number'}]
}

firstString == {
  type: 'array',
  items: [{type: 'string'}]
}
```

This example means that at least one element in an array must be valid
```js
list = [...string]
listOr = [...(string || boolean)]

list == {
  type: 'array',
  contains: {type: 'string'},
}
listOr == {
  type: 'array',
  contains: {anyOf: [{type: 'string'}, {type: 'boolean'}]},
}
```
Combination of index relative validation and `contains`
```js
schema = [number, ...(string || boolean)]

schema == {
  type: 'array',
  items: [
    {type: 'number'}
  ],
  contains: {anyOf: [{type: 'string'}, {type: 'boolean'}]},
}
```

## Number patterns

Instead of short `number` validator you can use one of following number patterns as value of object field.

* `int` number without floating-point
* `positive` positive number including `0`
* `negative` negative number excluding `0`
* `id` number more than `0`

```javascript
schema = {
    id: id,
    price: positive,
    list: [int],
}

schema == {
    type: "object",
    additionalProperties: false,
    required: ['id', 'price', 'list'],
    properties: {
        id: {
            type: "number",
            minimum: 1,
        },
        price: {
            type: "number",
            minimum: 0,
        },
        list: {
            type: "array",
            items: {
                type: "integer",
            }
        },
    },
}
```

## String patterns

Instead of short `string` validator you can use one of following string patterns as value of object field.

* `date` full-date according to RFC3339.
* `time` time with optional time-zone.
* `date-time` date-time from the same source (time-zone is optional, in ajv it's mandatory)
* `date-time-tz` date-time with time-zone required
* `uri` full URI.
* `uri-reference` URI reference, including full and relative URIs.
* `uri-template` URI template according to RFC6570
* `email` email address.
* `hostname` host name according to RFC1034.
* `filename` name (words with dashes) with extension
* `ipv4` IP address v4.
* `ipv6` IP address v6.
* `regex` tests whether a string is a valid regular expression by passing it to RegExp constructor.
* `uuid` Universally Unique Identifier according to RFC4122.

Also, regexp will be converted to `{pattern: "regexp"}`

```javascript
schema = {
    id: uuid,
    email: email,
    created_at: date-time,
    phone: /^\+?\d+$/,
    days: [date],
}

schema == {
    type: "object",
    additionalProperties: false,
    required: ['id', 'email', 'created_at', 'phone', 'days'],
    properties: {
        id: {
            type: "string",
            format: "uuid",
        },
        email: {
            type: "string",
            format: "email",
        },
        created_at: {
            type: "string",
            format: "date-time",
        },
        phone: {
            type: "string",
            pattern: "^\\+?\\d+$",
        },
        days: {
            type: "array",
            items: {
                type: "string",
                format: "date",
            }
        },
    }
}
```

### Inject external schema

You can inject an external schema in a current schema.
```javascript
User = {
    id: number,
    name: string,
}

schema = {
    action: 'update' || 'delete',
    user: User,
}

schema == {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'user'],
  properties: {
    action: {
      type: 'string',
      enum: ['update', 'delete']
    },
    user: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name'],
      properties: {
        id: {type: 'number'},
        name: {type: 'string'},
      }
    }
  }
}
```

## anyOf schema

Instead of `anyOf` you can use `||` operator
```javascript
schema = {
    data: User || Account || {type: "object"}
}

schema == {
    type: "object",
    additionalProperties: false,
    required: ['data'],
    properties: {
        data: {
            anyOf: [
                {/* schema of User */},
                {/* schema of Account */},
                {type: "object"},
            ]
        }
    }
}
```

## allOf schema

Instead of `allOf` you can use `&&` operator
```javascript
schema = {
    data: User && Account && {type: "object"}
}

schema == {
    type: "object",
    additionalProperties: false,
    required: ['data'],
    properties: {
        data: {
            allOf: [
                {/* schema of User */},
                {/* schema of Account */},
                {type: "object"},
            ]
        }
    }
}
```

## Extend schema

To extend you can use object spread operator
```javascript
User = {
    id: number,
    data: string,
}

UserExtra = {
    name: string,
    created_at: date,
}

schema = {
   ...User,
   ...UserExtra,
  
   age: number, // add field
   data: undefined, // remove field
   created_at: date-time, // overwrite field
}

schema == {
   type: "object",
   additionalProperties: false,
   required: ['id', 'name', 'created_at', 'age'],
   properties: {
      id: {type: "number"},
      name: {type: "string"},
      created_at: {type: "string", format: "date-time"},
      age: {type: "number"},
   }
}
```

Also, you can overwrite validator options
```js
schema = {
   ...User,
   type: "object",
   additionalProperties: true,
}
```
Important to add `type: "object"` it says to compiler that this object is pure ajv validator, not simplified version.
```javascript
schema = {
   type: "object",
   additionalProperties: true,
   properties: {
      id: {type: "number"},
      data: {type: "string"},
   }
}
```
You extend even non object validators
```js
phone = {
    type: "string",
    pattern: "^\\d+$"
}

schema = {
    ...phone,
  
    type: "string",
    maxLength: 20,
}
```

## Switch syntax

This syntax useful in case when you write something like `{...} || {...} || {...}` but if validator found error then it throws tons of messages from each of that object. 
To help validator to figure out which object is responsible for current data you can use next syntax

```javascript
schema = (
    (
        {action: 'create'} >>
        {
			name: string
		}
    )
    ||
    (
        {action: 'update'} >>
        {
			id: int, 
            name: string,
        }
    )
    ||
    (
        {action: 'delete'} >>
        {
			id: int
        }
    )
)
```
It will be converted to
```javascript
schema = {
	if: {
		type: 'object',
        additionalProperties: true,
        required: ['action'],
        properties: {
			action: {const: 'create'}
        }
    },
    then: {
        type: 'object',
        additionalProperties: false,
        required: ['action', 'name'],
        properties: {
            action: {const: 'create'},
            name: {type: 'string'},
        }
    },
    else: {
        if: {
            type: 'object',
            additionalProperties: true,
            required: ['action'],
            properties: {
                action: {const: 'update'}
            }
        },
        then: {
            type: 'object',
            additionalProperties: false,
            required: ['action', 'id', 'name'],
            properties: {
                action: {const: 'update'},
                id: {type: 'integer'},
                name: {type: 'string'},
            }
        },
        else: {
            if: {
                type: 'object',
                additionalProperties: true,
                required: ['action'],
                properties: {
                    action: {const: 'delete'}
                }
            },
            then: {
                type: 'object',
                additionalProperties: false,
                required: ['action', 'id'],
                properties: {
                    action: {const: 'delete'},
                    id: {type: 'integer'},
                }
            },
            else: {
				oneOf: [
                    {
                        type: 'object',
                        additionalProperties: true,
                        required: ['action'],
                        properties: {
                            action: {const: 'create'}
                        }
                    },
                    {
                        type: 'object',
                        additionalProperties: true,
                        required: ['action'],
                        properties: {
                            action: {const: 'update'}
                        }
                    },
                    {
                        type: 'object',
                        additionalProperties: true,
                        required: ['action'],
                        properties: {
                            action: {const: 'delete'}
                        }
                    },
                ]
            }
        }
    }
}
```
Notice `additionalProperties: true` in each `if:` it means we are validating only part of object and `additionalProperties: false` in `then:` with same properties from `if:` which means we are validating hole object.
Also we need last `else: {oneOf: [...]}` to throw error that none of `if:` is not matched.

## Schema methods

Another great way to extend a schema is to use it methods.

Example schema
```js
User = {
    id: number,
    [name]: string,
}
```

### prop

Returns schema of property.

Here good way to reuse schema props, even if they super simple like `number`

```js
schema = {
    id: User.prop('id')
}

schema == {
    id: number
}
```

### props

Alias: `pick`

Return "object" schema of props

```js
schema = User.props('id', 'name')
 
schema == {
    id: number,
    [name]: string,
}
```

### merge

Aliases: `add`, `assign`, `extend`

Returns extended schema

```js
schema = User.merge({token: uuid})
 
schema == {
    id: number,
    [name]: string,
    token: uuid,
}
```

### remove

Alias: `omit`

Returns schema without props

```js
schema = User.remove('id')
 
schema == {
    [name]: string
}
```

### required

Returns same schema, only with required props. Can take many props names.

```js
schema = User.required('name')

schema == {
    id: number,
    name: string,
}
```

### notRequired

Alias: `optional`

Make fields optional

```js
schema = User.notRequired('id')

schema == {
    [id]: number,
    [name]: string,
}
```

### set

Set schema option like `additionalProperties` or `minLength`

```js
schema = User.set('additionalProperties', true)

schema == {
    type: "object",
    additionalProperties: true,
    required: ['id'],
    properties: {
        id: {type: "number"},
        name: {type: "string"},
    },
}

schema = {search: string.set('minLength', 3)}

schema == {
    search: {
        type: "string",
        minLength: 3,
    }
}
```

### get

Return schema option value like `minLength`

```js
schema = {
    search: string.set('minLength', User.prop('name').get('minLength'))
}
```

## Schema options as methods

All [schemas options](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md#keywords-for-numbers) are duplicated as methods
```js
schema = {
    id: number.minimum(1),
    search: string.minLength(3).maxLength(20),
}

schema = User.additionalProperties(true).maxProperties(10)
```

## Object schema inline options

All [object options](https://github.com/ajv-validator/ajv/blob/master/docs/json-schema.md#keywords-for-objects) can be specified inline with properties with `$` sign at the beginning of option name
```js
schema = {
    id: number,
    
    $additionalProperties: true,
    $maxProperties: 10,
}

schema == {
    type: 'object',
    additionalProperties: true,
    maxProperties: 10,
    required: ['id'],
    properties: {
        id: {type: 'number'}
    }
}
```