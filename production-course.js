/* Original systems lessons. Designs, traffic numbers, and code examples are illustrative. */
window.PRODUCTION_COURSE = {
  id: 'production',
  title: 'ML in Production',
  description: 'Follow data from ingestion to predictions. Learn storage choices, pipelines, features, deployment, scaling, and reliable operations.',
  startHint: 'Start with the data path and prediction path.',
  milestones: [['Pipeline builder', 4], ['Serving foundations', 10], ['Systems reasoning', 18]],
  sources: {
    kafka: { title: 'Apache Kafka: event streams and partitions', url: 'https://kafka.apache.org/documentation/' },
    kafkaDesign: { title: 'Apache Kafka: design and delivery semantics', url: 'https://kafka.apache.org/41/design/design/' },
    flink: { title: 'Apache Flink: recovery and end-to-end guarantees', url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/learn-flink/fault_tolerance/' },
    watermarks: { title: 'Apache Flink: event-time debugging', url: 'https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/debugging/debugging_event_time/' },
    postgres: { title: 'PostgreSQL: index concepts', url: 'https://www.postgresql.org/docs/current/indexes.html' },
    partitioning: { title: 'PostgreSQL: table partitioning', url: 'https://www.postgresql.org/docs/current/ddl-partitioning.html' },
    objectStorage: { title: 'Amazon S3: object storage overview', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html' },
    warehouse: { title: 'BigQuery: analytical warehouse overview', url: 'https://docs.cloud.google.com/bigquery/docs/introduction' },
    dynamodb: { title: 'DynamoDB: modeling for access patterns', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling.html' },
    redis: { title: 'Redis: persistence choices and durability', url: 'https://redis.io/docs/latest/management/persistence/' },
    feast: { title: 'Feast: feature platform documentation', url: 'https://docs.feast.dev/' },
    airflow: { title: 'Apache Airflow: task design and best practices', url: 'https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html' },
    registry: { title: 'MLflow: model registry workflows', url: 'https://mlflow.org/docs/latest/ml/model-registry/workflow/' },
    autoscaling: { title: 'Kubernetes: horizontal pod autoscaling', url: 'https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/' },
    batching: { title: 'NVIDIA Triton: dynamic batching', url: 'https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html' }
  },
  glossary: [
    ['Ingestion', 'Getting data from sources into the data platform under a defined schema, durability, and error-handling contract.'],
    ['Batch / stream', 'Batch processes bounded datasets. Streaming processes an ongoing event flow, usually maintaining state and handling late arrivals.'],
    ['Topic / partition / offset', 'A topic organizes events; partitions divide an ordered log; an offset identifies position within one partition.'],
    ['CDC', 'Change data capture: publish database changes for downstream systems, with source ordering and recovery considerations.'],
    ['Idempotency', 'Repeating an operation has the same intended effect as applying it once. A retry-safe upsert and an unconditional counter increment differ.'],
    ['OLTP / OLAP', 'OLTP supports transactional application access; OLAP supports analytical scans and aggregations. These are workload patterns, not universal product labels.'],
    ['Object storage', 'Durable storage of keyed objects, useful for files, datasets, and model artifacts. A query engine or table layer supplies many analytical capabilities.'],
    ['Feature store', 'A platform or pattern for defined feature computation and retrieval; offline history and online values serve different needs.'],
    ['Point-in-time correctness', 'Training features reflect what would actually have been known at the prediction time, not later events or delayed data learned afterward.'],
    ['Backpressure', 'A downstream bottleneck slows or buffers upstream work. Unbounded buffering moves the failure into memory or retention limits.'],
    ['SLO', 'A service-level objective: a stated target for a defined indicator and time window, such as the share of requests meeting a latency deadline.'],
    ['Canary / shadow', 'A canary serves a limited amount of real traffic. Shadow execution computes alongside the live path without changing its product response.'],
    ['Lineage', 'Links among source data, transformations, feature versions, training datasets, models, and deployments.'],
    ['RPO / RTO', 'Recovery point objective limits acceptable data loss; recovery time objective limits time to restore the required service.']
  ],
  lessons: [
    {
      id: 'prod-overview', phase: 'Follow the data', title: 'From a notebook to a dependable ML product', minutes: 7,
      subtitle: 'Separate learning a model from operating a complete system.', bridge: [1, 2, 25], sources: [],
      blocks: [
        { title: 'Two connected paths', body: `A notebook takes a dataset, trains a model, and reports a score. A product must also collect usable data, reproduce the dataset, publish an artifact, answer requests within a deadline, record outcomes, and recover when dependencies fail.

Think in two paths. The **data and training path** turns source records into validated events, historical tables, features, training examples, and versioned models. The **prediction path** takes a request, fetches allowed context, builds features, runs a compatible model, and returns a decision. Feedback connects them.

For an app discovery system, an app catalog may come from a transactional database, impressions and interactions from event collection, and training examples from historical processing. The serving API should not scan the entire event history for each recommendation. Much of the heavy work happens earlier.` },
        { title: 'Translate requirements into contracts', body: `Ask how many events and requests arrive, their peak rates, record sizes, permissible freshness, acceptable latency, and retention and privacy rules. A daily forecast can use batch predictions; a time-sensitive fraud decision needs a different path. Not every ML product needs a real-time stream.

A service contract defines request and response schemas, authentication, deadlines, errors, and fallback behavior. A data contract defines keys, timestamps, schema version, ownership, and quality expectations. Both need versioning and a plan for incompatible changes.

Define the business action separately from the model score. A ranker returns scores; another layer may enforce availability or policy. A calibrated risk score may support a threshold, while a ranking score is not automatically a probability.` },
        { title: 'Start small and assign ownership', body: `At modest scale, a relational database, scheduled job, object storage, and a simple serving process may be enough. Distributed streaming, a feature platform, or Kubernetes should solve a measured requirement, not decorate an architecture diagram.

Data engineering often owns collection and tables; ML teams own features, training, and evaluation; application or platform teams own request paths and deployment. Exact ownership varies. Name who maintains each contract and responds to a failure.

A strong design explains what happens if an event is duplicated, a feature is stale, a model cannot load, or a dependency times out. Reliability is part of the system, not a final dashboard added after modeling.` }
      ],
      prompt: 'Explain the data/training path and prediction path for an ML product. Name the first non-model requirements you would clarify.',
      answer: `“I would separate source collection, validated history, feature generation, and reproducible training from the low-latency request path that fetches features and serves a versioned model. I would clarify workload, freshness, latency, allowed data, and recovery requirements. I would start with a simple architecture and define ownership, schemas, fallbacks, and feedback logging before introducing distributed components.”`,
      pitfalls: ['Calling an HTTP wrapper around a notebook a complete production system.', 'Assuming every feature must be calculated from raw history during a request.', 'Choosing infrastructure before defining scale, freshness, and failure requirements.'],
      checkpoint: { question: 'What is usually wrong with scanning all historical interaction events for every recommendation request?', options: ['It makes request latency depend on a large analytical workload', 'Historical data is never useful', 'Models cannot consume aggregates'], correct: 0, explanations: ['Correct. Heavy historical computation is generally separated from the deadline-sensitive serving path.', 'History can be useful after suitable feature computation and permitted access.', 'Aggregates are common model features; they should be computed and retrieved appropriately.'] }
    },
    {
      id: 'prod-ingestion', phase: 'Follow the data', title: 'Build an ingestion pipeline with clear event contracts', minutes: 9,
      subtitle: 'Capture, validate, buffer, process, store, and observe the data.', bridge: [8, 9, 25], sources: ['kafka'],
      pipeline: [
        { name: 'Source', detail: 'An application event or database change carries a stable identity, event time, schema version, and only permitted fields. Source clocks and retries need explicit handling.' },
        { name: 'Collector', detail: 'Authenticate and validate input. Record receipt time. Acknowledge according to a defined durability contract, not merely because a process placed the payload in volatile memory.' },
        { name: 'Durable log', detail: 'A partitioned broker can buffer bursts and support replay. Retention is bounded; offsets, partition choice, producer settings, and consumer behavior determine the actual guarantees.' },
        { name: 'Processor', detail: 'Validate deeply, deduplicate, enrich with time-appropriate metadata, and compute outputs. Quarantine bad records and make retries safe instead of silently skipping them.' },
        { name: 'Historical storage', detail: 'Publish validated records or snapshots for analytics and training. Keep an auditable raw layer only as allowed by retention and deletion policy, then maintain clean, documented tables.' },
        { name: 'Feature consumers', detail: 'Independent downstream jobs build historical training features or online updates. Monitor completeness, delay, and freshness; successful transport does not prove correct model inputs.' }
      ],
      blocks: [
        { title: 'Define the event before selecting a broker', body: `An event should say what happened, to which entity, and when. Use a stable event ID across producer retries, an event type, an event-time timestamp, a schema version, and a receipt or processing timestamp added by the platform. Include request or session IDs only when permitted and needed.

For a discovery impression, specify whether it means a result was returned, rendered, or visible. For a download, define what counts and how it can be attributed later. A technically valid JSON payload can still be semantically wrong for training.

The example below is fictitious. The collector adds received_at; it should not trust clients to supply the authoritative receipt time. Validate required fields and types, allowable event types, timestamp plausibility, payload size, and access permissions. Do not log raw secrets or unnecessary personal fields.`, codeLabel: 'Illustrative event contract', code: `{
  "event_id": "evt_example_001",
  "event_type": "app_impression",
  "schema_version": 1,
  "entity_id": "permitted_entity_key",
  "item_id": "app_example_42",
  "event_time": "2026-01-15T10:00:00Z",
  "request_id": "request_example_7"
}` },
        { title: 'Choose ingestion paths by source and freshness', body: `Applications can send events to a collector or durable broker. Transactional data can be exported in batches or propagated with **change data capture (CDC)**. CDC reads committed database changes and needs a source position, initial snapshot strategy, schema-change handling, and recovery plan.

For ordinary event streams, a broker such as Kafka can decouple producers from consumers. Partition keys determine where related records land. Each downstream consumer group can read independently, so one analytics job need not compete for the same processing assignment as another group.

A queue or log is not mandatory for a small daily workload. A scheduled file or database export can be simpler when its freshness and recovery properties meet the requirements. Whatever the path, define when the producer considers its write safely accepted.` },
        { title: 'A practical build sequence', body: `1. Specify the contract, ownership, volume, latency, and retention.
2. Implement collection with validation and authentication.
3. Add a durable boundary when needed and choose a partitioning strategy.
4. Write retry-safe consumers and a bad-record quarantine path.
5. Publish clean data with consistent keys and timestamps.
6. Test duplicates, out-of-order events, malformed payloads, and outages.
7. Monitor rate, rejection, lag, completeness, and downstream freshness.

Keep transport acceptance, successful processing, and feature availability as distinct states. Track them independently. The explorer below follows one record through this path; it is a conceptual walkthrough, not a running broker deployment.` }
      ],
      prompt: 'Describe how you would build an ingestion pipeline for app interactions, including event fields, retries, storage, and checks.',
      answer: `“I would first define event meaning, stable IDs, timestamps, schema versions, and allowed fields. I would validate at collection and choose a durable log or batch boundary according to freshness and volume. Consumers would be retry-safe, quarantine invalid records, and publish validated history. I would test duplicate and late events, track source positions, and monitor both delivery lag and feature completeness.”`,
      pitfalls: ['Treating accepted JSON as correct ML data.', 'Generating a new event ID on every retry.', 'Acknowledging a volatile write as durably stored without a stated contract.'],
      checkpoint: { question: 'What should a retried event normally retain for deduplication?', options: ['A new random ID every time', 'Its original stable event ID', 'Only the current consumer hostname'], correct: 1, explanations: ['New IDs make retries look like distinct logical events.', 'Correct. Stable identity allows downstream operations to recognize a repeated event.', 'A consumer hostname does not identify the original business event.'] }
    },
    {
      id: 'prod-batch', phase: 'Follow the data', title: 'Batch pipelines, orchestration, and safe backfills', minutes: 8,
      subtitle: 'Build repeatable datasets before you need continuous processing.', bridge: [8, 9, 25], sources: ['airflow', 'objectStorage'],
      blocks: [
        { title: 'What a batch job actually does', body: `A batch job processes a bounded input, such as yesterday's events or a versioned snapshot. It validates, joins, aggregates, and publishes outputs. ETL transforms before loading into the target; ELT loads into the analytical platform and transforms there. The boundary varies by system.

For a first ML feature pipeline, define an input interval and data snapshot, validate schema and counts, deduplicate, join required metadata, compute features, validate the output, and publish a versioned table or file set. Do not let a downstream training job read half-written outputs.

Parquet is a columnar file format that can reduce scan work for selected columns. Object storage supplies durable files; an analytical engine or table format supplies querying and many table-level behaviors. File layout and partition choice determine whether a job scans useful data or wastes time on tiny files.` },
        { title: 'A scheduler is not the compute engine', body: `An orchestrator such as Airflow manages dependencies, retries, schedules, and run metadata. SQL engines, local workers, or distributed processors execute the heavy transformation. A directed acyclic graph (DAG) describes which tasks must finish before others can run.

Make a task depend on its declared interval and inputs, not the current wall clock. Retrying the same interval should not append duplicate rows. Use partition replacement, merge/upsert logic, or a controlled publish step according to the target's semantics.

Persist run IDs, input versions, validation outcomes, and output locations. Fail visibly on invalid required data, while quarantining individual bad records where appropriate. Retrying a permanent schema error forever is not a recovery strategy.` },
        { title: 'Backfill without rewriting production accidentally', body: `A backfill recomputes earlier intervals to fix data or add a feature. Specify the interval, source snapshots, transformation version, output destination, and whether results are historical-only or should also affect online values.

Write historical results to a separate version or staging area, validate them, then publish deliberately. A historical job must not blindly overwrite a current online feature with an older value. Preserve event-time or source-version checks on any online materialization.

Budget the extra load. A backfill can compete with regular jobs and overload a database even if each task is correct. Limit concurrency, use appropriate read paths, and verify completeness. Reproducibility means both understanding the data used and being able to rerun safely.` }
      ],
      prompt: 'Explain a daily feature DAG and how you would make a retry or backfill safe.',
      answer: `“I would define bounded source snapshots and intervals, validate and deduplicate, compute features, check outputs, and publish only complete results. The orchestrator manages dependencies while a suitable engine does the processing. Writes must be repeatable for the same interval, and a versioned backfill should be validated before promotion without overwriting fresher online state.”`,
      pitfalls: ['Using the current time to select data for a historical retry.', 'Appending the same interval again on every retry.', 'Letting a backfill overwrite current serving features without time/version checks.'],
      checkpoint: { question: 'A failed daily task is rerun for the same date. What should its output contract guarantee?', options: ['A consistent logical output without duplicate effects from the retry', 'A larger row count every time it runs', 'Automatic promotion of old values over current online features'], correct: 0, explanations: ['Correct. Retry-safe behavior is central to reliable scheduled pipelines.', 'Growing output under identical inputs can indicate duplicate writes.', 'Historical recomputation and current serving-state publication need separate controls.'] }
    },
    {
      id: 'prod-streaming', phase: 'Follow the data', title: 'Streaming, event time, duplicates, and recovery', minutes: 9,
      subtitle: 'Understand what delivery guarantees actually cover.', bridge: [8, 17, 25], sources: ['kafkaDesign', 'flink', 'watermarks'],
      blocks: [
        { title: 'Event time and arrival time differ', body: `Event time records when something happened; ingestion or processing time records when the platform saw or handled it. A mobile event can arrive late after a connection resumes. Sorting by arrival time can distort a time-window feature.

A windowed processor maintains state and uses a watermark as an event-time progress signal. A bounded-lateness policy is an assumption about arriving records, not proof that no older event can ever arrive. Define what happens to late events: update a result, route them for correction, or discard under a documented policy.

Check source clocks, time zones, idle partitions, and state growth. One delayed partition can hold back progress. A short-lateness threshold improves speed at a possible completeness cost; a very long threshold retains more state and delays finalization.` },
        { title: 'At-least-once needs retry-safe effects', body: `At-most-once can lose work; at-least-once can repeat it. “Exactly once” must specify its scope: broker writes, processor-managed state, or end-to-end observable effects. Checkpointing internal state does not automatically make an external database increment exactly once.

If a consumer writes an effect and crashes before acknowledging progress, it may repeat the event. Idempotent writes, deduplication tied atomically to the effect, or a coordinated transactional boundary can address that failure. An unconditional counter increment is not idempotent.

The PostgreSQL example illustrates a unique event-ID sink only. It does not by itself atomically update a second table or commit a broker offset. A later aggregate update must also be tied to accepted unique records or use a suitable transaction/checkpoint design.`, codeLabel: 'Illustrative PostgreSQL idempotent event write', code: `INSERT INTO ingestion_events
  (event_id, entity_id, event_time, received_at, event_type)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (event_id) DO NOTHING;
-- Requires a UNIQUE or PRIMARY KEY constraint on event_id.
-- Parameters are bound, not concatenated from untrusted input.` },
        { title: 'Make replay and quarantine explicit', body: `Record source positions and checkpoint relevant state. A replay is only possible while the source or archive retains the needed records. Track retention, not just whether a broker is running.

Send invalid or unprocessable records to a quarantine or dead-letter path with reason and safe diagnostic metadata. Alert and establish reprocessing ownership; a dead-letter queue that nobody reads silently loses usable data.

Test failure between reading, writing, and committing. Check whether sink effects repeat, state resumes correctly, and late corrections preserve feature semantics. End-to-end guarantees depend on compatible sources and sinks plus configuration, not on selecting a framework name.` }
      ],
      prompt: 'Explain why streaming counts can double after a crash and how you would reason about recovery guarantees.',
      answer: `“A consumer may apply an effect and crash before recording progress, causing replay. I would define the end-to-end boundary, use stable event IDs and retry-safe or transactional sink effects, and test failures around commits. I would separately handle event time, late data, checkpointed state, retention, and quarantine, rather than assume processor-level exactly-once covers every external write.”`,
      pitfalls: ['Claiming “exactly once” without naming the boundary and sink behavior.', 'Assuming a watermark makes late events impossible.', 'Putting bad records in a queue without monitoring or replay ownership.'],
      checkpoint: { question: 'Which operation is not inherently idempotent under event replay?', options: ['Upserting a fixed event by its unique ID', 'Setting a version-checked value to the same payload', 'Incrementing a counter for every delivery with no deduplication'], correct: 2, explanations: ['A well-defined unique-ID upsert can make repeated writes have one logical effect.', 'A correctly designed repeated state assignment can be retry-safe.', 'Correct. Repeated delivery can increment the same logical event multiple times.'] }
    },
    {
      id: 'prod-storage', phase: 'Choose storage and features', title: 'Which databases and storage systems, and why?', minutes: 10,
      subtitle: 'Match each access pattern to a role instead of choosing one database for everything.', bridge: [9, 25], sources: ['postgres', 'objectStorage', 'warehouse', 'dynamodb', 'redis'],
      blocks: [
        { title: 'Ask about reads, writes, and guarantees', body: `There is no single database that every ML system should use. Start with the access pattern: point lookup or large scan, row updates or append-heavy events, transactions or approximate retrieval, historical queries or fresh serving values. Then ask about size, latency, consistency, durability, privacy, and operating capacity.

A relational database is often a good starting point for catalog and application records with keys, constraints, and transactions. Analytical processing over large histories may call for columnar tables, a warehouse, or a lake with an appropriate query engine. Low-latency feature retrieval often uses indexed key-based access.

Keep roles separate in your reasoning even if one small deployment serves several roles. Starting with PostgreSQL and files is reasonable at modest scale. Adding five distributed systems without a requirement increases operational burden and more ways to fail.` },
        { title: 'A practical role-to-storage map', body: `The examples below are options, not a prescribed stack or a claim about any company's infrastructure. Performance depends on configuration and workload. “SQL versus NoSQL” is too coarse to determine latency, correctness, or scalability.

An object store is not just a table database; a broker is not your entire historical warehouse; a feature store is a platform pattern rather than necessarily a new storage engine. Redis can be configured with different persistence behaviors, so do not call every deployment either fully durable or disposable.`, table: {
          caption: 'Storage roles and example choices', headers: ['Role', 'Examples', 'Why it fits', 'Trade-off to check'], rows: [
            ['Application/catalog truth', 'PostgreSQL or MySQL', 'Transactions, constraints, indexed records, flexible SQL', 'Write capacity, query plans, replica lag, backup/restore'],
            ['Durable event buffer', 'Kafka or managed event log', 'Replayable partitioned streams and independent consumers', 'Retention, ordering scope, key skew, operational cost'],
            ['Raw history and artifacts', 'S3, GCS, Azure Blob, or compatible object storage', 'Durable file/object storage for datasets and model artifacts', 'Layout, governance, retention, query engine, request/transfer cost'],
            ['Analytical SQL', 'BigQuery, Snowflake, Redshift; ClickHouse for suitable analytical workloads', 'Columnar scans, aggregations, large historical joins', 'Freshness, concurrency, scan cost, workload-specific ingestion'],
            ['Online feature lookup', 'Redis, DynamoDB, Bigtable, Cassandra, or suitable indexed SQL', 'Entity-key retrieval and chosen latency/scaling properties', 'Consistency, hot keys, TTL, durability, item-size limits'],
            ['Document-oriented records', 'MongoDB or relational JSON capabilities', 'Document access and flexible nested attributes', 'Constraints, indexes, update patterns, schema discipline'],
            ['Lexical/vector retrieval', 'Elasticsearch/OpenSearch, pgvector, or specialized vector index', 'Text search or nearest-neighbor candidate lookup', 'Index freshness, filters, approximation recall, memory and update cost']
          ]
        } },
        { title: 'Choose the smallest system that meets the need', body: `For a toy recommendation prototype, store app metadata in PostgreSQL, write immutable training snapshots to files or object storage, and use scheduled features. If online lookups fit an index and the measured load, you may not need a separate distributed key-value store.

Introduce a warehouse when analytical joins and scans justify it, a broker when asynchronous durable event flow or replay is needed, and a dedicated online store when latency or throughput demands it. These are conditional decisions, not maturity badges.

Name the authoritative source and derived copies. Search indexes and caches often need rebuilding from truth. Establish deletion propagation and version compatibility across copies. A storage choice is only complete when you explain how it is updated, queried, recovered, and retired.` }
      ],
      prompt: 'Choose storage roles for catalog metadata, historical training data, and low-latency features. Explain the access pattern behind each choice.',
      answer: `“I would use transactional indexed storage for authoritative catalog records, durable files or analytical tables for large historical computation, and an appropriate entity-key serving store for online features if required. Exact products depend on workload and guarantees. I would start simply, measure bottlenecks, and account for source-of-truth ownership, freshness, recovery, retention, and operating cost.”`,
      pitfalls: ['Choosing one database purely because it is called NoSQL.', 'Using a warehouse scan for each deadline-sensitive feature request.', 'Calling a broker, object store, or feature platform interchangeable databases.'],
      checkpoint: { question: 'Which workload most naturally fits an analytical warehouse rather than a request-time key lookup?', options: ['Fetching one small user feature vector under a strict deadline', 'Aggregating months of events across many users for training', 'Checking one app’s availability by primary key'], correct: 1, explanations: ['A keyed serving path is generally more appropriate for that access pattern.', 'Correct. Large historical scans and joins are analytical workloads.', 'A small indexed application lookup need not require a warehouse.'] }
    },
    {
      id: 'prod-data-modeling', phase: 'Choose storage and features', title: 'Keys, indexes, partitions, and database scaling', minutes: 8,
      subtitle: 'Design the data layout around the queries the system must answer.', bridge: [9, 25], sources: ['postgres', 'partitioning', 'dynamodb'],
      blocks: [
        { title: 'Identity and the read pattern', body: `A primary key identifies a row and helps enforce uniqueness. An index supplies an access path for selected queries, at a cost in storage and write work. An index on entity and time can support recent-history lookup; indexing every field is not automatically useful.

Define stable IDs, timestamp meaning, null handling, and schema evolution. Separate catalog records from append-heavy interaction history. Document flexibility does not remove the need for a contract. Inspect query plans and measured workloads rather than assume a database label predicts performance.` },
        { title: 'Partitions, replicas, and shards', body: `Partitioning divides a logical dataset, for example by date or entity hash. It can reduce scan work and simplify retention when queries align with the layout. It does not inherently distribute every partition across separate machines.

Sharding distributes data ownership across nodes or storage units. A routing key determines where a record goes; skew can overload one shard. A read replica supplies another copy for suitable reads, but may lag and does not automatically increase primary write capacity.

Date partitioning can fit analytical history. Entity-key layout can fit serving lookups. A poorly chosen low-cardinality key can create a hot partition. State which bottleneck the proposed layout addresses.` },
        { title: 'Measure before distributing', body: `Start with appropriate indexes, query optimization, connection pooling, bounded concurrency, and compatible batched reads. N+1 feature requests create many round trips even if each query is fast. Then evaluate vertical capacity, replicas, or sharding under the actual consistency and load requirements.

A transaction provides a stated correctness boundary, not a guarantee that all distributed copies instantly agree. Decide whether stale reads are acceptable for each field, especially policy and eligibility state.

Plan backup and restore, migrations, deletion, and hotspot handling. Excellent average throughput does not make an untested recovery design adequate. Benchmark representative peaks and query mixtures, including the cost of simultaneous backfills.` }
      ],
      prompt: 'Distinguish a primary key, index, partition, replica, and shard, then explain what you would measure before scaling.',
      answer: `“I would model identity and access patterns, enforce keys, and choose indexes by measured query and write cost. Partitions divide data, replicas copy it with defined lag, and shards distribute ownership. I would measure query plans, round trips, connection pressure, hotspots, and recovery before selecting a scaling mechanism.”`,
      pitfalls: ['Claiming every partition is automatically on another machine.', 'Assuming read replicas scale all writes or have zero lag.', 'Adding indexes without checking their write cost.'],
      checkpoint: { question: 'Why might a read replica be unsuitable for strict current availability?', options: ['Replicas cannot execute queries', 'Replica lag may expose stale eligibility state', 'Indexes never work on replicas'], correct: 1, explanations: ['Replicas can serve appropriate reads.', 'Correct. The consistency and freshness contract must match the decision.', 'Index availability is not the general issue here.'] }
    },
    {
      id: 'prod-offline-features', phase: 'Choose storage and features', title: 'Historical features and point-in-time training data', minutes: 9,
      subtitle: 'Reconstruct what the system would actually have known.', bridge: [2, 8, 9], sources: ['feast'],
      blocks: [
        { title: 'Every example has a prediction time', body: `A training row identifies the entity, prediction time, available features, and later outcome. A seven-day count for a request at t must use the intended window before t, not the latest history when training runs.

An event can occur before t but arrive after t, so the live system could not have used it. Distinguish event time from availability time or use historical snapshots that encode availability. Event_time before t alone does not establish what was known then.

Decide whether your evaluation describes eventual complete history or original request-time knowledge. These are different claims, especially during pipeline delay and mobile disconnection.` },
        { title: 'Separate features from future labels', body: `For a seven-day feature, select events in the defined interval before the prediction and enforce the intended availability contract. Join on the correct entity, handle empty histories consistently, and avoid duplicate source rows.

Labels can look forward: whether an attributed outcome occurred in a later window. Keep that future window out of input features and allow labels to mature. A missing recent conversion may still occur later.

A point-in-time join picks a historically appropriate feature value, not simply the latest row. Verify whether the feature timestamp denotes source event time, computation time, or actual serving availability. These timestamps are not interchangeable.` },
        { title: 'Version and validate the dataset', body: `Record source snapshots or intervals, transformation versions, feature schemas, entity keys, and quality results. An immutable output path is insufficient if the generating query silently reads changing tables.

Check duplicates, missingness, ranges, distributions, time coverage, and label maturity. Fit preprocessing on training data only. Compare offline and served values on representative requests where permitted; a matching schema can hide different semantics.

Publish backfills separately and validate before promotion. If a feature definition changes, evaluate and train a compatible model rather than substitute new semantics under old weights. A feature platform can help organize this workflow but cannot supply correct contracts automatically.` }
      ],
      prompt: 'Explain point-in-time correctness using an event that arrived late and an outcome observed after prediction.',
      answer: `“I would reconstruct each example from the intended past window and data available at its prediction time. An earlier event that arrived later may be unavailable to the original decision. Future outcomes form mature labels, not inputs. I would version source snapshots and feature definitions and compare historical and serving values.”`,
      pitfalls: ['Joining historical requests to the latest features.', 'Assuming an earlier event timestamp proves earlier availability.', 'Treating immature labels as known negatives.'],
      checkpoint: { question: 'An event occurred at 09:00 but became available at 11:00. Should it enter strict features served at 10:00?', options: ['Yes, because it occurred before 10:00', 'Always, because complete data is better', 'No, it was unavailable to that decision'], correct: 2, explanations: ['Occurrence and availability differ.', 'Hindsight changes the evaluation claim.', 'Correct. Strict serving-time reconstruction respects what was knowable then.'] }
    },
    {
      id: 'prod-online-features', phase: 'Choose storage and features', title: 'Online features, feature stores, and caching', minutes: 8,
      subtitle: 'Retrieve consistent, fresh values without scanning history.', bridge: [9, 25], sources: ['feast', 'redis'],
      blocks: [
        { title: 'Historical and serving access differ', body: `Offline retrieval needs feature history for many entities and times. Online retrieval often needs current compatible values for a small set of keys within a deadline. A feature platform can define computation, track metadata, retrieve historical values, and materialize online values; it is not necessarily one database.

Serving choices include key-value stores, caches, and suitable indexed relational tables. Choose by key size, throughput, freshness, consistency, durability, and operating cost. A fast response containing incompatible values is not good serving.

At small scale, shared indexed storage may meet the need. Introduce a separate online component when its benefits justify synchronization and recovery complexity.` },
        { title: 'Specify version and freshness', body: `Return feature-definition version, entity key, and relevant value and materialization timestamps. Event freshness and pipeline delay differ. Set acceptable age per feature; not every attribute needs the same update cadence.

Prevent old retries or backfills from overwriting newer online state using an appropriate source-version or timestamp ordering contract. A cache TTL limits expiry of the entry, not necessarily the age of its source evidence.

Historical and online transformations should agree on normalization, null handling, category encoding, and windows. Test representative request snapshots to locate training-serving skew; schema equality alone does not prove semantic consistency.` },
        { title: 'Handle misses and recovery deliberately', body: `Define cache keys, authoritative sources, invalidation, eviction, and miss behavior. Personalized cached results must account for permitted context, model version, and eligibility. Avoid a stampede by bounding refresh concurrency or coordinating refreshes where appropriate.

Unlimited fallback reads and retries can overload a failing source. Apply deadlines, bounded concurrency, and a validated stale-value, default-feature, or non-personalized fallback depending on product risk.

Do not call a cache disposable if it is the only copy of required state. Redis durability depends on configuration. Test restoration or rebuilding and monitor missingness, value age, and fallback rates as well as lookup latency.` }
      ],
      prompt: 'Define an online feature contract and what happens on stale values, a miss, or a timeout.',
      answer: `“I would retrieve keyed values with version and freshness metadata, keep historical and served semantics consistent, and reject incompatible or improperly ordered updates. I would define cache keys and invalidation and bound miss and retry behavior. The fallback and recovery path would match the feature’s actual product risk.”`,
      pitfalls: ['Equating cache write time with source freshness.', 'Changing feature meaning beneath an old model.', 'Sending unlimited fallback reads to a broken source.'],
      checkpoint: { question: 'A cache was written one second ago from yesterday’s data. Is the feature necessarily fresh?', options: ['No; source age and cache write age differ', 'Yes; TTL always proves source freshness', 'Yes; fast reads imply recent data'], correct: 0, explanations: ['Correct. Track source/value freshness separately.', 'Expiry does not by itself establish recent evidence.', 'Latency and freshness are distinct properties.'] }
    },
    {
      id: 'prod-training', phase: 'Train and serve', title: 'Training pipelines, artifacts, and model registries', minutes: 8,
      subtitle: 'Make an evaluated model reproducible and deployable.', bridge: [2, 11, 21, 25], sources: ['registry'],
      blocks: [
        { title: 'A run includes data and evaluation', body: `Record source snapshots, dataset construction, splits, feature definitions, preprocessing, parameters, code revision, and runtime environment. Log metrics and important slices with these inputs. Seeds help but do not guarantee identical results across every hardware or distributed configuration.

Check data before spending compute. Evaluate quality, calibration where relevant, supported cohorts, and serving cost. A completed run is not permission to promote its model.

Automate repeatable steps and define promotion policy. Scheduled retraining is useful in some products, but it cannot repair an invalid source contract or guarantee fresh online features.` },
        { title: 'Package the deployable unit', body: `A model package can include weights, preprocessing, input/output schemas, feature-version requirements, thresholds, and dependencies. Validate loading and prediction on representative inputs, empty data, and malformed requests.

Store artifacts durably with integrity checks, access controls, and lineage. A registry links versions and evaluation metadata. A mutable alias such as “current” is a routing convenience, not immutable provenance.

Record the exact artifact version used for relevant decisions where permitted. If the alias moves tomorrow, you still need to know which model and compatible features produced today's outcome. Keep a last-known-good package for rollback.` },
        { title: 'Scale training separately from serving', body: `Use efficient data loading, formats, batching, and measured CPU/GPU resources. Distributed training adds communication, synchronization, checkpoint, and input-pipeline complexity. More devices do not guarantee proportional speedup.

Separate large training jobs from deadline-sensitive serving capacity. Retry or resume from compatible checkpoints, budgeting dataset reads and artifact publication as well as model compute.

Coordinate features and retrieval embeddings with model versions. A new user/query encoder against an incompatible old item index can fail despite good offline evaluation. Promotion gates should test the whole compatible serving package, not just its weights.` }
      ],
      prompt: 'What must be versioned and packaged so a model can be reproduced, served, and rolled back?',
      answer: `“I would version data construction, snapshots, features, preprocessing, code, environment, and evaluation. The package must load with a compatible schema and dependencies. A registry tracks immutable artifacts and movable aliases, while promotion tests and a last-known-good package provide an explicit deployment and rollback path.”`,
      pitfalls: ['Saving only weights without preprocessing.', 'Treating a mutable alias as historical provenance.', 'Promoting every completed training run.'],
      checkpoint: { question: 'Why record an immutable version as well as a current alias?', options: ['Aliases cannot route requests', 'Aliases move; earlier predictions need exact provenance', 'Feature compatibility never matters'], correct: 1, explanations: ['Aliases can be useful routing handles.', 'Correct. Historical decisions need the version actually served.', 'Schema and feature compatibility still matter.'] }
    },
    {
      id: 'prod-serving', phase: 'Train and serve', title: 'Batch, synchronous, and asynchronous predictions', minutes: 8,
      subtitle: 'Choose when and where the model runs.', bridge: [25, 26, 27], sources: [],
      blocks: [
        { title: 'Choose by deadline and freshness', body: `Batch prediction computes outputs in advance for later lookup. It can fit daily forecasts or precomputed scores when freshness allows. Synchronous prediction responds inside an application deadline. Asynchronous prediction accepts a job for later completion with an identifier and result-retrieval path.

These patterns can coexist: precompute recommendation candidates, fetch fresh keyed features, then rank synchronously. A heavy media-processing job can be asynchronous. ML alone does not imply a live GPU API.

Batch outputs need entity keys, versions, and validity windows. Async jobs need duplicate handling, status, permissions, cancellation rules, and retention. Each pattern trades freshness, user waiting, resource use, and operational complexity.` },
        { title: 'Build the live request path', body: `Validate the request and identity, resolve permitted context, retrieve features or candidates, run compatible preprocessing and a loaded model, apply hard constraints, and return a result. Record safe request IDs, artifact versions, timings, and fallback reasons.

Load the model at worker startup or a controlled transition rather than deserialize it for every request. Readiness checks should prevent traffic arriving before required artifacts are usable.

Budget the complete path: routing, queue wait, features, retrieval, inference, policy checks, and serialization. Bound retries and dependencies. A timeout leads to a documented fallback or clear error, not an unlimited cascade of new work.` },
        { title: 'Connect outputs to actual outcomes', body: `Returned results are not necessarily displayed, and displayed results do not automatically cause an outcome. Log permitted exposure events separately and link later labels through a defined request and attribution window.

Define schemas for scores, probabilities, lists, and error states. Handle empty candidates, unknown categories, and missing features consistently. Fail-open versus fail-closed behavior depends on product risk; a personalization fallback must not bypass mandatory availability or safety checks.

Test contract and policy behavior independently from offline model quality. A correct high-scoring app that cannot be served is a system failure. Deployment readiness includes request handling and fallback coverage, not just model loading.` }
      ],
      prompt: 'Choose patterns for daily forecasts and live recommendations, then describe request handling and fallback.',
      answer: `“Daily outputs may be batch if their validity window fits. Live recommendations can combine precomputed candidates with synchronous features and ranking. I would load a compatible versioned model, budget the full path, validate hard constraints, and log safe provenance and exposure. Timeouts and missing inputs need bounded behavior and risk-appropriate fallbacks.”`,
      pitfalls: ['Reloading large weights for every request.', 'Ignoring dependency and queue time.', 'Bypassing eligibility with a personalization fallback.'],
      checkpoint: { question: 'What fits a daily score consumed tomorrow without live freshness requirements?', options: ['Always a synchronous GPU API', 'A fresh raw-history scan for every read', 'Validated batch predictions with versioned keyed outputs'], correct: 2, explanations: ['That complexity needs a workload justification.', 'Repeated history scans create unnecessary request work.', 'Correct. Batch output can meet a bounded freshness contract efficiently.'] }
    },
    {
      id: 'prod-scaling', phase: 'Train and serve', title: 'Scale throughput, partitions, workers, and backlog', minutes: 10,
      subtitle: 'Calculate the bottleneck before adding machines.', bridge: [16, 25], sources: ['kafka', 'autoscaling'], lab: 'capacity',
      blocks: [
        { title: 'Define the unit and estimate work', body: `Distinguish events per second, bytes per second, requests per second, and model calls per request. A recommendation request may score many candidates. An event processor may wait on a sink or database as much as it uses CPU.

If a measured worker handles 250 events/s and four balanced workers can work concurrently, an idealized capacity is 1,000 events/s. At 1,200 arrivals/s, backlog grows by 200 events/s. A broker absorbs a burst only for a bounded period; it does not create downstream processing capacity.

For a backlog B and constant continuing arrivals λ below capacity μ, ideal drain time is **B / (μ − λ)**, not B/μ. If μ is at or below λ, the system cannot drain the backlog while that load continues. Real systems need measurement for variability, I/O limits, and skew.` },
        { title: 'Partitioning bounds useful parallel work', body: `In a conventional partition-assigned Kafka consumer group, a partition is handled by one assigned consumer at a time. More consumers than usable partitions do not increase that group's partition-processing parallelism. Other protocols and internal processing patterns can differ; specify the design you mean.

Partition choice trades concurrency, ordering scope, state ownership, and rebalancing work. A hot entity can dominate one partition while other workers are idle. Preserving strict per-entity order can limit how that key can be split.

The calculator below assumes one worker stream per assigned partition, evenly balanced partitions, and a measured per-worker rate. It shows why adding workers alone can fail. It is not a Kafka benchmark, an autoscaler, or a prediction of a specific production deployment.` },
        { title: 'Add headroom and control pressure', body: `Do not plan only for mean arrival rate. Consider bursts, failure of a worker, rebalance time, and how quickly a delayed feature must catch up. A 70% target load in the exercise is an illustrative headroom choice, not a universal standard.

Scale on signals that represent work: consumer lag and age, request concurrency, queue depth, dependency saturation, or model throughput. CPU alone can miss an I/O bottleneck. Autoscaling has delay, resource limits, and cold starts; it is not instantaneous recovery.

Bound queues and apply appropriate rate limits or backpressure. Investigate sink capacity, key skew, connection limits, and serialization before multiplying workers. Extra producers or replicas cannot repair a slow downstream query. Test peak and recovery conditions with representative data sizes.` }
      ],
      prompt: 'Estimate whether a stream can keep up, how backlog drains, and why additional workers might not help.',
      answer: `“I would measure arrival volume and representative service rate, identify usable parallelism and downstream limits, then compare offered load with effective capacity. Backlog drains only from spare capacity after continuing arrivals. Conventional consumer-group partitions, hotspots, sink I/O, and recovery delay can limit scaling, so I would test headroom and monitor lag age, not just worker count.”`,
      pitfalls: ['Using average throughput without burst or failure headroom.', 'Computing drain time without continuing arrivals.', 'Assuming workers beyond assigned partitions always increase consumption.'],
      checkpoint: { question: 'Backlog is 12,000 events, arrivals are 1,200/s, and effective capacity is 2,000/s. What is the ideal drain time?', options: ['6 seconds', 'The backlog can never drain', '15 seconds'], correct: 2, explanations: ['That ignores new arrivals during recovery.', 'Capacity exceeds continuing arrivals, so spare capacity exists.', 'Correct. Spare capacity is 800/s, so 12,000 / 800 = 15 seconds under the stated ideal assumptions.'] }
    },
    {
      id: 'prod-performance', phase: 'Train and serve', title: 'Inference performance and end-to-end latency', minutes: 8,
      subtitle: 'Balance throughput, tail latency, resources, and quality.', bridge: [20, 21, 25], sources: ['batching'],
      blocks: [
        { title: 'Measure the whole request', body: `Break down queueing, feature retrieval, candidate generation, preprocessing, model execution, policy checks, and serialization. p95 or p99 latency describes a tail of the measured distribution; averages can conceal slow requests.

Do not simply add each stage's independently measured p95 and call it the end-to-end p95. Percentiles do not add that way. Use request traces and measure the complete response distribution under representative traffic.

Benchmark warm and cold behavior, request sizes, concurrency, batch sizes, and failures. Scoring 20 candidates and scoring 2,000 candidates are different workloads even with the same model. A median input and no external dependencies can make a benchmark unrealistically optimistic.` },
        { title: 'Batching and resource utilization', body: `Batching can amortize overhead and use vectorized CPU or accelerator work efficiently. Dynamic batching groups requests that arrive close together, but waiting for a batch can increase latency. Throughput and per-request response time must be measured together.

GPUs can help some neural workloads, while small tree models or tiny batches may run well on CPUs. Include transfers, model memory, concurrency, and startup overhead. More accelerator utilization does not by itself mean a better user deadline.

Other options include a smaller model, cheaper features, a limited reranking set, quantization, compilation, or distillation. Validate numerical and quality effects and runtime compatibility. An optimization that changes the ranking may need product evaluation, not only a faster microbenchmark.` },
        { title: 'Cache and degrade within the contract', body: `Caching compatible features, embeddings, or predictions can save work. Key by required version and context, honor invalidation and eligibility, and measure hit rates. A cache miss pattern under a traffic spike can differ dramatically from the average.

Use deadline-aware limits: fewer candidates, a validated lighter model, or a non-personalized fallback if allowed. Preserve hard constraints. Set concurrency bounds so a slow dependency does not create unlimited waiting requests.

Report cost per useful unit, such as requests meeting the quality and deadline target, not only raw requests per second. Include sustained peak tests, memory pressure, and rollback behavior. Performance engineering changes multiple parts of the system, not just model architecture.` }
      ],
      prompt: 'How would you investigate a slow prediction service and decide whether batching or GPU serving helps?',
      answer: `“I would trace the complete path and benchmark realistic request sizes, concurrency, cold starts, and dependency behavior. Batching may improve throughput but adds waiting; a GPU only helps if the workload and overhead justify it. I would compare tail latency, quality, memory, and cost and keep a bounded, policy-safe fallback.”`,
      pitfalls: ['Adding stage p95 values as if they equal request p95.', 'Assuming every ML model should serve on a GPU.', 'Claiming a throughput gain without measuring batching delay or quality.'],
      checkpoint: { question: 'What should you measure when increasing dynamic batch waiting time?', options: ['Throughput and end-to-end latency together', 'Only GPU utilization', 'Only the number of stored model parameters'], correct: 0, explanations: ['Correct. More efficient batches can also increase request waiting time.', 'High utilization does not establish deadline compliance.', 'Parameter count does not capture queueing and serving overhead.'] }
    },
  ],
  cases: [
  ]
};
