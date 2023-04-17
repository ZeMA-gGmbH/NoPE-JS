/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */
import { IBaseNode } from "./INodes";
import { IBaseEdge } from "./IEdges";
export interface INetwork<
  N extends IBaseNode = IBaseNode,
  E extends IBaseEdge = IBaseEdge
> {
  modelData: any;
  linkKeyProperty: "id";
  linkFromPortIdProperty: "fromPortId";
  linkToPortIdProperty: "toPortId";
  nodeDataArray: N[];
  linkDataArray: E[];
}
