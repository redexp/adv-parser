import * as t from '@babel/types';
import {ParserOptions} from '@babel/parser';

declare function parseSchema(code: Code, params?: Params): JSONSchema;

export default parseSchema;

export function generateAjvSchema(ast: ADV_AST, params?: Params): JSONSchema;
export function getAstSchema(code: Code, params?: {schemas?: Schemas} & ToAstParams): ADV_AST;
export function astToAjvSchema(ast: ADV_AST, params?: Params): JSONSchemaAST;
export function jsonSchemaAstToJsonSchema(schema: JSONSchemaAST): JSONSchema;
export function jsonSchemaAstToJsonSchemaString(schema: JSONSchemaAST): string;

export type parseAdvToAst = typeof getAstSchema;
export type advAstToJsonSchema = typeof generateAjvSchema;
export type advAstToJsonSchemaAst = typeof astToAjvSchema;

export type Code = string|SchemaAsFunction;

export type SchemaAsFunction = (Name?: any) => any;

export type Params = {
    schemas?: Schemas,
    methods?: {[name: string]: Method},
    functions?: {[name: string]: (args: AST[], params?: Object) => AST},
    objectOptions?: {[name: string]: Method},
    schemaVersion?: "07" | "2019" | "2020"
} & ToAstParams;

export type ToAstParams = Pick<ParserOptions, 'sourceFilename' | 'startLine' | 'startColumn'>;

export type Schemas = {[name: string]: AST};

export type Method = (schema: AST, args: AST[], params?: Object) => AST;

export type JSONSchema = {
    type: string,
    [prop: string]: any,
};

export type AjvSchema = JSONSchema;

export type AST =
      t.AssignmentExpression
    | t.BinaryExpression
    | t.Identifier
    | t.MemberExpression
    | t.NullLiteral
    | t.ObjectExpression
    | t.ArrayExpression
    | t.LogicalExpression
    | t.NumericLiteral
    | t.UnaryExpression
    | t.StringLiteral
    | t.BooleanLiteral
    | t.RegExpLiteral
    | t.CallExpression
    | t.ArrowFunctionExpression
    | t.ConditionalExpression
;

export type ADV_AST = AST;
export type JSONSchemaAST = t.ObjectExpression;