import {Expression} from '@babel/types';

declare function parseSchema(code: Code, params?: Params): AjvSchema;

export default parseSchema;

export function generateAjvSchema(ast: Expression, params?: Params): AjvSchema;
export function getAstSchema(code: Code, params?: {schemas?: Schemas}): Expression;
export function astToAjvSchema(ast: Expression, params?: Params): Expression;

export type Code = string|SchemaAsFunction;

export type SchemaAsFunction = (Name?: any) => any;

export interface Params {
    schemas?: Schemas,
    methods?: {[name: string]: Method},
    functions?: {[name: string]: (args: Expression[], params?: Object) => Expression},
    objectOptions?: {[name: string]: Method},
    schemaVersion?: "07" | "2019" | "2020"
}

export type Schemas = {[name: string]: Expression};

export type Method = (schema: Expression, args: Expression[], params?: Object) => Expression;

export interface AjvSchema {
    type: string,
    [prop: string]: any,
}