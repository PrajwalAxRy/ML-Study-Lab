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
  ],
  cases: [
  ]
};
