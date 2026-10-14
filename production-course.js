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
  ],
  cases: [
  ]
};
