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
  ],
  cases: [
  ]
};
