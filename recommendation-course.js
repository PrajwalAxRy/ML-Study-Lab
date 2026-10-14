/* Original study lessons. App Store designs and numerical examples are hypothetical. */
window.RECOMMENDATION_COURSE = {
  id: 'recommendations',
  title: 'Recommendation Fundamentals',
  description: 'Learn how to recommend useful apps: feedback, collaborative filtering, embeddings, cold start, and clear design.',
  sources: {
    overview: { title: 'Google: recommendation architecture', url: 'https://developers.google.com/machine-learning/recommendation/overview/types' },
    content: { title: 'Google: content-based filtering', url: 'https://developers.google.com/machine-learning/recommendation/content-based/basics' },
    collaborative: { title: 'Google: collaborative filtering', url: 'https://developers.google.com/machine-learning/recommendation/collaborative/basics' },
    factorization: { title: 'Google: matrix factorization', url: 'https://developers.google.com/machine-learning/recommendation/collaborative/matrix' },
    als: { title: 'Implicit library: alternating least squares', url: 'https://benfred.github.io/implicit/api/models/cpu/als.html' },
    implicitPaper: { title: 'Original implicit-feedback factorization paper', url: 'https://yifanhu.net/PUB/cf.pdf' },
    bpr: { title: 'Original BPR paper', url: 'https://arxiv.org/abs/1205.2618' },
    sampling: { title: 'Google Research: mixed negative sampling for app recommendations', url: 'https://research.google/pubs/mixed-negative-sampling-for-learning-two-tower-neural-networks-in-recommendations/' },
    sampledMetrics: { title: 'Google Research: sampled recommendation metrics', url: 'https://research.google/pubs/on-sampled-metrics-for-item-recommendation/' },
    reranking: { title: 'Google: reranking, freshness, and diversity', url: 'https://developers.google.com/machine-learning/recommendation/dnn/re-ranking' },
    diversity: { title: 'Google Research: accuracy and diversity metrics', url: 'https://research.google/pubs/towards-unified-metrics-for-accuracy-and-diversity-for-recommender-systems/' }
  },
  glossary: [
    ['Explicit feedback', 'Directly expressed preferences, such as ratings or a “not interested” action. These signals can be sparse and selectively provided.'],
    ['Implicit feedback', 'Observed behavior, such as views or downloads. Its meaning depends on exposure, context, and outcome definition.'],
    ['Interaction matrix', 'A user-by-item table of observed feedback. Missing cells are usually unknown, not verified dislike.'],
    ['Content-based filtering', 'Recommend from item attributes and a representation of the user’s interests, rather than requiring other users’ shared behavior.'],
    ['Collaborative filtering', 'Learn useful relationships from interaction patterns across users and items. It can reveal associations not obvious from item metadata.'],
    ['Latent factor', 'A learned component of a user or item vector. It is not necessarily a human-readable category.'],
    ['Candidate generation', 'Select a manageable set for later ranking. Relevant items lost here cannot be recovered by the downstream ranker.'],
    ['Hybrid recommender', 'Combine complementary recommendation signals or methods. The combination may happen at retrieval, feature, model, or reranking level.'],
    ['Cold start', 'Insufficient interaction history for a new user, app, or context. Content and contextual baselines can provide initial evidence.'],
    ['Diversity', 'Variation among recommended items. It is distinct from relevance, novelty, and whole-catalog coverage.'],
    ['Novelty / serendipity', 'Novelty means unfamiliarity; serendipity adds useful unexpected discovery. A random irrelevant app is not automatically serendipitous.'],
    ['Exposure bias', 'Feedback depends on which items the old system showed. Unexposed items have unknown outcomes, not proven rejection.']
  ],
  lessons: [
    {
      id: 'rec-framing', phase: 'Understand the problem', title: 'Start with users, items, and a useful outcome', minutes: 6,
      subtitle: 'Understand recommendations without assuming a typed search query.', bridge: [1, 2, 25], sources: ['overview'],
      blocks: [
        { title: 'What is the recommendation problem?', body: `A recommendation system selects useful items for a user or context. Unlike search, it may have no explicit query. An app-store homepage, “apps like this”, and suggestions during onboarding are different recommendation surfaces. They should not automatically use the same target or model.

Think of the inputs as **user or context, eligible inventory, and surface**. The output is an ordered set of suggestions. The learning problem is not simply “predict whether this user likes this app”; you must decide what useful discovery means and what feedback supports that claim.

For a hypothetical user who recently explored hiking tools, useful suggestions might include trail navigation and a weather app. Recommending five near-identical map apps could score well individually yet create a poor discovery experience. The list matters as well as each item's score.` },
        { title: 'Clarify success before choosing a model', body: `Ask where recommendations appear, whether the user has history, what interactions may be used, which apps are eligible, and the latency and privacy constraints. Clarify whether installed apps should be excluded, included for events or updates, or treated differently by surface.

Potential outcomes include a tap, an attributed download, a meaningful subsequent interaction, or useful discovery. Downloads can be a practical proxy but are not automatically lasting satisfaction. Long-term outcomes may be delayed or unavailable under the allowed measurement policy.

Choose one primary outcome and guardrails. For example, test whether recommendations improve discovery while preserving response time, quality, and new-user experience. State assumptions about permitted signals instead of claiming access to detailed app usage.` },
        { title: 'Understand the standard multi-stage design', body: `Candidate generation finds plausible apps cheaply. Ranking evaluates them with richer features. Reranking enforces final rules and can balance variety and freshness. The exact stages and counts depend on the product; the pattern is not a claim about Apple's internal architecture.

Start with an eligible popularity or curated baseline. Add content or collaborative evidence only when it addresses a measured gap. A system with excellent ranking but poor candidate coverage cannot recommend a useful missing app.

In a technical review, explain **what you optimize, what evidence you use, how candidates arrive, and how you validate impact**. Recommendation models are a part of that answer, not the entire answer.` }
      ],
      prompt: 'Explain recommendations versus search and name the first clarifications you would ask for an app recommendation surface.',
      answer: `“Search starts with an explicit query; recommendations can start with user history, a seed app, or context. I would clarify the surface, eligible inventory, permitted signals, success outcome, and serving constraints. I would establish a simple discovery baseline, then separate candidate generation, ranking, and final constraints and evaluate both stage quality and product impact.”`,
      pitfalls: ['Assuming every recommendation surface has the same objective.', 'Optimizing taps without discussing meaningful outcomes.', 'Beginning with a complex architecture before clarifying available data.'],
      checkpoint: { question: 'What should you establish before choosing a recommender model?', options: ['The surface, user goal, allowed feedback, and measurable outcome', 'A fixed embedding dimension for every product', 'A rule that all installed apps must always be excluded'], correct: 0, explanations: ['Correct. These determine labels, eligibility, model requirements, and evaluation.', 'Representation size should follow capacity and serving constraints, not precede the problem definition.', 'Whether installed apps are eligible depends on the surface, such as discovery versus updates or events.'] }
    },
    {
      id: 'rec-feedback', phase: 'Understand the problem', title: 'Feedback, exposure, and strong simple baselines', minutes: 7,
      subtitle: 'Learn what an interaction does and does not tell you.', bridge: [8, 9, 16, 17], sources: [],
      blocks: [
        { title: 'Explicit and implicit feedback', body: `Explicit feedback directly expresses a preference: a star rating, a favorite, or “not interested”. Implicit feedback is behavior: an impression, tap, download, or another permitted outcome. Explicit feedback can be clearer but selective; implicit feedback is abundant but ambiguous.

A download may reflect a genuine need, a one-time task, promotion, or a mistaken choice. An app not downloaded may never have been shown. Even a shown app may not have been noticed. Missing behavior is not verified dislike.

Define impressions carefully: returned, rendered, and actually visible are different events. Define attribution and the maturation window for delayed outcomes. New feedback is not automatically a mature negative. These decisions shape the user–item interaction table you can trust.` },
        { title: 'Build baselines that expose the value of personalization', body: `Start with eligible popular or trending apps, curated choices, and simple category matching. Popularity may be calculated globally or within appropriate locale or category cohorts. Compute aggregates using only prior events and audit promotion or exposure effects.

Popularity is a reasonable fallback but can reinforce head items. “Trending” requires a defined time window and comparison baseline; raw recent counts can be unstable. Human curation can supply useful quality priors but is not a universal personalized solution.

Compare a proposed model against these baselines on the same inventory and splits. If personalization fails to outperform a strong contextual baseline, identify whether data quality, cold start, or the target limits the model before adding layers.` },
        { title: 'Construct time-safe features and labels', body: `A user history must contain only events available before the recommendation request. Item popularity, category preferences, and conversion aggregates must also be time-safe. Repeated refreshes can create correlated observations; sampling and analysis should respect the request or user unit.

Different actions carry different meanings. Combining views, favorites, and downloads into one score requires a stated weighting scheme, not an assumption that each count measures the same preference. Apply recency weighting when justified, and consider whether repeated actions signal strength or merely repeat exposure.

In technical discussions, say how you distinguish history, prediction time, and label window. This is a concrete way to demonstrate that your ML fundamentals transfer to recommendation data.` }
      ],
      prompt: 'Why is an unobserved user–app interaction not automatically a negative, and what baseline would you use?',
      answer: `“Missing interactions mix non-exposure, non-attention, and lack of interest. I would define the exposure and outcome windows, keep signals distinct, and construct time-safe histories. An eligible popularity or contextual baseline gives a realistic benchmark and cold-start path. I would measure what personalization adds under identical evaluation conditions.”`,
      pitfalls: ['Treating every empty interaction-matrix cell as a known dislike.', 'Using the target action in the user-history features for that same request.', 'Comparing a model with a deliberately weak baseline or different eligibility rules.'],
      checkpoint: { question: 'A user never downloaded an app that was never exposed. What can you conclude?', options: ['The user dislikes the app', 'The outcome is unknown; exposure and interest are not established', 'The app must be low quality'], correct: 1, explanations: ['Absence of exposure prevents that inference.', 'Correct. The missing action is not a reliable negative preference label.', 'Global app quality cannot be inferred from one missing user interaction.'] }
    },
    {
      id: 'rec-content', phase: 'Learn the core methods', title: 'Content-based recommendations and user profiles', minutes: 8,
      subtitle: 'Recommend from attributes before you have rich collaborative history.', bridge: [9, 18, 20], sources: ['content'], lab: 'content',
      blocks: [
        { title: 'Represent apps using their attributes', body: `Content-based methods use item attributes: category, text, capabilities, or permitted structured metadata. A simple app vector might describe outdoor and productivity features. A learned text embedding can capture richer relationships, but it is still limited by the available content and training objective.

Build a user profile from items the user positively interacted with, or from explicit onboarding interests. A simple profile is a weighted average of item vectors. Recency and action strength can influence weights, but tune those choices rather than assume recent clicks always dominate.

Score candidate items using similarity to that profile. For a two-feature toy profile, **score = outdoorWeight × outdoorFeature + productivityWeight × productivityFeature**. This illustrative dot product is not a calibrated download probability.` },
        { title: 'Work a simple example', body: `Suppose a profile weights outdoor interest at 0.7 and productivity at 0.3. Trail Atlas has features [0.9, 0.1], so its score is **0.7×0.9 + 0.3×0.1 = 0.66**. Task Board has [0.2, 0.95], giving **0.425**. With this feature definition, Trail Atlas ranks higher.

Change the profile to 0.2 outdoor and 0.8 productivity. Trail Atlas scores 0.26 and Task Board scores 0.80. The item vectors are unchanged; changing the profile changes the recommendations. The exercise below lets you see this directly.

Real content embeddings need sensible similarity choices and normalization. A large vector magnitude may affect dot-product scores. Category overlap alone may miss functionality, quality, cost, or current intent.` },
        { title: 'Strengths, limitations, and technical judgment', body: `Content methods can score a new app from metadata before it has behavioral history. They can offer understandable matching signals and a useful fallback. They still need some representation of user or context; a new user does not magically acquire preferences from an item encoder.

Content matching can over-specialize: more of the same is not always useful discovery. Poor metadata limits the method, and weighted history may collapse multiple interests into a vague average. Consider multiple interest representations or complementary candidate sources if error analysis warrants them.

When asked “Why content-based?”, connect it to cold-start items and available attributes. When asked what could fail, discuss metadata quality, over-specialization, context changes, and privacy-limited history. Do not claim that content-based filtering never uses behavior; it often uses the user's interactions to build the profile.` }
      ],
      prompt: 'Explain content-based filtering using a user-profile vector, then describe one cold-start benefit and one limitation.',
      answer: `“I represent apps by their attributes and build a user or contextual profile from permitted interests or prior interactions. Similarity retrieves or scores matching apps. New items can be represented without item interaction history, but new-user preferences still need a baseline or context. The method can over-specialize and cannot infer capabilities absent from metadata.”`,
      pitfalls: ['Saying content-based methods require no information about the user or context.', 'Calling an arbitrary similarity score a calibrated probability.', 'Assuming a new app’s metadata is complete and accurate.'],
      checkpoint: { question: 'Why can content-based filtering help with a new app?', options: ['It creates genuine interaction history from nothing', 'It guarantees that every user will like the app', 'It can represent the app from metadata before behavioral history exists'], correct: 2, explanations: ['Metadata can supply a representation, not real interactions.', 'Matching attributes do not guarantee preference or quality.', 'Correct. Item attributes can provide a scoring path before enough collaborative evidence is available.'] }
    },
    {
      id: 'rec-collaborative', phase: 'Learn the core methods', title: 'Collaborative filtering: users and item neighbors', minutes: 8,
      subtitle: 'Learn from shared patterns rather than just matching descriptions.', bridge: [7, 13, 18], sources: ['collaborative'],
      blocks: [
        { title: 'The user–item interaction matrix', body: `Rows are users or appropriate anonymous entities, columns are apps, and cells contain defined feedback. The matrix is usually sparse: most people interact with a tiny part of the catalog. Collaborative filtering uses patterns across this matrix to find useful relationships.

In user-based neighborhood methods, find people with similar feedback and score apps they liked that the target user has not already consumed, subject to eligibility. In item-based methods, find apps with similar interaction audiences and recommend neighbors of a user's seed items.

The associations need not be obvious in metadata. Users of trail-navigation apps may also prefer weather tools. Shared users provide complementary evidence to descriptions. This is correlation under the observed policy, not proof that one app causes interest in another.` },
        { title: 'Calculate a tiny item similarity', body: `Suppose app A has interacted users {1,2,3} and app B has {2,3,4}. Jaccard overlap is **2/4 = 0.5**. App C has users {1,2}, so A–C overlap is **2/3 ≈ 0.667**. These scores reflect observed overlap, not intrinsic similarity.

Cosine similarity is another choice for binary or weighted interaction vectors. With explicit ratings, centered measures may help remove users' different rating scales. Sparse overlap can make estimates noisy, so require adequate support or use shrinkage where justified.

Popular apps naturally overlap with many audiences. Normalize and inspect popularity effects rather than let raw co-occurrence counts decide everything. Precomputing top item neighbors can make “similar apps” retrieval inexpensive, but updates must reflect current inventory and feedback.` },
        { title: 'Choose the method for the problem', body: `Item neighborhoods are an interpretable baseline for related-app recommendations. User neighborhoods may become expensive or unstable with enormous user populations and short histories. Both depend on sufficient reliable overlap and can inherit old exposure patterns.

New apps with no interactions have no informative collaborative neighbors. New users with no history have no reliable collaborative profile. Content and contextual methods remain valuable for those cases. Rare tastes and sparse locales also need slice-level evaluation.

Collaborative filtering is a family, not a synonym for matrix factorization. Neighborhood methods use observed relationships directly; factorization methods learn compressed representations from them. In a technical review, make that distinction before discussing scalability.` }
      ],
      prompt: 'Compare content-based, user-based collaborative, and item-based collaborative recommendations for apps.',
      answer: `“Content-based methods match item attributes to interests. User-based collaborative filtering borrows evidence from similar users; item-based filtering uses shared interaction audiences to find neighbors. Collaborative signals can reveal useful cross-category relationships, but sparse overlap, exposure bias, and cold start limit them. I would benchmark an item-neighbor baseline and retain a content or contextual fallback.”`,
      pitfalls: ['Equating collaborative filtering only with matrix factorization.', 'Using raw shared-user counts without considering item popularity.', 'Interpreting co-interaction as a causal relationship.'],
      checkpoint: { question: 'Two apps have very different descriptions but share a strong interaction audience. Which method most directly uses that relationship?', options: ['Item-based collaborative filtering', 'Exact title matching alone', 'Ignoring all other users’ interactions'], correct: 0, explanations: ['Correct. It uses cross-user co-interaction evidence rather than requiring metadata similarity.', 'Title matching would not capture that audience relationship.', 'Collaborative evidence specifically relies on patterns beyond one user.'] }
    },
    {
      id: 'rec-factorization', phase: 'Learn the core methods', title: 'Matrix factorization, implicit ALS, and BPR', minutes: 10,
      subtitle: 'Connect linear algebra, optimization, and ranking to recommendations.', bridge: [18, 19, 21], sources: ['factorization', 'implicitPaper', 'als', 'bpr'],
      blocks: [
        { title: 'Compress interaction patterns into latent vectors', body: `Factorization assigns each user a vector u and app a vector v, often predicting affinity with **s(u,i) = u · vi** plus optional biases. The vectors summarize interaction patterns. A latent dimension is not necessarily a readable concept like “outdoors”; equivalent transformed factors can represent similar predictions.

For explicit ratings, a common objective fits observed ratings with squared error plus regularization. Missing ratings are not automatically zero-rated preferences. Regularization controls overfitting, especially when a user or item has few observations.

The dot product can support cheap candidate retrieval. Learned ID vectors need history for the corresponding IDs; metadata-free factorization does not inherently encode an unseen app. This explains why hybrid representations are useful.` },
        { title: 'Implicit weighted factorization and ALS', body: `An implicit formulation separates a binary preference indicator from confidence. A common teaching convention uses **pui = 1 if an interaction exists, otherwise 0**, with **cui = 1 + α×interactionStrength**. The objective is **Σ cui(pui − u·vi)^2 + regularization**.

Here a zero for missing interaction is a modeling proxy with lower confidence, not a verified dislike. Repeated activity increases confidence under this convention, not necessarily the preference target. The meaning and transform of interaction strength must be chosen for the event type.

**Alternating least squares (ALS)** fixes item factors while solving user factors, then fixes user factors while solving item factors. Each conditional subproblem is more tractable, but the joint problem is not generally convex and global optimality is not guaranteed. Weighted implicit ALS should not be confused with ordinary unweighted factorization of a table full of negative labels.` },
        { title: 'BPR: optimize sampled within-user preferences', body: `Bayesian Personalized Ranking (BPR) uses user–positive–negative triples. It encourages the score of an interacted item i to exceed a sampled unobserved item j with a loss such as **−log sigmoid(sui − suj)** plus regularization.

This preference is a training assumption, not proof that every unobserved item is disliked. Sampling affects the task: easy random negatives can give little discrimination, while hard negatives can include genuinely useful apps. Inspect false negatives and the serving candidate distribution.

ALS and BPR differ in their objectives and optimization, not simply in “old versus new”. Compare ranking quality, efficiency, confidence modeling, and supported cold-start paths. Be ready to explain the dot product, the loss, and the assumptions before discussing specialized implementations.` }
      ],
      prompt: 'Explain matrix factorization, then compare weighted implicit ALS with BPR.',
      answer: `“Factorization learns user and item vectors whose dot product summarizes affinity. Weighted implicit ALS fits binary preference proxies with confidence weights while alternating factor updates. BPR learns sampled within-user orderings between observed and unobserved items. Both depend on feedback and sampling assumptions, so I would compare top-K quality and serving cost and provide metadata-based cold-start handling.”`,
      pitfalls: ['Treating missing feedback as a certain dislike.', 'Claiming ALS guarantees a global optimum.', 'Assuming latent dimensions have fixed semantic names or that ID factors represent unseen apps.'],
      checkpoint: { question: 'In common weighted implicit factorization, what does repeated interaction primarily increase?', options: ['The number of app IDs', 'Confidence in the modeled preference signal', 'Proof of causal incremental value'], correct: 1, explanations: ['Repeated interaction does not create new IDs.', 'Correct. In the stated convention, preference is a binary proxy and interaction strength affects its confidence weight.', 'Observational frequency is not evidence of a causal treatment effect.'] }
    },
    {
      id: 'rec-candidates', phase: 'Design the system', title: 'Candidate generation, two towers, and negative sampling', minutes: 8,
      subtitle: 'Find plausible recommendations efficiently before expensive scoring.', bridge: [20, 21, 24, 25], sources: ['sampling'],
      blocks: [
        { title: 'Use complementary candidate sources', body: `A homepage can retrieve from user–item factorization, neighbors of recently engaged apps, content matching, contextual popularity, and curated inventory. Each source may catch useful items the others miss. Union by stable item ID and preserve source evidence for later ranking.

Deduplicate and respect eligibility. At a fixed candidate cap, adding a source can displace other useful candidates, so measure source contribution and overlap rather than celebrate a larger raw list. A source score is not automatically comparable with another source's score.

For related-app recommendations, the seed app supplies context. For a homepage, the representation may come from user interests and permitted request context. In recommender terminology “query” can mean this retrieval context, not necessarily typed text.` },
        { title: 'Two-tower recommendations', body: `A user/context tower encodes permitted history and context; an item tower encodes app attributes and optional learned IDs. Similarity encourages useful user–item matches. Precomputed item vectors allow efficient nearest-neighbor retrieval, with a compatible user encoder at request time.

Unlike metadata-free ID factorization, feature-based towers can offer representation paths for previously unseen feature combinations. This does not guarantee strong cold-start recommendations: sparse or misleading content and absent user preferences still matter.

Train with reliable positives and sampled comparisons. In-batch negatives are convenient, but frequent items appear disproportionately and some comparison items may also be good recommendations. Random, hard, and in-batch negatives have different trade-offs; choose and audit a distribution aligned with the intended task.` },
        { title: 'Evaluate the retrieval stage separately', body: `Measure how many future or judged useful items appear in the candidate pool under a stated reference set. Also measure eligible candidate counts, latency, index freshness, and new-app coverage. Candidate recall against historical outcomes is affected by the old exposure policy.

Distinguish the quality of learned representations from ANN approximation quality. An accurate approximate index can faithfully retrieve unhelpful neighbors if the embeddings do not represent the product need.

For a technical review, explain when to precompute, when to update, what happens when sources time out, and how feature and index versions stay compatible. Your Search module goes deeper on ANN and contrastive mechanics; this lesson focuses on recommender-specific inputs and sampling.` }
      ],
      prompt: 'Design candidate generation for a personalized app homepage. Explain two-tower inputs and one negative-sampling risk.',
      answer: `“I would combine collaborative, content, related-item, and contextual baseline sources, then deduplicate eligible candidates within a tuned budget. A feature-based user/context tower and app tower could supply semantic retrieval using precomputed app vectors. I would audit false negatives and item-frequency bias, then evaluate candidate recall, cold-start coverage, freshness, and latency independently of final ranking.”`,
      pitfalls: ['Assuming a retrieval query must be a typed search string.', 'Ignoring frequency bias and false negatives in in-batch training.', 'Claiming new features eliminate cold start automatically.'],
      checkpoint: { question: 'What can be used as the query representation for homepage recommendation retrieval?', options: ['Only the exact name of an app', 'Only a text string entered into a search bar', 'A permitted user/history/context representation'], correct: 2, explanations: ['That may describe a seed-based surface, but it is not the only retrieval context.', 'A homepage need not have typed text.', 'Correct. In retrieval, “query” can refer to the current user or context vector.'] }
    },
    {
      id: 'rec-hybrid-ranking', phase: 'Design the system', title: 'Hybrid recommendations, ranking, and final constraints', minutes: 8,
      subtitle: 'Combine evidence while keeping useful discovery as the goal.', bridge: [4, 6, 9, 25], sources: ['reranking'],
      blocks: [
        { title: 'Hybrid is a design choice, not one model', body: `A hybrid recommender can combine candidate sources, add content features to collaborative representations, blend scores, or use a learned ranker. State where the combination occurs and why the signals are complementary.

For example, a history-rich user's candidates may come mostly from collaborative retrieval, while new-app candidates use content evidence. A common ranker can compare user–app affinity, item metadata, context, source evidence, and time-safe behavioral aggregates.

A raw sum of cosine similarity and download counts mixes incompatible units. Use a validated feature-based model or a justified normalized combination. Keep candidate recall and final order as separate evaluation targets.` },
        { title: 'Ranking targets and multiple outcomes', body: `Logistic regression is a useful pointwise baseline for a defined interaction target. Boosted trees or neural models can add nonlinear interactions; ranking-aware losses can emphasize order. Choose a model because of data, quality gains, and serving constraints.

If predicting click probability and install-given-click, distinguish their denominators. Under the appropriate event relationship, install-per-impression can be expressed as click-per-impression times install-given-click. A click-conditioned model alone should not be evaluated as an unconditional conversion model.

Multi-task models can share representations across outcomes, but losses may compete. Compare task quality and calibration where probabilities are needed. Simple greedy maximization of a short-term outcome can favor familiar apps and ignore meaningful longer-term discovery.` },
        { title: 'Rerank with explicit rules and trade-offs', body: `First enforce hard eligibility and safety rules. Then consider soft objectives such as relevance, diversity, novelty, and freshness. Hard requirements should not silently become weights that a high score can overcome.

One illustrative diversity method selects items greedily using **λ×relevance − (1−λ)×maximumSimilarityToSelectedItems**. The scores and similarity scales need care; the greedy heuristic is not a proof of globally optimal utility. Evaluate the actual list and product outcome.

Do not assume diversification always helps. A related-app surface may need functional alternatives, while a broad homepage may need multiple interests. Page composition and module ordering require additional slate-level reasoning and are future deep-dive topics.` }
      ],
      prompt: 'Explain a hybrid recommender and how you would rank and rerank its candidates.',
      answer: `“I would state whether hybridization happens in retrieval, features, or scoring, then explain the complementary evidence. A ranker would predict a clearly defined useful outcome from permitted user–item and contextual signals. Final rules enforce eligibility, while diversity and freshness are tested as product trade-offs rather than assumed universally beneficial. I would compare list quality and online impact.”`,
      pitfalls: ['Calling a raw unnormalized score sum a principled hybrid.', 'Confusing conditional and per-impression outcome probabilities.', 'Trading away hard eligibility for a high relevance score.'],
      checkpoint: { question: 'Which is a hard constraint rather than a soft preference?', options: ['The app is unavailable for the user’s region or device', 'The app is slightly fresher', 'The app improves category diversity'], correct: 0, explanations: ['Correct. Ineligible inventory should not be promoted merely by a large relevance score.', 'Freshness is often a preference to evaluate, unless a specific policy makes it mandatory.', 'Diversity is normally a quality trade-off, not permission to serve an ineligible item.'] }
    },
    {
      id: 'rec-cold-start', phase: 'Design the system', title: 'Cold start, changing interests, and popularity loops', minutes: 8,
      subtitle: 'Handle sparse evidence without pretending to know a user’s preferences.', bridge: [9, 16, 25], sources: [],
      blocks: [
        { title: 'Separate new users, new items, and sparse contexts', body: `A new user lacks reliable preference history. A new app lacks reliable interaction evidence. A sparse locale or surface may have many users and apps but little applicable feedback. These need different fallbacks.

For new users, eligible contextual popularity and curated choices can provide a useful starting point. Optional explicit interests can help when the product permits them. For new apps, content and metadata representations can supply candidate and scoring paths. For sparse contexts, cautiously sharing representations may help, but evaluate transfer across locales.

Do not infer sensitive attributes simply to fill a sparse profile. State what signals are allowed. An opted-out user needs a functioning contextual or non-personalized path, not a hidden reconstruction of forbidden history.` },
        { title: 'Update interests without chasing every click', body: `Historical preferences can become stale. A recent interest in moving house may temporarily make planning utilities useful without meaning the person's long-term interests have changed. Use contextual and recency evidence with appropriate weighting and monitoring.

Compare short-term session signals with longer history where those signals are permitted. A single ambiguous interaction should not immediately overwrite everything. Multiple-interest profiles can preserve more than one preference, but add complexity and still need trustworthy feedback.

Also update app metadata, eligibility, item vectors, and popularity aggregates. A fresh model with a stale index is not a fresh recommender. A new app must enter relevant candidate sources before any downstream ranker can help it.` },
        { title: 'Treat exploration as controlled information gathering', body: `A system that only shows already-popular apps may never learn whether new apps are useful. This is a feedback loop. Exploration can provide evidence, but indiscriminate randomness can hurt user experience.

Start with a justified, quality-controlled exposure strategy and define how its outcomes will be logged and evaluated. Measure both usefulness and exposure distribution. Novelty is unfamiliarity; serendipity is useful unexpected discovery. Unfamiliar bad items do not satisfy that goal.

Contextual bandits and causal exploration policies are advanced follow-ups, not fully taught here. For fundamentals, be able to explain the trade-off, the logging-policy dependence, and why new-item exposure should be tested rather than guaranteed by a popularity boost.` }
      ],
      prompt: 'How would you recommend apps to a new user and support new apps without creating a popularity trap?',
      answer: `“I would separate user and item cold start. New users get an eligible contextual or curated baseline and optional permitted interests. New items use metadata and content-based representations while history develops. I would monitor source coverage and exposure, consider controlled quality-safe exploration, and evaluate whether the change improves useful discovery rather than exposure alone.”`,
      pitfalls: ['Calling every cold-start problem the same data issue.', 'Assuming randomly promoting new apps guarantees quality.', 'Reconstructing personal histories when a user opts out.'],
      checkpoint: { question: 'A new app is never retrieved because its popularity feature is zero. What should you address first?', options: ['Only the final ranker’s number of layers', 'Candidate eligibility and metadata-based retrieval paths', 'The user’s star-rating scale'], correct: 1, explanations: ['A larger ranker cannot promote an app absent from its input.', 'Correct. New items need a way into the candidate set before downstream scoring can help.', 'User rating scales do not explain this retrieval exclusion.'] }
    },
    {
      id: 'rec-evaluation', phase: 'Evaluate and explain', title: 'Evaluate relevance, discovery, and online impact', minutes: 9,
      subtitle: 'Know the benchmark assumptions before trusting a recommendation metric.', bridge: [2, 17, 25], sources: ['sampledMetrics', 'diversity'],
      blocks: [
        { title: 'Build a realistic future-interaction benchmark', body: `Use only prior history to make a recommendation at a defined time, then evaluate future outcomes in a stated window. A per-user last-event holdout does not automatically prevent global time leakage: later interactions from other users can still inform item features. Use global cutoffs when the claim requires them.

Define the eligible reference catalog and whether consumed items can be recommended. Keep requests and correlated user observations appropriately grouped. Compare models against the same candidates or explicitly separate retrieval and full-pipeline tests.

Future observed interactions are useful targets but not complete relevance judgments. Logs reflect the old exposure policy, and a useful unexposed app may remain unlabeled. Say what your evaluation can establish and what it cannot.` },
        { title: 'Top-K metrics and the sampling trap', body: `Recall@K can measure how many known useful future items appear in a recommendation list. NDCG emphasizes useful items near the top under a stated gain convention. Hit rate records at least one success; it equals recall only under particular single-positive setups. The Search module explains these formulas in more depth.

Ranking one positive against 99 sampled negatives is not the same as ranking the full eligible catalog. A model can look excellent against easy sampled negatives and fail to retrieve among millions of plausible apps. Sampling can even change relative model comparisons.

Evaluate against the intended inventory where practical. If you sample, disclose the sampling distribution, count, and limitation rather than label the result full-catalog quality. Use a retrieval benchmark appropriate to what the production candidate generator actually does.` },
        { title: 'Measure beyond matching historical behavior', body: `Track catalog coverage, exposure distribution, intra-list diversity, appropriate novelty, and quality slices such as new users, new apps, and locale. Define each metric: recommendation diversity is not the same as showing many different items across all users.

An online experiment should have a defined primary outcome, attribution window, randomization unit, and operational guardrails. Account for correlated user behavior and delayed outcomes. CTR is an intermediate signal; more taps can come from distracting or misleading suggestions.

Aggregate wins can hide cold-start harm. Segment deliberately and interpret uncertainty without cherry-picking favorable post-hoc slices. Fairness, discovery, and privacy constraints should influence both data and evaluation, not appear as a final sentence after the architecture.` }
      ],
      prompt: 'How would you evaluate a recommender offline and online, and why are sampled ranking metrics risky?',
      answer: `“I would simulate future requests with time-safe history and a stated eligible catalog, then evaluate retrieval coverage and top-K quality with cold-start and locale slices. Sampled negatives can distort apparent task difficulty and relative model rankings, so I would disclose or avoid that shortcut. I would also track coverage and diversity and run a planned online test on useful discovery with latency and quality guardrails.”`,
      pitfalls: ['Using future events in a recommendation profile.', 'Reporting sampled-negative results as full-catalog retrieval quality.', 'Calling a CTR increase proof of satisfaction or incremental impact.'],
      checkpoint: { question: 'A model ranks a positive above 99 easy random negatives. What does that prove?', options: ['It is best against the full catalog', 'Its measured performance on that sampled comparison task, not guaranteed full-catalog ranking quality', 'It will improve online conversion'], correct: 1, explanations: ['The full eligible catalog is a different and often harder comparison set.', 'Correct. The candidate and sampling protocol define the result; they can materially change model comparisons.', 'Offline sampled ranking does not establish a causal online improvement.'] }
    },
    {
      id: 'rec-playbook', phase: 'Evaluate and explain', title: 'Your recommendation design playbook', minutes: 7,
      subtitle: 'Turn the methods into a clear design and a defensible answer.', bridge: [25, 26, 28], sources: [],
      blocks: [
        { title: 'Use a structure that follows the evidence', body: `Use **Surface and goal → Feedback → Baseline → Candidates → Ranking → Evaluation → Serving and risks**. Clarify ambiguity, then state assumptions so the reviewer can correct them.

For an algorithm question, answer **definition → mechanism → small example → failure mode**. For a design question, explain what data exists and why the proposed method fits that data. For a debugging question, verify measurement, localize the failing stage or slice, and test a targeted hypothesis.

Name viable alternatives. “I would start with item neighbors for this related-app surface because they are cheap and interpretable; I would add content evidence for new items” demonstrates judgment more clearly than naming the most advanced model first.` },
        { title: 'Practice a short and a longer answer', body: `**30 seconds:** “I would clarify the app recommendation surface and useful outcome, establish an eligible contextual baseline, combine content and collaborative candidates where data supports them, and rank with time-safe signals. I would validate top-K quality, cold start, diversity, and online impact under privacy and latency constraints.”

**Two minutes:** Add explicit versus implicit feedback, the sampling assumptions, the model alternatives, candidate coverage, and the experimental outcome. Include one risk and the evidence needed to assess it.

**Ten minutes:** Discuss event schema, representation updates, request-time features, delayed labels, serving fallbacks, bias, and deployment checks. Do not invent Apple production counts or assert internal access. Hypothetical choices should remain labeled assumptions.` },
        { title: 'Know what is foundational and what comes later', body: `You should now be able to compare content and collaborative methods, explain neighborhood and factorization approaches, distinguish ALS from BPR, design complementary candidates, handle cold start, and question an evaluation protocol.

This module introduces ranking, diversity, multiple outcomes, and exploration but does not fully teach advanced sequence/transformer recommenders, generative recommenders, contextual bandits, uplift modeling, page/slate optimization, or evidence and messaging personalization. Those are later specialization topics.

The content-matching exercise is a transparent toy, not a trained production model. A practical next step is implementing an item-neighbor or factorization baseline on a safe public dataset with a time-based split. First use the cases below to rehearse reasoning without reading the solution.` }
      ],
      prompt: 'Give a two-minute plan for app recommendations. Include a model trade-off, a cold-start path, and an evaluation caveat.',
      answer: `“Assuming a discovery surface with permitted interaction logs, I would define useful outcomes and eligibility, then benchmark contextual popularity and item neighbors. I would add content candidates for new apps and collaborative or feature-based embeddings for supported users, then rank with request-time signals. ID factorization is efficient but needs history; metadata features broaden coverage but can misrepresent capabilities. I would use time-safe evaluation, disclose the candidate universe, inspect cold-start slices, and validate useful discovery online with quality and latency guardrails.”`,
      pitfalls: ['Listing algorithms without explaining which data supports each one.', 'Claiming the toy exercise is a complete recommender implementation.', 'Confusing predictive affinity with causal incremental benefit.'],
      checkpoint: { question: 'What is the best way to justify a recommendation model in a technical review?', options: ['Connect the surface, available evidence, baseline errors, constraints, and evaluation plan', 'Say it is newer than every alternative', 'Avoid discussing any failure modes'], correct: 0, explanations: ['Correct. A model choice is defensible when it follows from the problem and a testable improvement hypothesis.', 'Novelty alone does not establish usefulness or suitability.', 'Understanding failure modes is an important part of applied ML judgment.'] }
    }
  ],
  cases: [
  ]
};
