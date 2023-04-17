/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

export type EDGE_TYPE_INFO_CONSUME_DATA = "info:consume:data";
export type EDGE_TYPE_INFO_CONSUME_EVENT = "info:consume:event";
export type EDGE_TYPE_INFO_CONSUME_PATH = "info:consume:path";
export type EDGE_TYPE_INFO_IS_SUB_INFO = "info:is-child";
export type EDGE_TYPE_LOGIC_AVOIDS = "logic:avoid";
export type EDGE_TYPE_LOGIC_CONSUME_TOKEN = "logic:token:consume";
export type EDGE_TYPE_LOGIC_PRODUCE_TOKEN = "logic:token:produce";
export type EDGE_TYPE_LOGIC_RELEASES = "logic:release";
export type EDGE_TYPE_LOGIC_REMOVE_RELEASES = "logic:lock";
export type EDGE_TYPE_LOGIC_REQUIRES = "logic:require";
export type EDGE_TYPE_LOGIC_TRIGGERS = "logic:trigger";
export type EDGE_TYPE_PLANNER_AVOIDS = "logic:planner:avoids";
export type EDGE_TYPE_PLANNER_LEADS_TO = "logic:planner:leads-to";
export type EDGE_TYPE_PLANNER_RELEASES = "logic:planner:releases";
export type EDGE_TYPE_PLANNER_REQUIRES = "logic:planner:requires";
export type VALID_EDGES =
  | EDGE_TYPE_INFO_CONSUME_DATA
  | EDGE_TYPE_INFO_CONSUME_EVENT
  | EDGE_TYPE_INFO_CONSUME_PATH
  | EDGE_TYPE_INFO_IS_SUB_INFO
  | EDGE_TYPE_LOGIC_AVOIDS
  | EDGE_TYPE_LOGIC_CONSUME_TOKEN
  | EDGE_TYPE_LOGIC_PRODUCE_TOKEN
  | EDGE_TYPE_LOGIC_RELEASES
  | EDGE_TYPE_LOGIC_REMOVE_RELEASES
  | EDGE_TYPE_LOGIC_REQUIRES
  | EDGE_TYPE_LOGIC_TRIGGERS
  | EDGE_TYPE_PLANNER_AVOIDS
  | EDGE_TYPE_PLANNER_LEADS_TO
  | EDGE_TYPE_PLANNER_RELEASES
  | EDGE_TYPE_PLANNER_REQUIRES;

export const EDGE_TYPE_INFO_CONSUME_DATA: EDGE_TYPE_INFO_CONSUME_DATA =
  "info:consume:data";
export const EDGE_TYPE_INFO_CONSUME_EVENT: EDGE_TYPE_INFO_CONSUME_EVENT =
  "info:consume:event";
export const EDGE_TYPE_INFO_CONSUME_PATH: EDGE_TYPE_INFO_CONSUME_PATH =
  "info:consume:path";
export const EDGE_TYPE_INFO_IS_SUB_INFO: EDGE_TYPE_INFO_IS_SUB_INFO =
  "info:is-child";
export const EDGE_TYPE_LOGIC_AVOIDS: EDGE_TYPE_LOGIC_AVOIDS = "logic:avoid";
export const EDGE_TYPE_LOGIC_CONSUME_TOKEN: EDGE_TYPE_LOGIC_CONSUME_TOKEN =
  "logic:token:consume";
export const EDGE_TYPE_LOGIC_PRODUCE_TOKEN: EDGE_TYPE_LOGIC_PRODUCE_TOKEN =
  "logic:token:produce";
export const EDGE_TYPE_LOGIC_RELEASES: EDGE_TYPE_LOGIC_RELEASES =
  "logic:release";
export const EDGE_TYPE_LOGIC_REMOVE_RELEASES: EDGE_TYPE_LOGIC_REMOVE_RELEASES =
  "logic:lock";
export const EDGE_TYPE_LOGIC_REQUIRES: EDGE_TYPE_LOGIC_REQUIRES =
  "logic:require";
export const EDGE_TYPE_LOGIC_TRIGGERS: EDGE_TYPE_LOGIC_TRIGGERS =
  "logic:trigger";
export const EDGE_TYPE_PLANNER_AVOIDS: EDGE_TYPE_PLANNER_AVOIDS =
  "logic:planner:avoids";
export const EDGE_TYPE_PLANNER_LEADS_TO: EDGE_TYPE_PLANNER_LEADS_TO =
  "logic:planner:leads-to";
export const EDGE_TYPE_PLANNER_RELEASES: EDGE_TYPE_PLANNER_RELEASES =
  "logic:planner:releases";
export const EDGE_TYPE_PLANNER_REQUIRES: EDGE_TYPE_PLANNER_REQUIRES =
  "logic:planner:requires";
export const VALID_EDGES: Array<VALID_EDGES> = [
  EDGE_TYPE_INFO_CONSUME_DATA,
  EDGE_TYPE_INFO_CONSUME_EVENT,
  EDGE_TYPE_INFO_CONSUME_PATH,
  EDGE_TYPE_INFO_IS_SUB_INFO,
  EDGE_TYPE_LOGIC_AVOIDS,
  EDGE_TYPE_LOGIC_CONSUME_TOKEN,
  EDGE_TYPE_LOGIC_PRODUCE_TOKEN,
  EDGE_TYPE_LOGIC_RELEASES,
  EDGE_TYPE_LOGIC_REMOVE_RELEASES,
  EDGE_TYPE_LOGIC_REQUIRES,
  EDGE_TYPE_LOGIC_TRIGGERS,
  EDGE_TYPE_PLANNER_AVOIDS,
  EDGE_TYPE_PLANNER_LEADS_TO,
  EDGE_TYPE_PLANNER_RELEASES,
  EDGE_TYPE_PLANNER_REQUIRES,
];

export interface IBaseEdge {
  from: string | number;
  to: string | number;
  category: VALID_EDGES;
  fromPortId: string;
  toPortId: string;
  id: string | number;
}

export interface PE extends Partial<IBaseEdge> {}
