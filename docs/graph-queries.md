# Graph tools and return contracts

These fixed-purpose, parameterised queries run in `src/lib/ops.ts`. Browser text never becomes Cypher. `getState()` composes the read tools; `answerQuestion()` selects an owner, evidence, impact, or unsupported-question response from their results.

## Supply context

Parameter: `componentId = CMP-14`. Returns one supplier, supply, and inventory context.

```cypher
MATCH (supplier:Supplier)-[link:SUPPLIES]->(component:Component {id:$componentId})
MATCH (supply:Supply)-[:FOR_COMPONENT]->(component)
MATCH (lot:InventoryLot)-[:FOR_COMPONENT]->(component)
RETURN supplier.name AS supplier, component.name AS component, supply.id AS supplyId,
       supply.quantity AS supplyQuantity, lot.quantity AS stockQuantity,
       supply.plannedDate AS plannedDate, supply.currentDate AS currentDate,
       link.sourceId AS supplierSourceId, lot.sourceId AS stockSourceId
```

Baseline result: Kestrel Components, M14 drive motor, DEL-204, six inbound units, two stock units, planned/current date 2026-10-20, SRC-PO-204.

## Connected commitments and owners

Parameter: `componentId`. This traversal is necessary to find the two products and three customer commitments sharing the motor.

```cypher
MATCH (component:Component {id:$componentId})<-[requirement:REQUIRES]-(product:Product)
      <-[:FOR_PRODUCT]-(order:Order)-[:FOR_CUSTOMER]->(customer:Customer)
OPTIONAL MATCH (order)-[:OWNED_BY]->(person:Person)
RETURN order.id AS id, product.name AS product, order.quantity AS units,
       order.dueDate AS dueDate, customer.name AS customer,
       requirement.quantity AS quantity, requirement.sourceId AS bomSourceId,
       order.sourceId AS orderSourceId, person.name AS owner,
       person.sourceId AS ownerSourceId
ORDER BY order.dueDate, order.id
```

Required motors are `units * quantity`: 4, 3, and 1. SO-1043 has a null owner and displays an ownership gap. Allocation in `src/lib/allocation.ts` uses stable due-date/ID order; inbound stock is eligible on or after its arrival date. The delay result is shortages 2, 3, 0.

## Current source and retained history

Parameter: `supplyId = DEL-204`. Newest recorded event selects the current supply source; with no events the purchase order controls the date.

```cypher
MATCH (event:SupplyEvent)-[:UPDATES]->(supply:Supply {id:$supplyId})
RETURN event.id AS id, event.kind AS kind, event.arrivalDate AS arrivalDate,
       event.note AS note, event.recordedAt AS recordedAt, event.sourceId AS sourceId
ORDER BY event.recordedAt DESC
```

```cypher
MATCH (source:SourceRecord)
RETURN source.id AS id, source.title AS title, source.kind AS kind,
       source.body AS body, source.recordedAt AS recordedAt, source.status AS status
ORDER BY source.id
```

The seed connects SRC-PLAN-OLD (18 October, superseded) to SRC-PO-204 (20 October). Each later update creates a source and event, links the previous source with `SUPERSEDED_BY`, marks it superseded, and changes `Supply.currentDate`. No old source is deleted.

## Review queue

```cypher
MATCH (action:Action)
RETURN action.id AS id, action.orderId AS orderId, action.title AS title,
       action.status AS status, action.reviewer AS reviewer,
       action.reviewedAt AS reviewedAt, action.sourceId AS sourceId
ORDER BY action.createdAt DESC
```

`recordDelay()` creates one proposed action for each at-risk order, linked to the event by `RESPONDS_TO`. Review parameters are validated ID, approved/rejected decision, reviewer name, and server timestamp:

```cypher
MATCH (action:Action {id:$id, status:'proposed'})
SET action.status = $decision, action.reviewer = $reviewer,
    action.reviewedAt = $reviewedAt
RETURN action.id AS id
```

A second review cannot overwrite a previous decision. When recovery removes every shortage, remaining proposed actions become superseded; approved/rejected records remain intact. Approval records a decision and sends no external communication.
