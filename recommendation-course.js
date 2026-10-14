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
  ],
  cases: [
  ]
};
