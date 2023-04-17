/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

export type PORT_AVOID_TOKEN = "transition.input.avoid";
export type PORT_CONSUME_TOKEN = "transition.input.consume";
export type PORT_REQUIRE_TOKEN = "transition.input.require";
export type PORT_PRODUCE_TOKEN = "transition.output.produce";
export type PORT_PLACE = "place";

export type VALID_PETRINET_PORTS =
  | PORT_AVOID_TOKEN
  | PORT_CONSUME_TOKEN
  | PORT_REQUIRE_TOKEN
  | PORT_PRODUCE_TOKEN
  | PORT_PLACE;

export type PORT_DATA = "data";
export type PORT_EVENT = "event";
export type PORT_FUNCTION = "function";

export type VALID_BASE_PORTS = PORT_DATA | PORT_EVENT | PORT_FUNCTION;

export type PORT_FLOW_OP_EXECUTE = "flow.operation.start";
export type PORT_FLOW_OP_DONE = "flow.operation.done";
export type PORT_FLOW_OP_ERROR = "flow.operation.error";

export type VALID_FLOW_PORTS =
  | PORT_FLOW_OP_EXECUTE
  | PORT_FLOW_OP_DONE
  | PORT_FLOW_OP_ERROR;

export type PORT_ACTION_FIRE = "transition.control.fire";
export type PORT_ACTION_FIRED = "transition.control.fired";
export type PORT_ACTION_RELEASE = "transition.control.release";
export type PORT_ACTION_LOCK = "transition.control.lock";

export type VALID_ACTION_PORTS =
  | PORT_ACTION_FIRE
  | PORT_ACTION_FIRED
  | PORT_ACTION_RELEASE
  | PORT_ACTION_LOCK;

export type PORT_SERVICE_DONE = "service.done";
export type PORT_SERVICE_ERROR = "service.error";
export type PORT_SERVICE_RESULT = "service.result";

export type VALID_SERVICE_PORTS =
  | PORT_SERVICE_DONE
  | PORT_SERVICE_ERROR
  | PORT_SERVICE_RESULT;

export type VALID_PORTS =
  | VALID_PETRINET_PORTS
  | VALID_BASE_PORTS
  | VALID_FLOW_PORTS
  | VALID_ACTION_PORTS
  | VALID_SERVICE_PORTS;

export type NODE_TYPE_GROUP = "node:group";
export type NODE_TYPE_CONSTANT = "node:data:constant";
export type NODE_TYPE_DATA_TO_TOKEN = "node:converter:data-to-token";
export type NODE_TYPE_TOKEN_TO_DATA = "node:converter:token-to-data";
export type NODE_TYPE_DATA_TO_ON_TRUE = "node:converter:data-to-on-true";
export type NODE_TYPE_DATA_TO_ON_CHANGE = "node:converter:data-to-on-change";
export type NODE_TYPE_EVENT_TO_DATA = "node:converter:event-to-data";

export type NODE_TYPE_START = "node:flow:start";
export type NODE_TYPE_FLOW_OPERATION = "node:flow:operation";
export type NODE_TYPE_FLOW_SYNC = "node:flow:sync";
export type NODE_TYPE_FLOW_IF = "node:flow:if";
export type NODE_TYPE_WAIT_FOR = "node:flow:wait-for";
export type NODE_TYPE_PLACE = "node:petrinet:place";
export type NODE_TYPE_TRANSITION = "node:petrinet:transition";
export type NODE_TYPE_VAR = "node:data:constant";
export type NODE_TYPE_DATA_IF = "node:data:if";
export type NODE_TYPE_BOOL_NOT = "node:bool:not";
export type NODE_TYPE_BOOL_OR = "node:bool:or";
export type NODE_TYPE_BOOL_AND = "node:bool:and";
export type NODE_TYPE_BOOL_XOR = "node:bool:xor";
export type NODE_TYPE_MODULE = "node:module";

export type VALID_NODES =
  | NODE_TYPE_GROUP
  | NODE_TYPE_CONSTANT
  | NODE_TYPE_DATA_TO_TOKEN
  | NODE_TYPE_START
  | NODE_TYPE_FLOW_OPERATION
  | NODE_TYPE_FLOW_SYNC
  | NODE_TYPE_FLOW_IF
  | NODE_TYPE_WAIT_FOR
  | NODE_TYPE_PLACE
  | NODE_TYPE_TOKEN_TO_DATA
  | NODE_TYPE_TRANSITION
  | NODE_TYPE_VAR
  | NODE_TYPE_MODULE
  | NODE_TYPE_DATA_IF
  | NODE_TYPE_BOOL_NOT
  | NODE_TYPE_BOOL_OR
  | NODE_TYPE_BOOL_AND
  | NODE_TYPE_BOOL_XOR
  | NODE_TYPE_DATA_TO_ON_TRUE
  | NODE_TYPE_DATA_TO_ON_CHANGE
  | NODE_TYPE_EVENT_TO_DATA
  | VALID_PORTS;

export const PORT_AVOID_TOKEN: PORT_AVOID_TOKEN = "transition.input.avoid";
export const PORT_CONSUME_TOKEN: PORT_CONSUME_TOKEN =
  "transition.input.consume";
export const PORT_REQUIRE_TOKEN: PORT_REQUIRE_TOKEN =
  "transition.input.require";
export const PORT_PRODUCE_TOKEN: PORT_PRODUCE_TOKEN =
  "transition.output.produce";
export const PORT_PLACE: PORT_PLACE = "place";

export const VALID_PETRINET_PORTS: VALID_PETRINET_PORTS[] = [
  PORT_AVOID_TOKEN,
  PORT_CONSUME_TOKEN,
  PORT_REQUIRE_TOKEN,
  PORT_PRODUCE_TOKEN,
  PORT_PLACE,
];

export const PORT_DATA: PORT_DATA = "data";
export const PORT_EVENT: PORT_EVENT = "event";
export const PORT_FUNCTION: PORT_FUNCTION = "function";

export const VALID_BASE_PORTS: VALID_BASE_PORTS[] = [
  PORT_DATA,
  PORT_EVENT,
  PORT_FUNCTION,
];

export const PORT_FLOW_OP_EXECUTE: PORT_FLOW_OP_EXECUTE =
  "flow.operation.start";
export const PORT_FLOW_OP_DONE: PORT_FLOW_OP_DONE = "flow.operation.done";
export const PORT_FLOW_OP_ERROR: PORT_FLOW_OP_ERROR = "flow.operation.error";

export const VALID_FLOW_PORTS: VALID_FLOW_PORTS[] = [
  PORT_FLOW_OP_EXECUTE,
  PORT_FLOW_OP_DONE,
  PORT_FLOW_OP_ERROR,
];

export const PORT_ACTION_FIRE: PORT_ACTION_FIRE = "transition.control.fire";
export const PORT_ACTION_FIRED: PORT_ACTION_FIRED = "transition.control.fired";
export const PORT_ACTION_RELEASE: PORT_ACTION_RELEASE =
  "transition.control.release";
export const PORT_ACTION_LOCK: PORT_ACTION_LOCK = "transition.control.lock";

export const VALID_ACTION_PORTS: VALID_ACTION_PORTS[] = [
  PORT_ACTION_FIRE,
  PORT_ACTION_FIRED,
  PORT_ACTION_RELEASE,
  PORT_ACTION_LOCK,
];

export const PORT_SERVICE_DONE: PORT_SERVICE_DONE = "service.done";
export const PORT_SERVICE_ERROR: PORT_SERVICE_ERROR = "service.error";
export const PORT_SERVICE_RESULT: PORT_SERVICE_RESULT = "service.result";

export const VALID_SERVICE_PORTS = [
  PORT_SERVICE_DONE,
  PORT_SERVICE_ERROR,
  PORT_SERVICE_RESULT,
];

export const VALID_PORTS: VALID_PORTS[] = [
  ...VALID_PETRINET_PORTS,
  ...VALID_BASE_PORTS,
  ...VALID_FLOW_PORTS,
  ...VALID_ACTION_PORTS,
  ...VALID_SERVICE_PORTS,
];

export const NODE_TYPE_GROUP: NODE_TYPE_GROUP = "node:group";
export const NODE_TYPE_CONSTANT: NODE_TYPE_CONSTANT = "node:data:constant";
export const NODE_TYPE_DATA_TO_TOKEN: NODE_TYPE_DATA_TO_TOKEN =
  "node:converter:data-to-token";
export const NODE_TYPE_START: NODE_TYPE_START = "node:flow:start";
export const NODE_TYPE_FLOW_OPERATION: NODE_TYPE_FLOW_OPERATION =
  "node:flow:operation";
export const NODE_TYPE_PLACE: NODE_TYPE_PLACE = "node:petrinet:place";
export const NODE_TYPE_TOKEN_TO_DATA: NODE_TYPE_TOKEN_TO_DATA =
  "node:converter:token-to-data";
export const NODE_TYPE_TRANSITION: NODE_TYPE_TRANSITION =
  "node:petrinet:transition";
export const NODE_TYPE_VAR: NODE_TYPE_VAR = "node:data:constant";
export const NODE_TYPE_MODULE: NODE_TYPE_MODULE = "node:module";

export const NODE_TYPE_DATA_IF: NODE_TYPE_DATA_IF = "node:data:if";
export const NODE_TYPE_BOOL_NOT: NODE_TYPE_BOOL_NOT = "node:bool:not";
export const NODE_TYPE_BOOL_OR: NODE_TYPE_BOOL_OR = "node:bool:or";
export const NODE_TYPE_BOOL_AND: NODE_TYPE_BOOL_AND = "node:bool:and";
export const NODE_TYPE_BOOL_XOR: NODE_TYPE_BOOL_XOR = "node:bool:xor";
export const NODE_TYPE_FLOW_SYNC: NODE_TYPE_FLOW_SYNC = "node:flow:sync";
export const NODE_TYPE_FLOW_IF: NODE_TYPE_FLOW_IF = "node:flow:if";
export const NODE_TYPE_WAIT_FOR: NODE_TYPE_WAIT_FOR = "node:flow:wait-for";

export const NODE_TYPE_DATA_TO_ON_CHANGE: NODE_TYPE_DATA_TO_ON_CHANGE =
  "node:converter:data-to-on-change";
export const NODE_TYPE_DATA_TO_ON_TRUE: NODE_TYPE_DATA_TO_ON_TRUE =
  "node:converter:data-to-on-true";
export const NODE_TYPE_EVENT_TO_DATA: NODE_TYPE_EVENT_TO_DATA =
  "node:converter:event-to-data";

export const VALID_NODES: Array<VALID_NODES> = [
  NODE_TYPE_GROUP,
  NODE_TYPE_CONSTANT,
  NODE_TYPE_DATA_TO_TOKEN,
  NODE_TYPE_FLOW_OPERATION,
  NODE_TYPE_PLACE,
  NODE_TYPE_TOKEN_TO_DATA,
  NODE_TYPE_TRANSITION,
  NODE_TYPE_MODULE,
  NODE_TYPE_VAR,
  NODE_TYPE_DATA_IF,
  NODE_TYPE_BOOL_NOT,
  NODE_TYPE_BOOL_OR,
  NODE_TYPE_BOOL_AND,
  NODE_TYPE_BOOL_XOR,
  NODE_TYPE_FLOW_IF,
  NODE_TYPE_FLOW_SYNC,
  NODE_TYPE_DATA_TO_ON_TRUE,
  NODE_TYPE_DATA_TO_ON_CHANGE,
  NODE_TYPE_EVENT_TO_DATA,
];
VALID_PORTS.map((id) => VALID_NODES.push(id));

/**
 * Information of a base node in a graph.
 */
export interface IBaseNode {
  key: string | number;
  location: { x: number; y: number };
  category?: VALID_NODES;
  size?: {
    width: number;
    height: number;
  };
  group?: number | string;
  isGroup?: boolean;
  color?: string;
}

export interface IPort {
  label: string;
  portId: string;
  type: VALID_PORTS;
  allowMultipleInputs?: true;
  portColor?: string;
}

export interface PN extends Partial<IBaseNode> {}
