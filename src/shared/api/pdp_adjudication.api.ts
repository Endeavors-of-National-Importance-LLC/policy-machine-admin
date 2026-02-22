import * as Model from '@/generated/grpc/v1/model';
import { AdminAdjudicationServiceClientImpl, ResourceAdjudicationServiceClientImpl } from '@/generated/grpc/v1/pdp_adjudication';
import * as PdpAdjudication from '@/generated/grpc/v1/pdp_adjudication';
import { rpc, argsToValueMap } from './pdp.utils';

const adjudicationClient = new AdminAdjudicationServiceClientImpl(rpc);
const resourceAdjudicationClient = new ResourceAdjudicationServiceClientImpl(rpc);

// === Adjudication Methods ===

export async function adjudicateOperation(
  operationName: string,
  args: Record<string, any>
): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  const request = PdpAdjudication.OperationRequest.create({
    name: operationName,
    args: argsToValueMap(args),
  });

  return adjudicationClient.adjudicateOperation(request);
}

export async function adjudicateRoutine(
  operations: PdpAdjudication.OperationRequest[]
): Promise<PdpAdjudication.AdjudicateRoutineResponse> {
  const request = PdpAdjudication.RoutineRequest.create({
    operations,
  });

  return adjudicationClient.adjudicateRoutine(request);
}

export async function executePML(pml: string): Promise<PdpAdjudication.ExecutePMLResponse> {
  const request = PdpAdjudication.ExecutePMLRequest.create({ pml });
  return adjudicationClient.executePML(request);
}

export async function adjudicateResourceOperation(
  operationName: string,
  args: Record<string, any>
): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  const request = PdpAdjudication.OperationRequest.create({
    name: operationName,
    args: argsToValueMap(args),
  });

  return resourceAdjudicationClient.adjudicateResourceOperation(request);
}

// === Node Creation Operations ===

export async function createPolicyClass(name: string): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('create_policy_class', { name });
}

export async function createUserAttribute(name: string, descendants: bigint[] = []): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('create_user_attribute', { name, descendants });
}

export async function createObjectAttribute(name: string, descendants: bigint[] = []): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('create_object_attribute', { name, descendants });
}

export async function createUser(name: string, descendants: bigint[] = []): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('create_user', { name, descendants });
}

export async function createObject(name: string, descendants: bigint[] = []): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('create_object', { name, descendants });
}

// === Node Management Operations ===

export async function deleteNode(id: bigint): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('delete_node', { id });
}

export async function setNodeProperties(id: bigint, properties: Record<string, string>): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('set_node_properties', { id, properties });
}

// === Assignment Operations ===

export async function assign(ascendantId: bigint, descendantIds: bigint[]): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('assign', { ascendant: ascendantId, descendants: descendantIds });
}

export async function deassign(ascendantId: bigint, descendantIds: bigint[]): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('deassign', { ascendant: ascendantId, descendants: descendantIds });
}

// === Association Operations ===

export async function associate(uaId: bigint, targetId: bigint, accessRights: string[]): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('associate', { ua: uaId, target: targetId, arset: accessRights });
}

export async function dissociate(uaId: bigint, targetId: bigint): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('dissociate', { ua: uaId, target: targetId });
}

// === Resource Access Rights Operations ===

export async function setResourceAccessRights(accessRights: string[]): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('set_resource_access_rights', { arset: accessRights });
}

export async function deleteOperation(name: string): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('delete_operation', { name });
}

// === Prohibition Operations ===

export async function createProhibition(
  name: string,
  subjectNodeId: bigint | undefined,
  subjectProcess: string | undefined,
  accessRights: string[],
  isConjunctive: boolean,
  inclusionSetIds: bigint[],
  exclusionSetIds: bigint[]
): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  if (subjectProcess) {
    return adjudicateOperation('create_process_prohibition', {
      name,
      node: subjectNodeId,
      process: subjectProcess,
      arset: accessRights,
      is_conjunctive: isConjunctive,
      inclusion_set: inclusionSetIds,
      exclusion_set: exclusionSetIds,
    });
  } else {
    return adjudicateOperation('create_node_prohibition', {
      name,
      node: subjectNodeId,
      arset: accessRights,
      is_conjunctive: isConjunctive,
      inclusion_set: inclusionSetIds,
      exclusion_set: exclusionSetIds,
    });
  }
}

export async function deleteProhibition(name: string): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('delete_prohibition', { name });
}

// === Obligation Operations ===

export async function createObligation(
  name: string,
  authorNodeId: bigint,
  pml: string
): Promise<PdpAdjudication.ExecutePMLResponse> {
  const obligationPML = `obligation "${name}" {
  author: "${authorNodeId}"
  ${pml}
}`;

  return executePML(obligationPML);
}

export async function deleteObligation(name: string): Promise<PdpAdjudication.AdjudicateOperationResponse> {
  return adjudicateOperation('delete_obligation', { name });
}
