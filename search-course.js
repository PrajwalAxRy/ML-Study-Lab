/* Original study lessons. Case studies and numerical examples are hypothetical. */
window.SEARCH_COURSE = {
  id: 'search',
  title: 'Search & Learning to Rank',
  description: 'From ML fundamentals to explaining, designing, and debugging an App Store-style search system.',
  sources: {
    bm25: { title: 'Stanford IR book: BM25', url: 'https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html' },
    retrieval: { title: 'Google: embedding retrieval', url: 'https://developers.google.com/machine-learning/recommendation/dnn/retrieval' },
    hybrid: { title: 'Elastic: hybrid search', url: 'https://www.elastic.co/docs/solutions/search/hybrid-search' },
    ranknet: { title: 'Microsoft Research: RankNet', url: 'https://www.microsoft.com/en-us/research/publication/learning-to-rank-using-gradient-descent/' },
    lambdamart: { title: 'XGBoost: learning to rank', url: 'https://xgboost.readthedocs.io/en/stable/tutorials/learning_to_rank.html' },
    metrics: { title: 'Stanford IR book: ranked retrieval evaluation', url: 'https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html' },
    bias: { title: 'Microsoft Research: learning from biased feedback', url: 'https://www.microsoft.com/en-us/research/publication/unbiased-learning-rank-biased-feedback/' },
    apple: { title: 'Apple Research: App Store search relevance', url: 'https://machinelearning.apple.com/research/augmenting-app' },
    privacy: { title: 'Apple: App Store privacy', url: 'https://www.apple.com/legal/privacy/data/en/app-store/' }
  },
  glossary: [
    ['Query', 'The input expressing an information need, such as “offline hiking maps”. It may be a partial prefix or a full sentence.'],
    ['Document / item', 'A searchable object. In these examples it is an app represented by its title, description, category, and permitted metadata.'],
    ['Candidate', 'An eligible item retrieved for further scoring. A ranker only sees its candidate set.'],
    ['Relevance', 'How well an item satisfies the query or user need. A relevance judgment is not automatically the same as a click.'],
    ['Impression', 'A logged exposure opportunity. Define whether it means returned, rendered, or actually visible; these are not interchangeable.'],
    ['Query group', 'The set of candidates being compared for one ranking request. Pairwise comparisons belong within that group.'],
    ['Embedding', 'A learned numeric representation whose geometry supports similarity comparisons. Similarity does not guarantee relevance.'],
    ['Head / tail', 'Head queries are frequent; tail queries are rare. Tail traffic may collectively matter even when each query has little feedback.'],
    ['Reranker', 'A later scoring or ordering stage applied to a smaller candidate list. It can use more expensive interactions or final constraints.'],
    ['Guardrail', 'A metric that must not regress beyond an agreed limit, such as latency, crash rate, or a critical quality slice.'],
    ['Propensity', 'The probability of an exposure or action under a logging policy. Correcting bias requires estimating the relevant probability, not guessing it.'],
    ['Cold start', 'Little or no history for a new user, item, or query. Metadata and broadly relevant baselines provide initial signals.']
  ],
  lessons: [
    {
      id: 'search-framing', phase: 'Understand search', title: 'Think in queries, candidates, and ordered lists', minutes: 6,
      subtitle: 'Move from predicting a label to satisfying an information need.', bridge: [1, 2, 25], sources: [],
      blocks: [
        { title: 'Start with the user, not the model', body: `A search system responds to an explicit need. A recommendation system can suggest items without a typed query. Both may retrieve and rank items, but search must respect the current query even when a user's history suggests something else.

For “offline hiking maps”, the goal is not to find the app with the most downloads. It is to find eligible apps that support that need. For “Spotify”, the person may want one specific app. Call this **navigational intent**. “Budget planner” is more **category or exploratory intent**. Short queries can be ambiguous.

An app is a document in information retrieval (IR). A query and app can form one training example, but quality is judged by the ordered list produced for a request. Your existing classification knowledge still helps with scoring; the missing piece is that position and competition between candidates matter.` },
        { title: 'The pipeline and its bottlenecks', body: `1. Understand the query: language, spelling, named app, category, and intent.
2. Retrieve a manageable set of candidates from the eligible catalog.
3. Score those candidates using richer query–app and contextual features.
4. Apply final eligibility checks and carefully justified reranking constraints.
5. Display results and log exposures and subsequent outcomes.

Retrieval asks **which items deserve consideration?** Ranking asks **in what order should they appear?** If the best hiking app never reaches the ranker, even a perfect ranker cannot put it first. If it is retrieved but buried, investigate ranking instead.

For a technical review, choose illustrative candidate counts only after discussing catalog size and latency. “Millions to hundreds to a top results page” explains the separation; it is not a claim about Apple's internal implementation.` },
        { title: 'Your first clarification questions', body: `Ask what is searchable, what counts as success, whether results are personalized, which locales and devices are supported, and what latency and data constraints apply. Clarify whether ads are in scope; organic app discovery and ad ranking have different objectives.

Define eligibility separately from relevance. An excellent semantic match that cannot be installed in the user's region is not a valid result. A slow result can also fail the user even when its relevance is high.

Then state a measurable hypothesis: “For exploratory queries, increasing relevant candidate coverage should improve successful discovery, provided exact-title queries and response time do not regress.” This turns a broad request into a testable plan.` }
      ],
      prompt: 'Explain retrieval versus ranking, then describe what you would clarify before designing App Store search.',
      answer: `“I would first clarify query types, eligible inventory, success metrics, privacy constraints, and latency. Retrieval cheaply narrows the catalog while protecting relevant-item coverage. Ranking uses richer features to order those candidates. I would diagnose missing relevant items as retrieval failures and badly ordered retrieved items as ranking failures, and evaluate both stages separately.”`,
      pitfalls: ['Starting with “I would use a transformer” before defining the problem.', 'Treating search relevance as global app popularity.', 'Claiming to know Apple’s internal pipeline from a hypothetical design.'],
      checkpoint: { question: 'The ideal app is absent from the candidate set. What should you investigate first?', options: ['Increase the final ranker depth', 'Candidate retrieval and eligibility filtering', 'Probability calibration alone'], correct: 1, explanations: ['The ranker cannot promote an item it never receives.', 'Correct. Check whether indexing, query understanding, retrieval, or filtering excluded the item before tuning the ranker.', 'Calibration changes score interpretation, not candidate membership.'] }
    },
    {
      id: 'lexical-search', phase: 'Understand search', title: 'Lexical retrieval: inverted indexes and BM25', minutes: 7,
      subtitle: 'Understand the inexpensive baseline before replacing it.', bridge: [8, 9], sources: ['bm25'],
      blocks: [
        { title: 'What a lexical system stores', body: `An **inverted index** maps a token to the items containing it. For a toy catalog, “hiking” maps to Trail Atlas and Hike Notes; “offline” maps to Trail Atlas and Offline Dictionary. Query processing can fetch and score matching postings instead of scanning every description.

Tokenization, case normalization, and language analysis determine what matches. Preserve names and important phrases; aggressive stemming or stop-word removal can damage app titles. Consider separate fields for title, subtitle, category, and description, with tuned field weights.

For “photo editor”, a matching title is often more useful than a single incidental mention deep in a description. Metadata quality and indexing are therefore part of the ML problem, not just infrastructure details.` },
        { title: 'BM25 intuition', body: `BM25 combines term rarity, diminishing returns from repeated matches, and document-length normalization. A rare query term can be informative; repeating that word hundreds of times should not give unlimited advantage. Length normalization reduces the automatic benefit of long descriptions.

One common scoring form sums each query term's contribution:

**IDF(t) × tf(t,d)(k1+1) / [tf(t,d) + k1(1-b+b×length(d)/averageLength)]**

Here tf is term frequency, IDF weights rarity, k1 controls saturation, and b controls length normalization. Exact IDF variants differ. Know what the factors do before memorizing a particular variant. BM25 is a relevance score, not a calibrated probability.

On the toy query “offline hiking”, repeated “offline” mentions eventually add little; matching the rarer “hiking” may differentiate an app from generic offline utilities.` },
        { title: 'What works, what fails, and how to improve it', body: `Lexical matching is a useful baseline for names and explicit terminology. It can struggle with vocabulary mismatch: “track my spending” may describe a budget app whose metadata never uses “spending”.

Build a small relevance set before changing analysis or weights. Include exact titles, misspellings, multiword categories, synonyms, and multiple languages. Inspect top results and missed relevant apps. A synonym rule can improve one query while incorrectly broadening another.

Do not discard lexical retrieval because embeddings exist. Compare it, semantic retrieval, and a hybrid on the same query set and latency budget. In technical discussions, this is a strong baseline-and-ablation story.` }
      ],
      prompt: 'What is BM25, and why would you keep a lexical retriever in a modern search system?',
      answer: `“BM25 scores query-term matches using rarity, saturated term frequency, and length normalization. It is a strong, inexpensive baseline, especially for explicit names and keywords. It can miss semantic paraphrases, so I would test dense retrieval as a complementary source rather than assume it should replace lexical matching.”`,
      pitfalls: ['Calling BM25 a neural model or click probability.', 'Thinking repeated keywords always increase relevance proportionally.', 'Applying the same tokenizer and synonym rules to every language.'],
      checkpoint: { question: 'Why does BM25 saturate term frequency?', options: ['To avoid unlimited benefit from repeating a query term', 'To make every document exactly the same length', 'To eliminate rare words'], correct: 0, explanations: ['Correct. Additional repetitions provide diminishing evidence, which also limits keyword-stuffing advantages.', 'Length normalization is separate and does not physically change documents.', 'Rarity weighting usually makes informative rare terms more influential, not absent.'] }
    },
    {
      id: 'semantic-retrieval', phase: 'Understand search', title: 'Semantic retrieval: embeddings, two towers, and ANN', minutes: 8,
      subtitle: 'Use meaning to recover candidates that words alone miss.', bridge: [18, 20, 21, 24], sources: ['retrieval'],
      blocks: [
        { title: 'Represent the query and app separately', body: `A **two-tower or bi-encoder** model uses one encoder for the query and one for the app. They may share weights, but do not have to. Each outputs a vector; a dot product or cosine similarity gives a cheap matching score.

An app tower can encode title, description, category, and permitted structured metadata. The query tower can encode text and permitted context. The model should learn that “track my spending” is close to budgeting apps, not just apps repeating the same words.

If you use cosine similarity, vector magnitude is normalized away. A raw dot product also depends on magnitude, which can encode useful signals or unwanted popularity effects. Validate the choice. An embedding dimension is a capacity-and-cost decision, not a universal magic number.` },
        { title: 'Training means choosing useful comparisons', body: `A positive could be a human-judged relevant app or a suitably defined interaction. Negatives can come from random eligible apps, other items in the training batch, or retrieved-but-irrelevant hard negatives.

A contrastive softmax loss encourages the positive to outrank sampled negatives:

**L = -log[exp(s(q,d+)/temperature) / Σ exp(s(q,dj)/temperature)]**

Temperature controls score sharpness. The denominator is the sampled comparison set, not necessarily the entire catalog. In-batch negatives are efficient but can contain false negatives: another budgeting app may also satisfy the query. Hard negatives teach fine distinctions but need label-quality checks. Sampling affects what the model learns and can change popularity bias.

Inspect mistakes before adding complexity. Similar descriptions can produce close embeddings even when one app lacks the requested capability.` },
        { title: 'Serving and approximate nearest neighbors', body: `Precompute eligible app vectors, then compute the query vector when the request arrives. **Approximate nearest-neighbor search (ANN)** searches a vector index without exhaustive scoring. HNSW is a graph-based example; IVF partitions the vector space. You need the basic speed–memory–recall trade-off, not every implementation detail.

Distinguish ANN recall from task recall: ANN recall compares approximate results with exact vector neighbors, while relevance recall asks whether genuinely useful apps were retrieved. Perfect ANN recall can still retrieve semantically wrong items.

Index freshness matters when apps or encoders change. Query and app encoders must use compatible versions. A two-tower model gains serving efficiency by limiting query–app interactions; a later cross-encoder can spend more compute on a smaller set.` }
      ],
      prompt: 'Explain how you would train and serve a two-tower app-search retriever.',
      answer: `“I would learn query and app embeddings from reliable positive pairs and representative negatives, while auditing false negatives. I would precompute app vectors and retrieve with an ANN index at request time. I would evaluate relevant candidate coverage, ANN approximation loss, latency, memory, and index freshness separately, then pass candidates to a richer ranker.”`,
      pitfalls: ['Saying embedding similarity guarantees relevance.', 'Treating every unclicked or in-batch item as truly irrelevant.', 'Updating the query encoder without a compatible item index.'],
      checkpoint: { question: 'ANN matches exact vector search almost perfectly, but relevant apps are still missing. What is the likely next investigation?', options: ['Assume retrieval is solved', 'Remove all hard negatives', 'Audit representations, labels, and task-level retrieval recall'], correct: 2, explanations: ['Exact vector neighbors are not necessarily relevant apps.', 'Some hard negatives may be wrong, but removing all of them is not a diagnosis.', 'Correct. The index may be accurately searching an embedding space that poorly represents the actual relevance task.'] }
    },
    {
      id: 'hybrid-search', phase: 'Understand search', title: 'Hybrid retrieval and query understanding', minutes: 6,
      subtitle: 'Combine complementary evidence without mixing incompatible scores.', bridge: [2, 9, 25], sources: ['hybrid'],
      blocks: [
        { title: 'Run complementary candidate sources', body: `Consider “Notion”: a lexical retriever can find the exact app. For “organize notes with my team”, semantic retrieval may find useful apps without exact phrase matches. A hybrid design can retrieve from both, take the union, deduplicate by stable app ID, and pass the eligible candidates to a ranker.

Do not assume a union is free. With a fixed candidate budget, one source can crowd out another. Compare source contributions and relevant-item overlap. Decide how much capacity each query class needs using held-out evaluation.

Apply region, device compatibility, and availability rules as early as practical, with final checks before serving. Filtering only after retrieving a tiny top list can leave too few eligible results; oversampling or filter-aware retrieval may be needed.` },
        { title: 'Fuse rankings, not arbitrary scales', body: `BM25 scores and cosine similarities are on different scales. Adding them directly can make one source dominate for numerical rather than relevance reasons.

**Reciprocal rank fusion (RRF)** assigns an item a contribution **1 / (c + rank)** from each source list. An absent item contributes zero for that list. Sum contributions and sort. The positive constant c controls how strongly top positions stand out. RRF is a useful starting point because it avoids comparing raw score units.

Alternatively normalize/calibrate scores and tune a weighted combination on held-out judgments, or let a learned ranker use both as features. None of these is automatically best for every catalog. Measure exact-title preservation, tail-query quality, and latency.` },
        { title: 'Interpret the query carefully', body: `Query understanding can include language detection, typo correction, synonyms, intent classification, and entity recognition. Autocomplete is a related task with partial input and tight latency needs.

Keep the original query when expanding or rewriting. “Calm” could be an app name or a general request; blindly rewriting it as “meditation” may lose navigational intent. Compare alternative interpretations rather than treating a rewrite as certain.

Query-specific personalization should help break ties among relevant results, not override a clear request. Track slices such as head/tail, navigational/exploratory, language, and new apps. Aggregate gains can hide a severe regression in one of them.` }
      ],
      prompt: 'How would you combine BM25 and semantic search, and what could go wrong?',
      answer: `“I would retrieve from both, preserve eligibility and exact-title matches, and combine candidates by stable ID. I would start with rank fusion or a trained ranker using both signals rather than add unnormalized scores. I would compare quality and cost by query intent and frequency, because semantic gains on exploratory queries can conceal navigational regressions.”`,
      pitfalls: ['Adding BM25 and cosine scores without discussing scale.', 'Rewriting every query and dropping the original.', 'Calling candidate union guaranteed to improve recall at a fixed budget.'],
      checkpoint: { question: 'What is the main practical attraction of RRF?', options: ['It proves that dense retrieval is always better', 'It combines source ranks without requiring comparable raw score scales', 'It generates ground-truth labels'], correct: 1, explanations: ['RRF does not establish which source is better.', 'Correct. It uses rank positions to combine evidence from different retrieval lists.', 'Fusion orders candidates; it does not determine their true relevance.'] }
    },
    {
      id: 'ranking-data', phase: 'Build a ranker', title: 'Build the training table: groups, features, and labels', minutes: 8,
      subtitle: 'A ranker is only as sound as the comparisons in its data.', bridge: [8, 9, 10, 17], sources: [],
      blocks: [
        { title: 'Think one request, many candidate rows', body: `A training row describes a query–app pair in a specific context. A group contains the candidates being compared for one request. If a query repeats for different users or times, decide whether the grouping key should be the request rather than the raw query text.

A toy group for “offline hiking” might contain Trail Atlas (grade 3), Trek Planner (grade 2), Hike Notes (grade 1), and Photo Studio (grade 0). Grades are human-defined usefulness, not model scores. This toy scale is a teaching choice, not an App Store policy.

You can use query features (language, intent), app features (category, metadata quality), matching features (BM25, embedding similarity, title match), and permitted context features. Candidate-source indicators can help the ranker interpret different retrieval paths.` },
        { title: 'Define the target and its observation window', body: `Human judgments measure semantic fit using a clear rubric. Interaction labels measure behavior under the system that showed the result. Clicks are plentiful but noisy; downloads or installs may be more meaningful but delayed and sparse. Neither perfectly captures satisfaction.

For a conversion label, define the attribution rule, denominator, and observation window. An impression from yesterday may not yet have a mature outcome. Treating it as negative can introduce delayed-label bias.

If you sample negatives, distinguish unexposed apps, exposed-but-not-clicked apps, and judged irrelevant apps. They supply different evidence. Unexposed items are not known rejections. Sample easy and hard negatives with quality checks; align training comparisons with serving candidates.` },
        { title: 'Prevent leakage and representation traps', body: `Build all features as of the request time. A download count calculated using next week's events leaks the future. Query–app conversion rates need enough support, smoothing, and time-safe aggregation. Exclude the row's own outcome from any target-derived feature.

Use metadata and matching features for new apps rather than rely entirely on app IDs or accumulated popularity. Audit coverage, feature missingness, and feedback quality by language and query frequency. A sparse app ID can memorize head traffic and fail cold start.

Separate feature importance from causal effects. A high-importance download feature does not prove downloads cause relevance. Run feature ablations and inspect query-level examples. Training data produced by the old ranker is policy-dependent, a subject we will revisit.` }
      ],
      prompt: 'Describe the rows, groups, features, and labels you would use for an app-search ranker.',
      answer: `“Each row is a query–app–context candidate, and comparisons are grouped by the ranking request. I would combine text matches, semantic similarity, metadata, and permitted context. I would separately define semantic judgments and behavioral targets, respect label maturation and attribution, and calculate features strictly as of request time. I would audit exposure bias, negative sampling, and new-app coverage.”`,
      pitfalls: ['Training pairs across unrelated queries.', 'Calling unseen apps negative examples without qualification.', 'Using future aggregate popularity or the eventual outcome as an input feature.'],
      checkpoint: { question: 'Which feature leaks information?', options: ['Download totals calculated through the week after the request', 'Category known at request time', 'BM25 score from the request-time index'], correct: 0, explanations: ['Correct. It contains future behavior that was not available at serving time.', 'This is a legitimate request-time feature if the historical value is used.', 'This is legitimate when the index and metadata reflect what was available then.'] }
    },
    {
      id: 'ranking-losses', phase: 'Build a ranker', title: 'Pointwise, pairwise, and listwise learning', minutes: 9,
      subtitle: 'Connect familiar losses to ordering decisions.', bridge: [4, 19, 21], sources: ['ranknet'],
      blocks: [
        { title: 'Pointwise: score each example', body: `Pointwise learning predicts a label for each query–app pair. Logistic regression with binary cross-entropy can estimate an interaction probability under stated conditions; regression can predict a relevance grade. Sort candidates by the score.

This is a useful baseline because it connects directly to your bank. However, improving average log loss or MSE does not guarantee improving top-of-list order. The model may improve many easy negatives while barely changing the first few results.

A score from a pairwise or listwise ranker is not automatically a probability. If another decision requires calibrated probabilities, evaluate calibration separately. Ranking quality and calibration answer different questions.` },
        { title: 'Pairwise: learn which item should be above another', body: `For two apps in the same query group, suppose A has a higher relevance grade than B. Let their model scores be sA and sB. A RankNet-style formulation predicts **P(A above B) = sigmoid(sA - sB)** and applies binary cross-entropy to that preference. For a strict positive preference, the loss is **log(1 + exp(-(sA - sB)))**.

If sA=1 and sB=2, the model gives A only about 0.269 probability of winning. The loss is about 1.313. Increasing A relative to B reduces this penalty. Only score differences matter to this pair; adding the same constant to both scores changes nothing.

Avoid arbitrary comparisons between different queries. Handle ties deliberately rather than manufacturing strict preferences. Sampling pairs reduces computational cost and changes the effective training emphasis.` },
        { title: 'Listwise: learn from a whole candidate list', body: `Listwise approaches define objectives over a query's candidates or permutations. A simple teaching example normalizes gains into a target distribution and fits a softmax distribution over scores; other methods such as ListMLE use permutation likelihood. These are examples, not one universal listwise loss.

Listwise context can better reflect competition among candidates, but the loss, label convention, and sampled list still need to match the intended metric. Discrete sorting metrics do not generally provide ordinary useful gradients, so training uses differentiable surrogates or metric-informed gradient constructions.

Do not answer “listwise is always best”. Compare data volume, label quality, latency, model class, and top-K performance. All three families can produce an ordered list at inference.` }
      ],
      prompt: 'Compare pointwise, pairwise, and listwise ranking, using logistic regression as your starting point.',
      answer: `“Pointwise predicts individual outcomes and sorts scores. Pairwise learns within-query preferences using score differences. Listwise trains with a whole list or permutation objective. The distinction is the training formulation, not whether inference returns a list. I would start with a reliable pointwise baseline, then test a ranking-aware objective on query-grouped data and evaluate top-K quality.”`,
      pitfalls: ['Saying pairwise scores are calibrated click probabilities.', 'Comparing an app for one query with an app for a different query.', 'Claiming a listwise loss directly and exactly optimizes every ranking metric.'],
      checkpoint: { question: 'For a pairwise loss based on sA − sB, what happens if you add 10 to both scores?', options: ['The predicted preference flips', 'The preference probability becomes 1', 'The predicted preference is unchanged'], correct: 2, explanations: ['The difference does not change, so the order does not flip.', 'A common shift does not increase the score difference.', 'Correct. (sA+10) − (sB+10) equals sA − sB. Absolute score values are not sufficient to interpret this preference as a click probability.'] }
    },
    {
      id: 'ranking-models', phase: 'Build a ranker', title: 'LambdaMART, neural rankers, and model trade-offs', minutes: 8,
      subtitle: 'Choose a model because of its constraints, not its novelty.', bridge: [6, 20, 21, 24], sources: ['lambdamart'],
      blocks: [
        { title: 'Connect LambdaMART to boosting', body: `You already know gradient boosting: add trees to improve a current model. LambdaMART applies boosted trees to ranking, using metric-informed preference updates. Its lambda gradients emphasize swaps according to their ranking impact, commonly a change in NDCG.

Conceptually, correcting a misplaced highly relevant item near the top should count more than swapping two weak items near the bottom. This is not the same as differentiating the discrete sort operation exactly, and it does not guarantee that every update improves measured NDCG.

Know query-grouped training, graded labels, and validation by ranking quality. A tabular ranker is a practical choice when text/embedding similarity, metadata, and behavior-derived features already summarize the input. Audit overfitting and feature availability as you would for ordinary boosting.` },
        { title: 'Know the neural alternatives', body: `A small MLP can combine dense and structured features. A bi-encoder scores independently encoded queries and apps efficiently. A **cross-encoder** jointly encodes query and app text, allowing rich token interactions, but requires separate work for each query–app pair. It is therefore often more plausible as a limited reranking stage than an exhaustive catalog scorer.

Choose based on measured gains and cost. “Transformer” does not tell the reviewer whether representations are cached, whether pairwise interactions exist, or whether latency is affordable. Explain those distinctions.

For multi-task models, a shared representation can support click and conversion heads. Define labels carefully: an install-given-click model is conditional, whereas an install-per-impression model is not. The heads can share useful evidence or interfere; compare losses, weights, and task-specific performance.` },
        { title: 'A sensible model progression', body: `1. Establish lexical retrieval and a simple scoring baseline.
2. Add query–item features and compare a tree or linear ranker.
3. Test ranking-aware objectives with clean groups and labels.
4. Add semantic representations where error analysis shows a gap.
5. Consider a more expensive reranker only if the gain survives latency and online evaluation.

Use ablations to separate gains from better labels, more candidates, new features, and model architecture. Multi-objective selection may involve relevance, discovery quality, safety, and long-term value. Some requirements are hard constraints, not weights to trade away.` }
      ],
      prompt: 'Why choose LambdaMART instead of a transformer, and when might you add a cross-encoder?',
      answer: `“LambdaMART can exploit heterogeneous query–item features with a ranking-aware training signal and a manageable serving footprint. A cross-encoder can capture richer text interactions but is more expensive per candidate. I would compare both on identical candidate sets and labels, then decide whether a limited neural reranking stage earns its quality gain within the latency budget.”`,
      pitfalls: ['Claiming LambdaMART is a listwise model merely because its updates use NDCG.', 'Saying cross-encoders let you precompute the entire query–app matching computation.', 'Attributing a gain to architecture when candidate sets and labels also changed.'],
      checkpoint: { question: 'Why is a cross-encoder generally more expensive than a bi-encoder for large-catalog retrieval?', options: ['It cannot learn from text', 'It jointly processes each query–item pair rather than reuse independent item vectors for similarity search', 'It requires every label to be binary'], correct: 1, explanations: ['Text matching is one of its main strengths.', 'Correct. Rich pair interactions add work per candidate, which favors using it on a smaller set.', 'Label format is not the reason for the serving cost.'] }
    },
    {
      id: 'ranking-metrics', phase: 'Evaluate and explain', title: 'Ranking metrics you can calculate and defend', minutes: 10,
      subtitle: 'Know what each metric rewards, and what it misses.', bridge: [2, 16], sources: ['metrics'], lab: true,
      blocks: [
        { title: 'Set-based top-K metrics and first success', body: `Define what “relevant” means before calculating a metric. For binary judgments, **Precision@K = relevant items in the first K / K**. **Recall@K = relevant items in the first K / all relevant items in the evaluation universe**. If the reference labels cover only a judged pool, say so; you do not know full-catalog recall automatically.

With two relevant apps in a toy catalog and one in the top three, precision is 1/3 and recall is 1/2. **Hit rate@K** records whether there is at least one relevant item. With multiple relevant items, it is not the same as recall.

**Reciprocal rank** is 1 divided by the rank of the first relevant result, or zero if no relevant result is found in the evaluated list. Average over queries to get MRR. It is useful for a first-success task, but ignores later relevant items.` },
        { title: 'Graded relevance and NDCG', body: `NDCG rewards putting highly relevant items early. Choose and document a gain function; this course uses **gain = 2^grade - 1**. At position i, discount by **log2(i+1)**. Sum the discounted gains through K to get DCG@K, and divide by the best possible DCG@K under the same judgments to get NDCG@K.

For grades [2,3,0] at K=3, DCG is **3 + 7/log2(3) + 0 = 7.417**. If the known ideal top three grades are [3,2,1], IDCG is **7 + 3/log2(3) + 1/2 = 9.393**. NDCG@3 is about **0.790**. Some conventions use linear gains; do not compare values from different conventions blindly.

An all-zero group has zero IDCG. Specify how it is handled rather than divide by zero. Report query-level averages and useful slices; popularity-weighted averages and equal-query averages emphasize different populations.` },
        { title: 'MAP and why offline metrics are not the product', body: `For binary labels, average precision sums Precision@i at relevant ranks and divides by the total number of known relevant items. Mean over queries for MAP. For AP@K, denominator conventions vary, so explicitly document your implementation. NDCG is convenient when usefulness is graded; MAP emphasizes retrieving multiple binary-relevant items.

Use candidate recall for retrieval, top-K rank quality for ranking, and online task outcomes for the full product. ROC-AUC across arbitrary query–item pairs can look excellent while the first results for an important query are poor.

A metric is a proxy. Install conversion alone may favor familiar apps or conceal poor-quality discovery. Pair it with query success, reformulations, quality slices, appropriate long-term measures, and operational guardrails. Choose metrics from the goal rather than reciting every metric name.` }
      ],
      prompt: 'Explain NDCG versus MRR, and select metrics for retrieval and final app-search ranking.',
      answer: `“MRR measures the position of the first relevant result, so it suits navigational success. NDCG discounts lower positions and supports graded relevance, so it suits broader ranked usefulness. I would measure candidate recall before ranking, evaluate top-K quality by intent and language, and validate product impact online. I would state the judgment pool, gain function, cutoff, and zero-relevance convention.”`,
      pitfalls: ['Using accuracy as the sole measure of a ranked results page.', 'Calculating IDCG from a different label convention than DCG.', 'Claiming NDCG improvement proves higher user satisfaction.'],
      checkpoint: { question: 'A query usually seeks one specific app. Which metric most directly captures how soon the first relevant result appears?', options: ['MRR', 'Global classification accuracy', 'Number of indexed apps'], correct: 0, explanations: ['Correct. Reciprocal rank focuses on the first relevant result; MRR averages it across queries.', 'Accuracy ignores the position of that desired app.', 'Catalog size describes inventory, not ordering quality.'] }
    },
    {
      id: 'feedback-bias', phase: 'Evaluate and explain', title: 'Clicks are observations, not ground truth', minutes: 8,
      subtitle: 'Reason about exposure, counterfactuals, and feedback loops.', bridge: [16, 17, 25], sources: ['bias'],
      blocks: [
        { title: 'Separate relevance from visibility', body: `A top result may get more clicks because it is useful, because it is easy to see, or both. **Position bias** is the effect of placement on observation or action. Exposure/selection bias also arises because the old system chooses which apps get shown at all. Attractive presentation can further affect behavior.

Imagine app A has 80 clicks from 1,000 top-position impressions and app B has 20 from 200 lower-position impressions. Raw clicks favor A, rates favor B, but neither comparison alone identifies intrinsic relevance: query mix, visibility, and user differences are uncontrolled.

Logs train the next model, which controls future exposure. Popular apps can receive more feedback and become easier to recommend, reinforcing themselves. This feedback loop can hurt new apps and long-tail needs.` },
        { title: 'What inverse propensity weighting can and cannot do', body: `A simplified position model writes **P(click at position k) = P(examined at k) × P(attractive | examined)** under strong assumptions. If examination probabilities are known or estimated suitably, inverse propensity weighting (IPW/IPS) gives under-observed examples more weight.

For an observed event with exposure propensity p, a schematic weight is **1/p**. Small p creates high variance, so clipping or stabilization may be necessary and can introduce bias. Explain the trade-off rather than present IPW as a magic fix.

The logging policy must provide support for the alternatives you evaluate. Zero exposure probability cannot be repaired by dividing by zero or inventing labels. Safe randomized exposure, well-designed interventions, and independent judged sets can help; they need user-quality safeguards.` },
        { title: 'How to speak about this in a technical review', body: `First identify the bias mechanism, then its consequence, then a measurement or intervention. For example: “Clicks favor higher slots, so naively treating them as relevance could teach the model the old presentation policy. I would combine semantic judgments with behavior, audit positions and coverage, and evaluate a justified debiasing approach or controlled exploration.”

Do not assume adding position as an ordinary prediction feature solves relevance learning. It can help model exposure-dependent behavior, but the resulting score may still depend on the old serving arrangement. State what you want to estimate and how inference differs from logging.

Distinguish relevance prediction from causal incremental impact. A high predicted chance of a download does not mean showing that app caused the download. That distinction matters especially for notifications and marketing.` }
      ],
      prompt: 'Why are click labels biased, and how would you learn relevance more responsibly?',
      answer: `“Users can only interact with what is exposed, and higher positions receive different attention. Click labels therefore mix relevance with the logging policy. I would use exposure-aware analysis, independent relevance judgments, and controlled exploration where appropriate. Propensity weighting can help under suitable assumptions and support, but inaccurate propensities and small-probability events introduce error and variance.”`,
      pitfalls: ['Equating “not clicked” with “not relevant”.', 'Claiming propensity weighting fixes unexposed inventory without support.', 'Confusing high response probability with incremental causal impact.'],
      checkpoint: { question: 'An app had zero probability of being exposed by the logging policy. Can simple inverse propensity weighting estimate its counterfactual clicks from those logs?', options: ['Yes, assign an infinite weight', 'Yes, use a larger tree', 'No, the logs lack support for that app’s exposure'], correct: 2, explanations: ['An infinite weight does not create missing evidence.', 'Model capacity cannot identify an unsupported counterfactual from those logs alone.', 'Correct. You need additional evidence, assumptions, or a suitable intervention; IPW does not recover outcomes with zero exposure support.'] }
    },
    {
      id: 'evaluation-experiments', phase: 'Evaluate and explain', title: 'Offline validation, A/B tests, and diagnosing regressions', minutes: 8,
      subtitle: 'Build an evidence chain from a benchmark to user impact.', bridge: [2, 17, 25], sources: [],
      blocks: [
        { title: 'Make offline evaluation realistic', body: `Use time-based evaluation to simulate future traffic and calculate features as of each request. Keep a ranking request together. Depending on the claim, also hold out query families, users, or new items; a future-traffic test and an unseen-query test answer different questions.

Use a clear relevance rubric and representative judgments. Report uncertainty and paired query-level comparisons. Correlated examples require a suitable resampling unit, such as query or user clusters, rather than pretending each candidate row is independent.

Evaluate retrieval and ranking separately. A fixed-candidate benchmark isolates the ranker; a full-pipeline test captures retrieval changes. Use both where relevant. Segment head/tail queries, exact-title/exploratory intent, language, device, and cold start. Inspect examples as well as averages.` },
        { title: 'Design the online experiment before shipping', body: `Write the hypothesis and primary outcome first. Define conversion or successful search precisely, including unit, denominator, attribution window, and delayed outcomes. Pick guardrails such as p95 latency, error rate, and critical quality slices.

Choose a randomization unit that limits contamination. User-level assignment may avoid a person switching repeatedly between rankers, but query/session-level designs can be useful under different assumptions. Account for repeated observations when analyzing results.

Estimate sample size from the baseline rate, minimum detectable effect, chosen error rates, and experimental unit. Check logging and sample-ratio mismatch. Run for an appropriate planned duration covering traffic cycles; repeatedly peeking at an ordinary fixed-horizon test inflates false positives unless the analysis accommodates it.` },
        { title: 'Offline up, online down: a diagnostic sequence', body: `1. Verify assignment, telemetry, metric definitions, and mature outcomes.
2. Check whether online features, model versions, and candidate sets match offline assumptions.
3. Inspect latency, timeouts, missing features, and fallback rates.
4. Slice by intent, language, frequency, and app age to locate regressions.
5. Audit stale or biased labels and objective mismatch.
6. Decide whether to roll back, fix measurement, or run a narrower revised test.

An NDCG gain on editor judgments may not translate into installs, but that does not make semantic relevance useless. The benchmark and behavioral outcome measure different aspects. Compare both and make the trade-off explicit. A small positive point estimate without adequate uncertainty is not a proven improvement.` }
      ],
      prompt: 'Your ranker improves offline NDCG. Explain what you need before you can claim it improves App Store search.',
      answer: `“I would verify a time-safe representative benchmark and inspect intent and language slices. Then I would run a predefined randomized experiment with a clear search-success outcome, appropriate analysis unit, mature attribution window, and latency and quality guardrails. Offline gains justify a test, not a causal product claim. If outcomes disagree, I would check measurement, serving parity, performance, and label-objective mismatch.”`,
      pitfalls: ['Randomly splitting candidate rows from the same request across train and test.', 'Peeking until an ordinary p-value becomes significant.', 'Treating a failed online test as automatic proof that the model architecture is bad.'],
      checkpoint: { question: 'Why should candidates from one ranking request stay together in a split?', options: ['Otherwise request-specific information can cross the boundary and ranking evaluation loses coherent lists', 'Because every user must have the same query', 'Because ranking does not use validation'], correct: 0, explanations: ['Correct. Row-level splitting can leak shared context and break the query-group structure needed for meaningful ranking evaluation.', 'Users can have many different queries; that is not the reason.', 'Ranking requires careful validation just like other ML tasks.'] }
    },
    {
      id: 'serving-and-privacy', phase: 'Evaluate and explain', title: 'Serving constraints, privacy, and failure analysis', minutes: 7,
      subtitle: 'Explain how a good model becomes a reliable search experience.', bridge: [9, 25, 26], sources: ['privacy'],
      blocks: [
        { title: 'Account for the request-time budget', body: `End-to-end latency includes query processing, candidate fetches, feature lookups, scoring, and response construction. Tail latency matters because an average hides slow requests. Model inference is only one component.

Use an explicit illustrative budget, not invented Apple production numbers. Ask what service-level objective applies, then discuss batching, caching, parallel candidate sources, candidate limits, and a deadline-aware fallback. Cache keys must respect locale and any personalization; stale caches can violate freshness or eligibility.

For deployment, version models, feature schemas, and indexes together. Monitor candidate counts, empty results, feature missingness, score shifts, relevant-item coverage where measurable, latency, and fallback frequency. A changed index can alter the ranker's input distribution even if its weights are unchanged.` },
        { title: 'Privacy is a design constraint', body: `Do not assume you can log detailed personal histories simply because they would be predictive. Ask which signals are permitted, where processing may occur, how retention is limited, and how opt-outs are honored. Aggregate or contextual features and on-device computation may be options depending on the system.

Apple's public App Store privacy description discusses personalization using interactions as well as on-device and privacy-preserving processing. It does not reveal an exact ranking architecture. Treat the document as a constraint-setting source, not permission to invent internal implementation details.

In a technical review, propose a useful non-personalized baseline and graceful behavior for limited-history or opted-out users. Discuss performance, privacy, and measurement trade-offs without claiming that “privacy-preserving” is automatically achieved by deleting a name.` },
        { title: 'Debug the stage responsible', body: `For a missing result: check eligibility, index freshness, query processing, source coverage, and ANN retrieval before blaming ranker weights. For a low-ranked candidate: inspect features, labels, score contributions, and training coverage. For slow requests: inspect stage-level timing and tail distributions.

When a new app performs poorly, ask whether it lacks metadata, candidate exposure, or reliable interaction features. Compare metadata-only fallback behavior with history-rich scoring. When an exact app title regresses, inspect tokenization and intent-specific ranking before increasing personalization.

Tie each proposed fix to a test: an offline slice, a canary with operational checks, or a controlled product experiment. “Add more data” is not a diagnosis unless you say which missing evidence the new data supplies.` }
      ],
      prompt: 'What non-model considerations would you include when productionizing an App Store search ranker?',
      answer: `“I would budget end-to-end tail latency, validate feature and index freshness, ensure training-serving parity, and add a safe fallback and rollback path. I would monitor coverage and quality slices alongside operational failures. I would use only permitted signals, respect opt-outs and retention, and keep a useful contextual or non-personalized baseline.”`,
      pitfalls: ['Measuring average inference latency while ignoring feature-fetch timeouts.', 'Assuming anonymized IDs alone guarantee privacy.', 'Proposing personalization without an opted-out or cold-start path.'],
      checkpoint: { question: 'A model’s inference time is unchanged, but p95 search latency worsens after adding a feature. What should you check?', options: ['Only the model parameter count', 'Feature-fetch latency, timeouts, and request-path dependencies', 'Whether NDCG uses logarithms'], correct: 1, explanations: ['Parameter count alone does not account for the whole request path.', 'Correct. A slow or unreliable feature dependency can dominate end-to-end latency without changing inference time.', 'The offline metric formula is unrelated to that serving-path regression.'] }
    },
    {
      id: 'interview-playbook', phase: 'Evaluate and explain', title: 'Your technical reasoning playbook and advanced follow-ups', minutes: 8,
      subtitle: 'Turn concepts into concise answers and defensible decisions.', bridge: [25, 26, 28], sources: ['apple'],
      blocks: [
        { title: 'Structure every design answer', body: `Use **Goal → Data → Retrieval → Ranking → Evaluation → Serving → Risks**. This is a memory aid, not a script to recite regardless of the question.

Start with the user need and one or two key clarifications. State assumptions if information is missing. Choose a baseline, then justify the next level of complexity using a specific failure mode. Define labels, features, and split before naming a fancy loss. Finish with metrics, experiments, latency, privacy, and cold start.

For a definition question, use **definition → mechanism → example → trade-off**. For a debugging question, use **verify → localize → hypothesize → test → decide**. For “Why this model?”, compare viable alternatives under the same constraints rather than defend your favorite model unconditionally.` },
        { title: 'Practice at three depths', body: `**30 seconds:** “Search first retrieves eligible candidates and then ranks them for the query. I would combine lexical and semantic evidence, measure candidate coverage and top-K relevance, then test user impact with latency and privacy guardrails.”

**Two minutes:** Add query intent, a simple baseline, the label strategy, ranking objective, and the online experiment. Say what you would measure to justify each change.

**Ten minutes:** Work a system design with data schema, request-time features, negative sampling, bias, latency decomposition, cold start, and failure analysis. Let the reviewer steer deeper. Explain formulas only when they answer the question; technical detail should support your decision.` },
        { title: 'Know the modern follow-ups without losing the basics', body: `LLMs can help generate query–app relevance judgments, rewrite queries, or support a reranker. These are distinct jobs. LLM-generated labels are not automatically ground truth: define a rubric, calibrate against expert judgments, audit locale and tail-query failures, and keep evaluation independent of generated training labels.

Apple has published App Store research combining textual relevance judgments generated with an adapted LLM and behavioral ranking evidence, with offline and online validation. This is a useful technical review discussion topic, not evidence that your reviewer will ask about a particular model.

Also know multi-task and multi-objective trade-offs, representation distillation for lower serving cost, controlled exploration, and multimodal metadata when the role warrants it. Learn the purpose and failure modes first. These are follow-ups after a solid retrieval/ranking/evaluation foundation, not replacements for it.` },
        { title: 'A readiness checklist', body: `You should be able to explain where a missing relevant app was lost, choose a top-K metric, write a pairwise loss, spot future-data leakage, explain position bias, and design an online test.

You should also be able to say “I do not know the internal implementation, but under these assumptions I would test…” That is stronger than an unsupported claim. Use the next three cases to rehearse the full chain of reasoning, then revisit a case without reading its walkthrough.` }
      ],
      prompt: 'Give a two-minute answer to “How would you improve App Store search?” Include one explicit assumption and one trade-off.',
      answer: `“Assuming we are improving organic app discovery, I would clarify intent, latency, and success first. I would audit misses versus bad ordering, use a lexical baseline, and test semantic candidates where paraphrases fail. I would train a query-grouped ranker with time-safe features and both reliable semantic and behavioral evidence, then evaluate recall and NDCG by intent and locale. I would validate conversion or search success in a planned A/B test with latency and quality guardrails. A richer reranker may improve semantic matching but must earn its extra request-time cost.”`,
      pitfalls: ['Reciting architecture without a hypothesis or evaluation plan.', 'Presenting LLM labels as infallible expert judgments.', 'Pretending a hypothetical design describes Apple’s internal system.'],
      checkpoint: { question: 'What is the strongest opening to an ambiguous search-system design question?', options: ['Choose the largest available model', 'List every ranking algorithm you know', 'Clarify the user goal and constraints, then state assumptions and a baseline'], correct: 2, explanations: ['Model size does not establish what problem you are solving.', 'A catalog of names is not a reasoned design.', 'Correct. A clear goal and constraints make model, data, and evaluation choices defensible.'] }
    }
  ],
  cases: [
    {
      id: 'case-design-search', title: 'Design an App Store-style search system', minutes: 12,
      subtitle: 'A complete design walkthrough, from an ambiguous prompt to a testable architecture.', bridge: [25, 26], sources: [],
      scenario: 'You are asked to improve organic search for a large app catalog. Exact-title searches generally work, but users struggle with descriptive queries such as “offline maps for hiking”. Design a solution and explain how you would measure success.',
      blocks: [
        { title: '1. Clarify the problem and state assumptions', body: `Ask whether we are ranking apps only or also stories and in-app events; whether ads are out of scope; which languages and regions matter; and what data and latency constraints apply.

For this walkthrough, assume organic app results, region and device eligibility, a large catalog, and permitted query/impression/conversion logs. Assume the main failure is exploratory discovery, not exact-title matching. All architecture choices and numbers in this case are illustrative, not Apple's internal design.

Define success as useful app discovery rather than clicks alone. Choose a primary experimental outcome such as successful search sessions with an attributed download, while validating that it is an acceptable proxy for the actual product goal. Guard exact-title quality, empty results, and p95 response time.` },
        { title: '2. Localize the failure before designing', body: `Create a judged sample of exact-title and exploratory queries across languages and frequency buckets. For each missed relevant app, determine whether it was eligible, indexed, retrieved, and poorly ranked.

Suppose the desired hiking app is present in the catalog but absent from lexical candidates because its metadata uses “trail navigation” rather than “hiking maps”. This suggests a vocabulary-mismatch retrieval problem. If it is already retrieved at position 80, a ranking intervention may be more direct.

This diagnostic prevents spending weeks on a powerful ranker when candidate coverage is the actual bottleneck. It also gives you a concrete hypothesis: semantic retrieval should recover useful paraphrase matches.` },
        { title: '3. Build the minimum viable pipeline', body: `Start with language-aware lexical retrieval over app metadata. Preserve title matching. Add a semantic retriever trained or adapted to query–app relevance. Union eligible candidates by app ID and maintain source scores and source-presence features.

For illustration, retrieve a few hundred candidates from each branch within an agreed latency budget, then tune the combined candidate cap. Do not present those counts as requirements. Track the incremental relevant apps contributed by the semantic source, not just the larger total candidate count.

Use RRF as an initial fusion baseline. A downstream ranker can consume lexical and semantic similarity, exact-title match, category evidence, metadata quality, and time-safe behavior-derived features. Apply final eligibility rules and justified deduplication. Avoid broad diversification that pushes away the specific app a navigational query requests.` },
        { title: '4. Define training examples and choose the ranker', body: `Group candidate examples by request. Use expert graded relevance judgments for semantic fit and carefully attributed, mature behavioral labels for actual outcomes. Keep exposed non-interactions distinct from unexposed apps; audit negative sampling.

A query-grouped boosted-tree ranker with a ranking-aware objective is a defensible first upgrade over heuristics. It can combine heterogeneous matching features without demanding joint text encoding for every candidate. If fine-grained semantics remain a bottleneck, compare a limited cross-encoder reranker using identical candidates and judgments.

Build features as of the request time. Add metadata-based behavior for new apps and contextual behavior for users without permitted history. Compare gains from retrieval, labels, features, and model complexity with ablations.` },
        { title: '5. Evaluate the stages and the full product', body: `For retrieval, measure relevant-item Recall@candidateCap against the defined judged pool, plus latency and eligibility coverage. For ranking, measure NDCG@K on graded labels and MRR for exact-title success. Slice by intent, language, query frequency, and app age.

Compare a fixed-candidate ranker benchmark with an end-to-end pipeline benchmark. Use time-safe held-out traffic and confidence intervals with the appropriate cluster unit. Do not tune repeatedly on the final test set.

Run a predefined A/B test with a stable assignment unit, mature outcome window, quality guardrails, and checks for telemetry and sample-ratio mismatch. Offline improvements justify exposure to a controlled test; they are not proof of improved discovery.` },
        { title: '6. Cover serving, risk, and fallback', body: `Account for query encoding, two candidate branches, feature lookups, and ranking within the request deadline. Cache only when the key respects locale, eligibility, and any allowed personalization. Keep models and indexes compatible, and update app metadata and availability promptly.

If the semantic branch times out, serve a validated lexical path rather than block the whole request. Monitor whether fallback disproportionately affects a language or query type. Roll out with operational checks and a clear rollback plan.

Privacy limits which signals can be collected or used. Do not silently introduce personal-history logging. A useful contextual baseline remains necessary. Present these as constraints to clarify, not assumptions about Apple's private infrastructure.` },
        { title: 'Follow-up questions and strong responses', body: `**“Why not use only vector search?”** Exact names and rare terms can need lexical precision. I would compare complementary sources by intent before discarding either.

**“How will you handle a new app?”** Index its metadata immediately, use content-based similarities and non-history features, and evaluate new-app coverage separately. No interaction history is not evidence of irrelevance.

**“What if the cross-encoder adds too much latency?”** Limit its candidate count, compare a cheaper ranker or distilled model, and test whether its marginal quality gain survives the serving constraint.

**“What would you implement first?”** A stage-by-stage error audit and an evaluation set, followed by a lexical baseline and the smallest change targeted at the observed failure.` }
      ],
      prompt: 'Give your own five-minute design answer before opening the sample summary. Name a baseline, a retrieval metric, a ranking metric, and an online guardrail.',
      answer: `“I would focus on exploratory-query misses while protecting exact-title searches. After auditing where relevant apps are lost, I would test a lexical-plus-semantic candidate pipeline and a query-grouped ranker with time-safe matching and metadata features. I would separate semantic judgments from behavioral targets, evaluate candidate recall and top-K quality by intent and locale, and run a planned A/B test on search success with latency and quality guardrails. I would add a richer reranker only if measured errors and serving costs justify it, with privacy-aware features and a safe lexical fallback.”`,
      pitfalls: ['Skipping failure localization.', 'Optimizing downloads without defining attribution and quality.', 'Assuming every candidate or user has rich history.'],
      checkpoint: { question: 'Exploratory-query misses improve, but exact-title MRR falls sharply. What is the best conclusion?', options: ['Ship because average NDCG rose', 'Increase semantic model size immediately', 'The aggregate gain hides an important intent-specific regression; inspect and protect navigational matching'], correct: 2, explanations: ['Average quality does not erase a critical navigational failure.', 'A larger model is not a targeted explanation or fix.', 'Correct. Validate the regression, localize its cause, and revise candidate fusion or intent-sensitive ranking before declaring the change successful.'] }
    },
    {
      id: 'case-tail-queries', title: 'Improve tail queries when labels are scarce', minutes: 11,
      subtitle: 'Reason about semantic relevance, cold-start apps, and LLM-assisted labels.', bridge: [9, 10, 21, 24], sources: ['apple'],
      scenario: 'Search performs well for popular app names but poorly for rare descriptive queries and recently launched apps. The team has many interaction logs but few expert query–app relevance judgments. What would you change?',
      blocks: [
        { title: '1. Separate three possible problems', body: `Low-frequency queries have little direct feedback. New apps have little behavior history. Descriptive queries may have vocabulary mismatch. These are related but distinct problems.

First compare candidate coverage and ranking quality for each slice. An app missing from all candidates needs retrieval or indexing work; a retrieved app systematically penalized for low downloads needs feature or objective review. Poor query interpretation needs a different intervention again.

Use a held-out judged set spanning head and tail queries, new and mature apps, and relevant languages. Define an operational tail threshold for analysis, but do not treat a chosen traffic cutoff as a universal industry definition.` },
        { title: '2. Add evidence that generalizes beyond popularity', body: `Leverage app descriptions, titles, categories, and query semantics. Content representations can score a new app without waiting for downloads. A query–app relevance model can generalize across similar requests rather than memorizing a raw query ID.

Audit behavior-derived features. Unsmoothed conversion rates from one or two impressions are unstable; zero interactions may mean zero exposure. Missing-history indicators and supported smoothing are preferable to blindly assigning poor quality.

If retrieval lacks semantic candidates, test a complementary retriever. If ranking already has the candidates, test text relevance features or labels there first. More candidate sources and a more powerful ranker should be separate ablations.` },
        { title: '3. Use an LLM as a labeling assistant, not an oracle', body: `Write a relevance rubric. For “offline hiking maps”, require actual evidence of offline map functionality and suitability for hiking, not just outdoor-related words. Give the labeling system sufficient app metadata and allow uncertainty when support is missing.

Create an expert-labeled development subset to assess agreement and systematic mistakes. Check language, app popularity, metadata length, and unsupported capability claims. Compare simpler text models or human-only labels as baselines. A large model is not inherently more accurate for this task.

Generate proposed labels for selected query–app candidates, then audit uncertain and high-impact cases. Record labeling-model and rubric versions. Keep the independent expert evaluation set separate from synthetic training labels to avoid circular validation.` },
        { title: '4. Train and isolate the source of improvement', body: `Keep a baseline using existing behavioral evidence. Add semantic features, expert labels, and generated labels in staged experiments. If objectives are combined, define whether you are optimizing multiple targets or using new judgments to improve representations; do not casually mix label scales.

For hard negatives, choose plausible but unsuitable apps. A generic travel guide may mention hiking yet offer no offline maps. Check that the negative truly fails the rubric rather than merely lacks exposure.

Ablate the new labels while holding the architecture fixed. Then compare architecture changes with the same labels. This supports a credible answer to “Did the model improve because of the LLM, the data, or the ranker?”` },
        { title: '5. Evaluate more than the target slice', body: `Measure tail-query candidate recall and NDCG on expert judgments, as well as new-app coverage and exact-title MRR. Inspect whether the change invents semantic matches for apps with vague marketing descriptions.

Use a time-based test so new-app features reflect only what was known then. Report both equal-query and traffic-weighted views if they address different questions. A tail improvement can be diluted in an overall traffic metric; conversely, a weighted overall gain can conceal tail harm.

Run an online experiment with the predefined outcome and guardrails. Keep enough statistical power for the slice you intend to claim. A promising subgroup point estimate is not automatically a reliable subgroup effect.` },
        { title: 'What this case teaches', body: `The important reasoning chain is **sparse feedback → missing semantic evidence → validated labels or representations → isolated offline tests → online validation**. Do not jump from “rare queries” to “use the biggest LLM”.

Apple's public search research is a real example of combining textual judgments and behavioral relevance, including attention to tail-query performance. The proposal above is a hypothetical exercise inspired by that problem class, not a reproduction of Apple's implementation.

If asked what could fail, mention hallucinated app capabilities, biased judgments, synthetic-label evaluation leakage, noisy low-support behavioral features, and unchanged candidate coverage.` }
      ],
      prompt: 'Explain your plan for tail queries in three minutes. Include how you would validate generated labels and isolate their effect.',
      answer: `“I would first separate missing candidates from poor ordering and distinguish rare queries from new-item cold start. I would add content-based evidence and audit popularity-derived features. If expert labels are scarce, I would test LLM-assisted judgments against an independent expert rubric, audit errors and uncertainty, and retain an expert-only evaluation set. I would ablate labels, features, and architecture separately, then validate tail-query relevance and online outcomes while protecting exact-title quality and serving latency.”`,
      pitfalls: ['Calling synthetic judgments ground truth.', 'Evaluating generated training labels against labels from the same generator.', 'Expecting better labels to rank an app that is never retrieved.'],
      checkpoint: { question: 'Which evaluation best tests whether generated relevance labels improve the actual task?', options: ['An independent expert-judged held-out set plus an appropriately designed online experiment', 'Agreement with the same LLM that generated the training labels', 'Training loss alone'], correct: 0, explanations: ['Correct. Independent judgments and online validation reduce circularity and test both relevance and product impact.', 'This can reward reproducing the generator’s errors and biases.', 'A lower training loss does not demonstrate better held-out ranking or user outcomes.'] }
    },
    {
      id: 'case-online-regression', title: 'Offline NDCG rises, but online conversion falls', minutes: 11,
      subtitle: 'A debugging technical review: form hypotheses, test them, and make a launch decision.', bridge: [2, 17, 25, 26], sources: [],
      scenario: 'A new ranker improves judged NDCG@10 by 4% relative offline. In an online test, download conversion appears lower and p95 latency is higher. The product team asks whether to ship. All numbers in this exercise are invented.',
      blocks: [
        { title: '1. Do not defend or reject the model yet', body: `Ask for baseline values, uncertainty, experiment duration, assignment unit, outcome maturation, and the guardrail thresholds. “4% relative NDCG” does not mean four percentage points, and NDCG and conversion do not share a scale.

Suppose the hypothetical review shows enough evidence of a latency guardrail breach. Pause or roll back according to the rollout policy while investigating. If the conversion decrease is still statistically uncertain, say so; do not announce a proven decrease from a negative point estimate alone.

Your job is to protect the experience and identify the mechanism, not preserve a favorite model. Preserve experiment metadata and diagnostic traces permitted by policy so the failure can be analyzed.` },
        { title: '2. Verify measurement and comparability', body: `Check sample-ratio mismatch, assignment contamination, event loss, deduplication, denominators, and attribution. Confirm that treatment and control outcomes have equally mature observation windows.

Check whether the offline set reflects current traffic. Did it contain mostly descriptive English queries while online traffic includes many exact-title requests and other languages? Were offline features calculated with future downloads? Did the benchmark use a different candidate policy?

Confirm model, feature, tokenizer, and index versions. A good offline artifact is not necessarily what is being served. This establishes whether you are diagnosing the intended treatment or a deployment mismatch.` },
        { title: '3. Localize the performance regression', body: `Measure stage-level timings. A new feature can add slow remote lookups even when model inference is fast. Inspect timeouts, missing-feature rates, and whether fallback paths return weaker lists. Compare treatment behavior on cache hits and misses.

Then segment user outcomes by request latency and intent, while remembering these are diagnostic associations rather than randomized subgroup interventions. Slow responses can reduce interaction opportunities and lead to more abandons.

A targeted fix might remove a slow feature, compute it earlier, cap expensive reranking, or use a validated simpler fallback. Retest the altered system; do not assume fixing latency also fixes relevance.` },
        { title: '4. Localize the quality regression', body: `Inspect exact-title MRR, exploratory NDCG, language slices, tail queries, and new-app behavior. Compare rank changes for representative requests. Did personalization push a generic popular app above the explicitly named app? Did generated judgments overvalue appealing descriptions?

Check label-objective mismatch: semantic fit may improve while downloads fall because availability, trust, price, or familiarity changed. Click behavior is also affected by placement and presentation. Do not conclude that either behavioral data or semantic judgments alone must be correct.

If global popularity became dominant, compare an ablation and new-app coverage. If the judged set was unrepresentative, repair the benchmark before selecting another model against it.` },
        { title: '5. Decide using evidence and a revised hypothesis', body: `Possible decisions include rollback for a clear guardrail breach, fix telemetry before interpreting results, narrow a treatment to supported intent classes, or reject the modeling change if its quality trade-off is unacceptable.

Example revised hypothesis: “A cheaper reranker on exploratory queries improves discovery while preserving navigational success and meeting the latency objective.” Predefine a new experiment instead of selecting favorable slices after the fact and claiming the original test succeeded.

Document what changed and what remains uncertain. Distinguish root cause, contributing factors, and hypotheses not yet tested. A strong explanation includes the evidence required to choose among them.` },
        { title: 'Follow-ups the reviewer may ask', body: `**“Does this prove NDCG is useless?”** No. It tests relevance under its judgments and cutoff. The problem may be serving, benchmark representativeness, or a different product objective.

**“Could position bias explain the issue?”** It can distort the training signal and logs. A properly randomized online comparison still evaluates the total treatment effect, subject to assignment, interference, and measurement assumptions.

**“Would you ship to the subgroup that improved?”** Only with a justified hypothesis, uncertainty-aware analysis, and validation. Searching many subgroups after the result can create false discoveries.

**“What would you tell the product team?”** The current evidence does not support broad launch if a guardrail is breached. I would identify the most likely bottleneck, make the smallest testable correction, and rerun a planned comparison.` }
      ],
      prompt: 'Explain your first five checks and your launch decision. Clearly distinguish a confirmed failure from a hypothesis.',
      answer: `“I would not ship solely on the offline gain. I would check uncertainty and guardrails, validate experiment telemetry and mature labels, confirm training-serving parity, localize latency and fallback failures, and inspect intent and locale quality slices. A confirmed operational breach warrants pausing or rollback under the rollout policy. I would then test a targeted correction with a predefined hypothesis, rather than choose a favorable post-hoc subgroup or assume the model architecture caused everything.”`,
      pitfalls: ['Shipping on offline NDCG despite a confirmed user-facing guardrail breach.', 'Treating a negative point estimate as a proven causal decrease.', 'Cherry-picking a winning subgroup after searching many slices.'],
      checkpoint: { question: 'What does an offline NDCG gain establish on its own?', options: ['The treatment must increase downloads', 'Better ordering under that evaluation set’s judgments and metric, not guaranteed online product improvement', 'That serving latency cannot regress'], correct: 1, explanations: ['Downloads depend on more than the judged ordering quality.', 'Correct. Offline evidence supports a specific benchmark claim and a reason to test, not a blanket online success claim.', 'Offline relevance scores say nothing about request-path latency.'] }
    }
  ]
};
