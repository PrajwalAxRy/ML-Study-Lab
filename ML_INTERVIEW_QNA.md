# Machine Learning Interview Q&A Revision Guide

This question bank follows the recommended interview-preparation order: classical machine learning first, then data and model improvement, unsupervised learning, supporting mathematics, deep learning, and final interview preparation.

Answers are intentionally concise. In an interview, start with the direct answer, then add intuition, assumptions, trade-offs, and an example if the interviewer asks for more depth.

## Contents

1. [Machine Learning Fundamentals](#1-machine-learning-fundamentals)
2. [Model Evaluation and Validation](#2-model-evaluation-and-validation)
3. [Linear Regression](#3-linear-regression)
4. [Logistic Regression](#4-logistic-regression)
5. [Decision Trees](#5-decision-trees)
6. [Ensemble Methods](#6-ensemble-methods)
7. [KNN, Naive Bayes, and SVM](#7-knn-naive-bayes-and-svm)
8. [Data Preprocessing](#8-data-preprocessing)
9. [Feature Engineering and Selection](#9-feature-engineering-and-selection)
10. [Handling Imbalanced Datasets](#10-handling-imbalanced-datasets)
11. [Hyperparameter Tuning](#11-hyperparameter-tuning)
12. [Model Interpretability](#12-model-interpretability)
13. [Clustering](#13-clustering)
14. [Dimensionality Reduction](#14-dimensionality-reduction)
15. [Anomaly Detection](#15-anomaly-detection)
16. [Probability](#16-probability)
17. [Statistics](#17-statistics)
18. [Linear Algebra](#18-linear-algebra)
19. [Calculus and Optimization](#19-calculus-and-optimization)
20. [Neural-Network Fundamentals](#20-neural-network-fundamentals)
21. [Training Neural Networks](#21-training-neural-networks)
22. [Convolutional Neural Networks](#22-convolutional-neural-networks)
23. [RNNs, LSTMs, and GRUs](#23-rnns-lstms-and-grus)
24. [Attention and Transformers](#24-attention-and-transformers)
25. [End-to-End ML Case Studies](#25-end-to-end-ml-case-studies)
26. [Discussing Your ML Projects](#26-discussing-your-ml-projects)
27. [ML Coding and Implementation](#27-ml-coding-and-implementation)
28. [Behavioral and Project-Based Questions](#28-behavioral-and-project-based-questions)

---

# Priority 1: Core Machine Learning

## 1. Machine Learning Fundamentals

### Q1. What is machine learning?

Machine learning is the process of learning patterns from data to make predictions or decisions without writing a separate explicit rule for every case. A model learns parameters by minimizing an objective on training data and is expected to generalize to unseen data.

### Q2. What are supervised, unsupervised, semi-supervised, and reinforcement learning?

- **Supervised learning:** learns from labeled input-output pairs, such as fraud classification.
- **Unsupervised learning:** finds structure in unlabeled data, such as customer clustering.
- **Semi-supervised learning:** combines a small labeled set with a larger unlabeled set.
- **Reinforcement learning:** an agent learns actions through rewards received from an environment.

### Q3. What is the difference between classification and regression?

Classification predicts a discrete class or class probability; regression predicts a continuous numerical value. Logistic regression is a classifier despite its name because it models class probability.

### Q4. What are parameters and hyperparameters?

Parameters are learned from data, such as regression coefficients or neural-network weights. Hyperparameters are set or tuned outside model fitting, such as tree depth, regularization strength, or learning rate.

### Q5. What are training, validation, and test sets?

- The **training set** fits model parameters.
- The **validation set** selects models, thresholds, and hyperparameters.
- The **test set** estimates final performance on unseen data and should not influence development decisions.

### Q6. What is overfitting?

Overfitting occurs when a model learns training-specific noise and performs much better on training data than unseen data. Common remedies include more data, simpler models, regularization, cross-validation, early stopping, pruning, and data augmentation.

### Q7. What is underfitting?

Underfitting occurs when a model is too simple or insufficiently trained to capture the relevant pattern. Both training and validation performance are poor. Remedies include adding useful features, increasing model capacity, reducing excessive regularization, or training longer.

### Q8. Explain the bias-variance trade-off.

Bias is error caused by restrictive assumptions; variance is sensitivity to the particular training sample. Simple models tend to have high bias and low variance, while very flexible models tend to have low bias and high variance. Good generalization balances the two.

### Q9. What is generalization?

Generalization is a model's ability to perform well on new data drawn from the target population. It is estimated using properly separated validation or test data rather than training performance.

### Q10. What is the difference between parametric and non-parametric models?

Parametric models assume a fixed-form function with a fixed number of parameters, such as linear regression. Non-parametric models can increase their effective complexity with the data, such as KNN or decision trees. Non-parametric does not mean that the model has no parameters.

### Q11. What is the difference between generative and discriminative models?

Generative models learn the data distribution, often \(P(X,Y)\) or \(P(X\mid Y)P(Y)\), and can potentially generate data. Discriminative models learn \(P(Y\mid X)\) or a direct decision boundary. Naive Bayes is generative; logistic regression is discriminative.

### Q12. What is data leakage?

Data leakage occurs when training uses information that would not be available at prediction time or that improperly comes from validation/test data. Examples include fitting a scaler before splitting, using future data, or including a feature created after the target event.

### Q13. What is the difference between data leakage and overfitting?

Overfitting learns real training inputs too specifically; leakage gives the model illegitimate information. Both produce overly optimistic validation results, but leakage invalidates the evaluation process itself.

### Q14. What is the curse of dimensionality?

As dimensions increase, data becomes sparse and distances become less informative. Models often require much more data, and distance-based methods such as KNN can degrade. Feature selection, dimensionality reduction, regularization, and domain knowledge can help.

### Q15. What assumptions underlie ordinary supervised learning?

Typical assumptions are that examples are drawn from a sufficiently stable distribution, labels represent the desired target, training data is representative of deployment data, and the evaluation data is independent of training. Violations lead to selection bias, distribution shift, or misleading results.

### Q16. What is distribution shift?

Distribution shift means the deployment distribution differs from training. Covariate shift changes \(P(X)\), label shift changes \(P(Y)\), and concept drift changes \(P(Y\mid X)\). Detection and response may require monitoring, reweighting, retraining, or redesigning features.

### Q17. What is the No Free Lunch theorem in ML?

No single learning algorithm is best for every possible problem. Model choice should depend on the data, assumptions, constraints, evaluation metric, and deployment requirements.

---

## 2. Model Evaluation and Validation

### Q1. What is a confusion matrix?

For binary classification, it contains true positives, false positives, true negatives, and false negatives. Most classification metrics are derived from these four counts.

### Q2. Define accuracy, precision, recall, specificity, and F1-score.

- **Accuracy:** \((TP+TN)/(TP+TN+FP+FN)\)
- **Precision:** \(TP/(TP+FP)\); among predicted positives, how many were correct.
- **Recall/sensitivity:** \(TP/(TP+FN)\); among actual positives, how many were found.
- **Specificity:** \(TN/(TN+FP)\); among actual negatives, how many were rejected.
- **F1:** harmonic mean of precision and recall, \(2PR/(P+R)\).

### Q3. When is accuracy misleading?

Accuracy is misleading when classes are highly imbalanced or error costs differ. A model predicting every case as the majority class can have high accuracy but zero value for detecting the minority class.

### Q4. When should you prioritize precision or recall?

Prioritize precision when false positives are expensive, such as incorrectly blocking legitimate transactions. Prioritize recall when false negatives are expensive, such as missing a serious disease or fraud case.

### Q5. What is an ROC curve and ROC-AUC?

The ROC curve plots true-positive rate against false-positive rate over all thresholds. ROC-AUC is the probability that a randomly chosen positive receives a higher score than a randomly chosen negative. It measures ranking, not probability calibration.

### Q6. What is a Precision-Recall curve, and when is it preferable?

It plots precision against recall across thresholds. PR-AUC is usually more informative for rare positive classes because it focuses on positive-class performance and does not receive apparent credit from a large number of true negatives.

### Q7. What is the difference between ROC-AUC and PR-AUC?

ROC-AUC considers both classes through TPR and FPR and can look optimistic under severe imbalance. PR-AUC focuses on positive predictions and is more sensitive to minority-class performance. The appropriate choice depends on the business objective.

### Q8. How do you select a classification threshold?

Choose it on validation data using business costs or constraints—for example, maximize expected value, maximize F1, achieve at least 95% recall, or limit false positives. Do not tune the threshold on the test set.

### Q9. What is probability calibration?

A classifier is calibrated when predictions near 0.7 are positive approximately 70% of the time. Calibration can be assessed with reliability diagrams, Brier score, or log loss and improved with Platt scaling or isotonic regression using held-out data.

### Q10. What are common regression metrics?

- **MAE:** mean absolute error; robust relative to squared losses and easy to interpret.
- **MSE:** mean squared error; heavily penalizes large errors.
- **RMSE:** square root of MSE; in target units.
- **\(R^2\):** fraction of variance explained relative to predicting the target mean.
- **MAPE:** average percentage error, but unstable near zero and unsuitable for negative targets.

### Q11. Can \(R^2\) be negative?

Yes. On evaluation data, a model can perform worse than predicting the evaluation target mean, resulting in negative \(R^2\). Training-set \(R^2\) with an intercept is normally non-negative.

### Q12. How do you choose between MAE and RMSE?

Use MAE when errors should grow roughly linearly or robustness to outliers matters. Use RMSE when large errors deserve substantially more penalty and the squared-error assumption matches the business cost.

### Q13. What is cross-validation?

Cross-validation repeatedly trains on subsets and validates on the remaining subset, then aggregates performance. K-fold cross-validation gives a more stable estimate than a single split and helps with model selection.

### Q14. What is stratified cross-validation?

It preserves approximately the same class proportions in each fold. It is especially useful for classification with imbalanced classes.

### Q15. How should time-series data be validated?

Use chronological splits or rolling/expanding-window validation so training observations always precede validation observations. Random splitting can leak future patterns into the past.

### Q16. How should grouped data be validated?

Use group-aware splitting so all observations from the same entity—such as a patient, customer, or device—belong to only one fold. Otherwise entity-specific information can leak across folds.

### Q17. What is nested cross-validation?

The inner loop tunes hyperparameters, while the outer loop estimates generalization. It prevents the optimistic bias that occurs when the same cross-validation results are used both to select and report a model.

### Q18. What are micro, macro, and weighted averages in multiclass evaluation?

- **Micro:** pools all class decisions, favoring common classes.
- **Macro:** averages each class equally, exposing minority-class performance.
- **Weighted:** averages per-class metrics weighted by class frequency.

### Q19. What is log loss?

Log loss, or cross-entropy, evaluates predicted probabilities and strongly penalizes confident incorrect predictions. Unlike accuracy, it distinguishes between correct predictions made with different confidence levels.

### Q20. What is the difference between offline and online evaluation?

Offline evaluation uses historical held-out data and is fast and reproducible. Online evaluation measures real user or system outcomes through experiments such as A/B tests. Offline gains do not always translate into online gains because user behavior and feedback loops may differ.

---

## 3. Linear Regression

### Q1. What does linear regression model?

It models the conditional mean of a continuous target as a linear combination of features: \(\hat y=\beta_0+\beta_1x_1+\cdots+\beta_px_p\). Linear refers to linearity in the coefficients, not necessarily in the raw input variables.

### Q2. How are ordinary least-squares coefficients estimated?

They minimize the sum of squared residuals. When \(X^TX\) is invertible, the closed-form solution is \(\hat\beta=(X^TX)^{-1}X^Ty\); numerical implementations usually use QR decomposition or SVD for stability.

### Q3. What are the main assumptions of linear regression?

Linearity of the conditional mean, independent errors, constant error variance, and no perfect multicollinearity. Normally distributed residuals are needed for exact small-sample confidence intervals and tests, not for fitting coefficients itself.

### Q4. What is a residual?

A residual is the observed value minus the fitted value: \(e_i=y_i-\hat y_i\). Residual plots help reveal nonlinearity, heteroscedasticity, outliers, and dependence.

### Q5. What is multicollinearity?

It occurs when predictors are strongly linearly related. Predictions may remain useful, but individual coefficients become unstable and have large standard errors. Remedies include removing or combining variables, regularization, PCA, or collecting more data.

### Q6. What is heteroscedasticity?

Heteroscedasticity means residual variance changes with the feature values or fitted value. Coefficient estimates can remain unbiased under standard exogeneity assumptions, but ordinary standard errors become unreliable. Robust standard errors, transformations, or weighted least squares may help.

### Q7. What is the difference between correlation and a regression coefficient?

Correlation is symmetric and standardized, measuring linear association between two variables. A regression coefficient is directional, scale-dependent, and represents the expected target change per unit feature change while holding other included variables constant.

### Q8. What is Ridge regression?

Ridge adds an L2 penalty, \(\lambda\sum_j\beta_j^2\). It shrinks coefficients, reduces variance, handles correlated features well, and usually retains all features.

### Q9. What is Lasso regression?

Lasso adds an L1 penalty, \(\lambda\sum_j|\beta_j|\). It can shrink some coefficients exactly to zero, providing sparse feature selection, but may select unpredictably among highly correlated features.

### Q10. What is Elastic Net?

Elastic Net combines L1 and L2 penalties. It can produce sparsity while behaving more stably than Lasso when predictors are correlated.

### Q11. Why should features be scaled before regularized linear regression?

Without scaling, the penalty affects coefficients differently because feature units differ. Standardization makes the strength of regularization more comparable across features. The intercept is typically not penalized.

### Q12. What happens as regularization strength increases?

Coefficient magnitudes shrink, model variance generally decreases, and bias increases. Excessive regularization causes underfitting. The strength should be selected with validation data.

### Q13. How do polynomial features relate to linear regression?

A linear model can fit nonlinear relationships by treating transformed terms such as \(x^2\) and \(x_1x_2\) as input features. The model remains linear in its learned coefficients.

### Q14. How do you interpret a coefficient for a categorical variable?

With one-hot encoding and a reference category, the coefficient is the expected difference from the reference category while holding other features constant. Dummy-variable encoding must avoid perfect redundancy when an intercept is present.

### Q15. How are influential observations detected?

Residuals identify unusual targets, leverage identifies unusual feature values, and Cook's distance combines both to estimate influence on the fitted model. Such observations should be investigated, not automatically deleted.

---

## 4. Logistic Regression

### Q1. What does logistic regression model?

It models the log-odds of a binary outcome as a linear function: \(\log(p/(1-p))=\beta_0+\beta^Tx\). Applying the sigmoid converts the linear score into a probability between zero and one.

### Q2. Why not use linear regression for binary classification?

Linear regression can predict values outside \([0,1]\), assumes inappropriate constant-variance errors, and does not model Bernoulli likelihood. Logistic regression provides bounded probabilities and a suitable probabilistic objective.

### Q3. What is the sigmoid function?

\(\sigma(z)=1/(1+e^{-z})\). It maps any real-valued score to \((0,1)\), allowing the result to be interpreted as a probability under the model.

### Q4. What is an odds ratio?

For a one-unit increase in feature \(x_j\), holding other variables constant, the odds are multiplied by \(e^{\beta_j}\). A coefficient is not a direct change in probability because the probability change depends on the starting probability.

### Q5. What loss does logistic regression use?

It minimizes binary cross-entropy, equivalent to maximizing Bernoulli likelihood: \(-[y\log p+(1-y)\log(1-p)]\). Confident incorrect predictions receive a large penalty.

### Q6. Is logistic regression a linear classifier?

Yes, in its original feature space it produces a linear decision boundary \(\beta_0+\beta^Tx=c\). Nonlinear boundaries can be created through feature transformations or kernels in other models.

### Q7. How is regularization used in logistic regression?

L2 regularization shrinks coefficients smoothly, while L1 can produce sparse coefficients. Regularization controls variance, helps with multicollinearity, and requires feature scaling for comparable penalties.

### Q8. How does logistic regression handle multiclass classification?

One-vs-rest trains one binary classifier per class. Multinomial or softmax regression jointly models all classes with probabilities that sum to one. The approach should match whether classes are mutually exclusive.

### Q9. What is complete separation?

Complete separation occurs when a feature combination perfectly separates classes, causing unregularized maximum-likelihood coefficients to grow without a finite solution. Regularization or specialized estimators resolve it.

### Q10. What assumptions does logistic regression make?

It assumes independent observations, limited multicollinearity, correct specification, and a linear relationship between continuous predictors and log-odds. It does not require features or residuals to be normally distributed.

### Q11. How do class weights affect logistic regression?

They increase the loss contribution of selected classes, shifting the fitted boundary toward better performance on the more heavily weighted class. They do not create new information and still require threshold and metric selection.

### Q12. Can logistic regression be well ranked but poorly calibrated?

Yes. Ranking and calibration are different properties. A model can order cases correctly, producing good AUC, while its predicted probabilities are systematically too high or low.

---

## 5. Decision Trees

### Q1. How does a decision tree work?

It recursively splits the feature space into regions using rules that improve target purity. A leaf predicts the majority class, class distribution, or an aggregate such as the mean for regression.

### Q2. What are entropy and Gini impurity?

For class probabilities \(p_k\), entropy is \(-\sum_k p_k\log p_k\), and Gini impurity is \(1-\sum_kp_k^2\). Both are zero for a pure node and are used to select impurity-reducing splits.

### Q3. What is information gain?

Information gain is the parent impurity minus the weighted impurity of the children. The split with the greatest reduction is preferred by a greedy tree-building procedure.

### Q4. How are regression-tree splits selected?

They commonly minimize the weighted squared error or variance within child nodes. Leaves usually predict the average training target in that region; absolute-error variants may predict medians.

### Q5. Why do trees overfit?

Unrestricted trees can keep splitting until leaves describe very few observations, capturing noise. Depth limits, minimum leaf size, minimum impurity decrease, pruning, or ensembles can reduce overfitting.

### Q6. What is tree pruning?

Pre-pruning restricts growth using rules such as maximum depth. Post-pruning first grows a larger tree and removes branches whose complexity is not justified, often through cost-complexity pruning selected by validation.

### Q7. What are the main advantages of decision trees?

They capture nonlinearities and interactions, require little scaling, handle mixed feature behavior, and are easy to visualize when shallow. They also make few distributional assumptions.

### Q8. What are the main limitations of decision trees?

They are unstable, can overfit, create axis-aligned piecewise-constant predictions, and often generalize worse than ensembles. Small data changes can create a very different tree.

### Q9. Do decision trees require feature scaling?

Usually no. Splits depend on ordering and thresholds, so monotonic rescaling does not alter the available partitions. Scaling may still matter elsewhere in a combined pipeline.

### Q10. How do trees handle missing values?

Implementation-dependent methods include imputation, assigning missing values to a learned branch, surrogate splits, or treating missing as a category. The handling must be learned only from training data.

### Q11. Why can high-cardinality features be problematic?

Features with many possible split points or categories have more chances to produce accidental impurity reductions. Regularization, target-encoding safeguards, category grouping, and unbiased split methods can reduce this bias.

### Q12. What is cost-complexity pruning?

It balances training error against the number of leaves using an objective such as \(R(T)+\alpha|T|\). Increasing \(\alpha\) favors smaller trees.

### Q13. How is tree feature importance computed, and what is its limitation?

Impurity-based importance sums the weighted impurity reductions attributable to each feature. It can favor continuous or high-cardinality features and split importance among correlated features; permutation importance is often a useful complement.

---

## 6. Ensemble Methods

### Q1. Why do ensembles often outperform individual models?

Combining models can cancel uncorrelated errors and produce a better bias-variance trade-off. Diversity among component models is important; identical models making identical errors offer little gain.

### Q2. What is bagging?

Bagging trains models independently on bootstrap samples and aggregates their predictions. It mainly reduces variance and works especially well with unstable learners such as decision trees.

### Q3. What is a bootstrap sample?

It is a sample of the original dataset drawn with replacement, usually with the same number of rows. It contains about 63.2% unique original examples on average; the remaining examples are out-of-bag for that model.

### Q4. How does a Random Forest differ from bagged trees?

Random Forest adds random feature subsampling at each split. This decorrelates trees, making aggregation reduce variance more effectively.

### Q5. What is out-of-bag evaluation?

Each tree can be evaluated on training examples excluded from its bootstrap sample. Aggregating these predictions provides an internal performance estimate without a separate validation set, although a final independent test is still valuable.

### Q6. What is boosting?

Boosting builds weak learners sequentially so later learners focus on errors made by the current ensemble. It can reduce bias and create a strong nonlinear model but may be sensitive to noise and tuning.

### Q7. How does AdaBoost work?

AdaBoost increases the weight of misclassified observations and assigns each weak learner a vote based on its accuracy. It often uses shallow decision stumps. Outliers can receive excessive weight.

### Q8. How does gradient boosting work?

It adds a new weak learner that approximates the negative gradient of the current loss. For squared error, this resembles fitting residuals; the gradient formulation generalizes to other differentiable losses.

### Q9. What does the learning rate do in gradient boosting?

It shrinks each new tree's contribution. A smaller learning rate generally requires more trees and can improve generalization, at the cost of training and inference time.

### Q10. What are the important gradient-boosting hyperparameters?

Number of estimators, learning rate, tree depth or leaf count, minimum child size, row and feature subsampling, and regularization. Depth controls interaction complexity; learning rate and tree count should be tuned together.

### Q11. What is the difference between Random Forest and gradient boosting?

Random Forest trains deep-ish trees independently and averages them, primarily reducing variance. Gradient boosting trains usually shallow trees sequentially, primarily correcting errors and reducing bias. Forests are easier to parallelize and often less sensitive to tuning.

### Q12. What distinguishes XGBoost?

XGBoost provides regularized gradient boosting with second-order loss information, shrinkage, row/column sampling, missing-value handling, and highly optimized training. Exact behavior depends on configuration and tree method.

### Q13. What distinguishes LightGBM?

LightGBM uses histogram-based splits and commonly grows trees leaf-wise, selecting the leaf with greatest loss reduction. It is fast on large datasets but leaf-wise growth can overfit small datasets without constraints.

### Q14. What distinguishes CatBoost?

CatBoost is designed to handle categorical features with ordered target statistics and ordered boosting, reducing target leakage and prediction shift. It is often strong when raw categorical variables are important.

### Q15. What are voting, stacking, and blending?

- **Voting:** averages probabilities or class votes from models.
- **Stacking:** trains a meta-model on out-of-fold base-model predictions.
- **Blending:** trains a meta-model using predictions on a fixed holdout set.

### Q16. Why must stacking use out-of-fold predictions?

Training the meta-model on base-model predictions for examples those base models already fitted causes leakage and overfitting. Out-of-fold predictions imitate unseen-data behavior.

### Q17. When might a simpler model be preferable to an ensemble?

When interpretability, latency, memory, ease of maintenance, calibration, or limited data matters more than a small predictive gain. A simpler model also provides a valuable baseline.

---

## 7. KNN, Naive Bayes, and SVM

### Q1. How does K-Nearest Neighbors work?

KNN stores the training data and predicts using the labels or targets of the closest \(k\) examples. Classification uses a vote or weighted vote; regression uses an average or weighted average.

### Q2. How does the choice of \(k\) affect KNN?

Small \(k\) gives low bias and high variance and is sensitive to noise. Large \(k\) smooths the boundary, increasing bias and reducing variance. Select \(k\) with validation.

### Q3. Why is feature scaling important for KNN?

Distance determines neighbors. A feature with a large numerical scale can dominate the distance even when it is not more informative. Scaling should be fitted on training data only.

### Q4. What distance metrics can KNN use?

Euclidean distance is common for continuous features; Manhattan distance can be more robust in some high-dimensional settings. Cosine distance is useful when direction matters more than magnitude. The metric should reflect feature meaning.

### Q5. What are KNN's main limitations?

Prediction is expensive, memory use is high, irrelevant features hurt, scaling is essential, and performance degrades in high dimensions. Approximate nearest-neighbor indexes can accelerate retrieval.

### Q6. What is Bayes' theorem?

\(P(Y\mid X)=P(X\mid Y)P(Y)/P(X)\). It updates a prior belief about \(Y\) using the likelihood of observed evidence \(X\).

### Q7. What makes Naive Bayes “naive”?

It assumes features are conditionally independent given the class: \(P(X\mid Y)=\prod_jP(X_j\mid Y)\). This is often false, yet the classifier can work well because accurate probability estimation is not always necessary for a correct class ranking.

### Q8. What are common Naive Bayes variants?

Gaussian Naive Bayes models continuous features with class-specific Gaussians. Multinomial Naive Bayes models counts such as word frequencies. Bernoulli Naive Bayes models binary feature presence.

### Q9. What is Laplace smoothing?

It adds pseudo-counts so unseen feature-class combinations do not receive zero probability. Without smoothing, one unseen term can make the entire product probability zero.

### Q10. What is the core idea of an SVM?

An SVM finds a separating hyperplane with the largest margin between classes. The closest training points—support vectors—determine the boundary.

### Q11. What are hard-margin and soft-margin SVMs?

Hard margin requires perfect separation and is sensitive to noise. Soft margin allows violations using slack variables. Hyperparameter \(C\) controls the trade-off between a wide margin and training errors.

### Q12. How does \(C\) affect an SVM?

Large \(C\) penalizes violations strongly, often creating a tighter boundary with lower training bias and higher variance. Small \(C\) tolerates more violations for a wider, more regularized margin.

### Q13. What is the kernel trick?

A kernel computes inner products in an implicit high-dimensional feature space without explicitly constructing that space. This allows nonlinear boundaries while retaining the SVM optimization framework.

### Q14. What do \(C\) and \(\gamma\) do in an RBF SVM?

\(C\) controls the penalty for training errors. \(\gamma\) controls how local each example's influence is: large \(\gamma\) can create highly complex boundaries; small \(\gamma\) produces smoother boundaries.

### Q15. Why does an SVM need feature scaling?

The margin and kernels depend on dot products or distances. Unscaled features can dominate both the optimization and similarity calculation.

### Q16. When would you choose KNN, Naive Bayes, or SVM?

KNN is a simple local baseline for moderate low-dimensional data. Naive Bayes is fast and effective for high-dimensional sparse data such as text. SVMs are strong for small-to-medium datasets with clear margins but can be costly on very large datasets.

---

# Priority 2: Data and Model Improvement

## 8. Data Preprocessing

### Q1. What should be checked before modeling?

Confirm the target definition, unit of observation, feature availability time, schema and types, duplicates, missingness, label quality, class balance, ranges, outliers, and train-serving consistency. Also identify groups or timestamps needed for splitting.

### Q2. How should missing values be handled?

Options include dropping rows/columns, simple imputation, group-based imputation, predictive imputation, or models with native missing handling. The choice depends on the amount, mechanism, and meaning of missingness, and must be learned on training data.

### Q3. What are MCAR, MAR, and MNAR?

- **MCAR:** missingness is unrelated to observed or missing values.
- **MAR:** missingness depends on observed variables.
- **MNAR:** missingness depends on the missing value itself or unobserved factors.

The mechanism affects whether simple imputation is unbiased.

### Q4. Why add a missing-value indicator?

Missingness itself may carry predictive information—for example, a test was not ordered. An indicator lets the model distinguish an imputed value from a genuinely observed value, but it can also encode operational bias that should be examined.

### Q5. How can outliers be detected?

Use domain rules, visualizations, z-scores, IQR rules, robust statistics, isolation methods, and residual analysis. Detection is not the same as removal; first determine whether the point is an error, rare valid case, or important tail event.

### Q6. How can outliers be handled?

Correct data errors, cap/winsorize, transform, use robust scaling or robust losses, segment the population, or use a model less sensitive to extremes. Deletion requires a defensible reason.

### Q7. What is standardization?

Standardization transforms a feature to roughly zero mean and unit variance: \((x-\mu)/\sigma\). It is useful for distance-based models, SVMs, PCA, regularized linear models, and neural networks.

### Q8. What is min-max normalization?

It maps values to a fixed range, commonly \([0,1]\). It preserves ordering but is sensitive to extreme minimum and maximum values.

### Q9. Which models generally require scaling?

KNN, K-means, SVMs, PCA, neural networks, and regularized linear/logistic regression usually benefit. Decision trees and tree ensembles are generally invariant to monotonic feature scaling.

### Q10. How should categorical variables be encoded?

Use one-hot encoding for low-cardinality nominal variables, ordinal encoding only when order is real, hashing for very high cardinality, or carefully cross-fitted target encoding. Native categorical algorithms can avoid manual encoding.

### Q11. What is the dummy-variable trap?

With an intercept, including every one-hot category creates exact linear dependence because category indicators sum to one. Drop one reference category or use a model/regularization that handles the redundancy deliberately.

### Q12. Why is naive target encoding dangerous?

Encoding a category with its target mean using the same rows leaks target information, especially for rare categories. Use smoothing and out-of-fold encoding for training rows, then fit the mapping on full training data for validation/test transformation.

### Q13. How should unseen categories be handled?

The preprocessing pipeline should map them to an unknown category, ignore them safely in one-hot encoding, use hashing, or rely on a model with explicit unknown handling. The behavior must be defined before deployment.

### Q14. How should duplicates be handled?

First define what constitutes a duplicate at the unit-of-observation level. Exact or near duplicates can overweight examples and leak across splits. Remove only unintended duplicates; repeated legitimate events may be meaningful.

### Q15. When are log or power transformations useful?

They can reduce right skew, stabilize variance, make multiplicative relationships more linear, and reduce the influence of large values. Log transforms require a plan for zeros and negative values.

### Q16. Why use a preprocessing pipeline?

A pipeline ensures the same learned transformations are applied during training, validation, testing, and inference. It prevents leakage, makes cross-validation correct, and improves reproducibility.

### Q17. What is train-serving skew?

It occurs when features or preprocessing differ between training and production. Shared transformation code, feature definitions, schema checks, and monitoring help prevent it.

### Q18. Should preprocessing happen before or after splitting?

Split first. Any operation that learns from data—including imputation, scaling, feature selection, oversampling, and target encoding—must be fitted only on the training portion of each split or cross-validation fold.

---

## 9. Feature Engineering and Selection

### Q1. What is feature engineering?

Feature engineering converts raw data into representations that expose useful signal to a model. Good features reflect domain mechanisms while remaining available, stable, and inexpensive enough at inference time.

### Q2. What are common feature-engineering techniques?

Aggregations, ratios, differences, counts, time-since-event, cyclical time encoding, interactions, polynomial terms, logarithms, bins, text statistics, lag features, and rolling summaries.

### Q3. How should cyclical variables be represented?

Encode values such as hour or month with sine and cosine: \(\sin(2\pi x/T)\) and \(\cos(2\pi x/T)\). This makes the end and beginning of the cycle close together.

### Q4. What are interaction features?

They represent joint effects that are not captured by adding individual feature effects. For example, income divided by household size or \(x_1x_2\) in a linear model. Flexible tree and neural models may learn interactions automatically, though explicit features can still help.

### Q5. What is feature selection, and why use it?

Feature selection keeps a useful subset to reduce noise, overfitting, computation, collection cost, and interpretation burden. It differs from dimensionality reduction, which creates new combined features.

### Q6. What are filter methods?

They rank features independently of a final model using statistics such as correlation, mutual information, chi-square, or ANOVA. They are fast but can miss interactions and must be applied inside validation folds.

### Q7. What are wrapper methods?

They evaluate feature subsets using model performance, such as recursive feature elimination or forward selection. They can capture model-specific interactions but are computationally expensive and prone to selection overfitting.

### Q8. What are embedded methods?

Selection occurs during model fitting, such as L1 regularization or tree-based split selection. They are more efficient than wrappers but inherit the model's biases.

### Q9. What is mutual information?

Mutual information measures dependence by how much knowing one variable reduces uncertainty about another. It can detect nonlinear dependence but requires estimation and does not imply causality.

### Q10. How should time-series features be created safely?

Lags, rolling statistics, and aggregates must use only information available before the prediction timestamp. Correct cutoff logic and chronological validation are essential to prevent future leakage.

### Q11. How do correlated features affect models?

They can destabilize linear coefficients and dilute individual feature importance while leaving predictions acceptable. Regularization, grouping, removing redundancy, or dimensionality reduction can help.

### Q12. How do you decide whether a feature is production-ready?

Check predictive value, availability at prediction time, latency, computation and storage cost, freshness, stability, privacy, fairness, ownership, failure modes, and whether training and serving definitions match.

### Q13. Can feature selection cause leakage?

Yes. Selecting features using the complete dataset transfers validation/test target information into training. Selection must occur independently inside each training fold.

### Q14. How do you evaluate a new feature?

Use an ablation study with a fixed split and pipeline, compare uncertainty across folds or repeated runs, inspect subgroup effects and leakage risk, and consider serving cost—not just a single metric improvement.

---

## 10. Handling Imbalanced Datasets

### Q1. What is class imbalance?

Class imbalance occurs when one class is much rarer than another. It is a problem when the minority class matters and the model or metric is dominated by the majority, not merely because proportions are unequal.

### Q2. Which metrics are suitable for imbalanced classification?

Precision, recall, F1 or \(F_\beta\), PR-AUC, per-class confusion metrics, balanced accuracy, and cost-weighted utility. Always connect the metric to the actual false-positive and false-negative costs.

### Q3. What is balanced accuracy?

For binary classification, it is the average of sensitivity and specificity. It gives equal weight to both classes regardless of their frequencies.

### Q4. What is random oversampling?

It duplicates minority examples. It is simple and preserves minority observations but can increase overfitting and training cost.

### Q5. What is random undersampling?

It removes majority examples. It speeds training and changes class balance but may discard useful information, especially when data is limited.

### Q6. What is SMOTE?

SMOTE creates synthetic minority points by interpolating between neighboring minority examples. It can improve coverage but may generate unrealistic or ambiguous samples and should be applied only within training folds.

### Q7. How do class weights work?

They assign larger loss to mistakes on the minority or costly class. This changes model fitting without duplicating data. The resulting probabilities may need recalibration.

### Q8. Is resampling always necessary?

No. Strong models may rank examples well without it, and threshold selection may meet business needs. Compare resampling, weighting, suitable losses, and thresholds using an appropriate validation metric.

### Q9. How should train and test distributions be handled?

Resample only training data. Validation and test sets should reflect the expected deployment distribution so reported precision, calibration, and workload are realistic.

### Q10. What is focal loss?

Focal loss downweights easy examples and focuses training on hard, misclassified examples. It is common in dense detection and heavily imbalanced tasks, with parameters controlling class weight and focusing strength.

### Q11. How can rare-event probabilities be calibrated after resampling?

Evaluate and recalibrate on data with the natural class prevalence, or mathematically adjust for the sampling scheme. Ranking may remain good while raw probabilities become biased by altered prevalence.

---

## 11. Hyperparameter Tuning

### Q1. What is hyperparameter tuning?

It searches settings that are not learned directly by the fitting objective, such as depth, regularization, or learning rate. Selection must use validation data, not the final test set.

### Q2. How does grid search work?

It evaluates every combination in a predefined grid. It is simple and parallelizable but becomes expensive in high dimensions and wastes trials on unimportant parameters.

### Q3. Why can random search outperform grid search?

When only a few hyperparameters matter, random search explores more distinct values of those important dimensions for the same trial budget. It also handles continuous distributions naturally.

### Q4. What is Bayesian optimization?

It builds a surrogate model of performance and chooses new trials using an acquisition function that balances exploration and exploitation. It is useful when each training run is expensive.

### Q5. What are successive halving and Hyperband?

They allocate small resources to many configurations and progressively keep promising ones. Hyperband considers multiple resource-allocation schedules, often reducing tuning cost.

### Q6. What is early stopping?

Training stops when validation performance fails to improve for a chosen patience period. It saves compute and acts as regularization. The best validation checkpoint, rather than the final one, should be restored.

### Q7. Why should preprocessing be included in the tuning pipeline?

Each fold must independently fit imputers, scalers, encoders, selectors, and samplers. Precomputing them on all data leaks information and creates optimistic validation scores.

### Q8. What is overfitting to the validation set?

Repeatedly selecting among many experiments can adapt decisions to validation noise. Use nested cross-validation, a fresh holdout, fewer degrees of freedom, or confirmation experiments to obtain an honest estimate.

### Q9. On what scale should parameters be searched?

Positive magnitude parameters such as learning rate, regularization, or \(C\) are usually searched on a log scale because useful values may span orders of magnitude. Counts and categorical choices need appropriate discrete spaces.

### Q10. How do you tune under multiple constraints?

Define a primary objective and constraints such as latency, memory, fairness, or minimum recall. Use constrained optimization, a weighted utility, or identify the Pareto frontier rather than choosing on accuracy alone.

### Q11. What information should be recorded for each experiment?

Code and data versions, split, configuration, random seed, environment, metrics, runtime, hardware, artifacts, and notes. Reproducibility is part of reliable model selection.

---

## 12. Model Interpretability

### Q1. What is the difference between interpretability and explainability?

Interpretability usually means the model's behavior can be directly understood, while explainability includes post-hoc techniques used to describe complex models. The terms are sometimes used interchangeably.

### Q2. What is the difference between global and local explanations?

Global explanations summarize behavior across the population. Local explanations describe why the model produced one particular prediction. Neither automatically provides a causal explanation.

### Q3. How are linear-model coefficients interpreted?

A coefficient gives the expected change in the model score per unit feature change, holding included variables constant. In logistic regression it changes log-odds; exponentiation gives an odds ratio.

### Q4. What is permutation importance?

It measures the decrease in validation performance after randomly shuffling one feature. It is model-agnostic and reflects predictive reliance, but correlated features can substitute for each other and appear less important.

### Q5. What is a partial dependence plot?

It averages predictions while varying selected features, showing their average modeled effect. It can evaluate unrealistic feature combinations when features are correlated.

### Q6. What is an ICE plot?

An Individual Conditional Expectation plot shows the prediction response for each individual observation rather than only the average. It reveals heterogeneous effects hidden by partial dependence.

### Q7. What is SHAP?

SHAP assigns feature contributions based on Shapley values from cooperative game theory. Contributions sum to the difference between a prediction and a baseline, but interpretation depends on the background distribution and feature-dependence assumptions.

### Q8. What is LIME?

LIME fits a simple local surrogate around one prediction using perturbed samples weighted by proximity. Results can be unstable and depend on the perturbation distribution and neighborhood definition.

### Q9. Why is feature importance not causality?

Importance shows that a model relies on a feature for prediction under the observed data distribution. Confounding, proxies, selection effects, and reverse causality can produce importance without a causal effect.

### Q10. What are counterfactual explanations?

They describe small feasible input changes that would alter a prediction. Useful counterfactuals must respect immutable features, causal dependencies, plausibility, and actionability.

### Q11. How can explanations be validated?

Test faithfulness to model behavior, stability under small perturbations, sensitivity to meaningful changes, consistency with known logic, and usefulness to the intended audience. Avoid treating a visually plausible explanation as proof.

### Q12. When should an inherently interpretable model be preferred?

When decisions are high-stakes, auditability is mandatory, data is limited, or a simple model performs nearly as well. Interpretability is a system requirement, not merely a post-processing choice.

---

# Priority 3: Unsupervised Learning

## 13. Clustering

### Q1. What is clustering?

Clustering groups observations so members of the same group are more similar under a chosen representation and metric. A cluster is not automatically a real-world category; usefulness requires domain validation.

### Q2. How does K-means work?

It alternates between assigning each point to its nearest centroid and updating each centroid to the mean of assigned points. It minimizes within-cluster squared Euclidean distance and converges to a local optimum.

### Q3. What assumptions does K-means make?

It works best for roughly spherical, similarly sized and dense clusters under Euclidean distance. It is sensitive to scale, outliers, initialization, and non-convex cluster shapes.

### Q4. What is K-means++?

It initializes centroids to be spread apart probabilistically, reducing poor initializations and often improving convergence and final clustering compared with random centroid selection.

### Q5. How do you choose \(k\)?

Use domain needs plus measures such as the elbow in within-cluster sum of squares, silhouette score, stability across samples, and downstream usefulness. Metrics alone do not guarantee meaningful segments.

### Q6. What is the silhouette score?

For each point, it compares average distance within its cluster \(a\) to the nearest other cluster \(b\): \((b-a)/\max(a,b)\). Values near 1 suggest good separation; values below 0 suggest possible misassignment.

### Q7. How does hierarchical clustering work?

Agglomerative clustering starts with each point as a cluster and repeatedly merges clusters. Divisive clustering starts with one cluster and splits it. A dendrogram shows the hierarchy and allows a cut at different cluster counts.

### Q8. What are common linkage criteria?

Single linkage uses the nearest pair and can chain clusters. Complete linkage uses the farthest pair and creates compact groups. Average linkage averages pairwise distances. Ward linkage merges clusters causing the smallest increase in within-cluster variance.

### Q9. How does DBSCAN work?

DBSCAN identifies dense regions using neighborhood radius \(\varepsilon\) and minimum points. Core points expand clusters, border points join them, and sparse points are labeled noise.

### Q10. What are DBSCAN's advantages and limitations?

It finds arbitrary-shaped clusters, detects noise, and does not require \(k\). It struggles with varying densities, high dimensions, and selecting a single suitable \(\varepsilon\); features must be scaled appropriately.

### Q11. What is a Gaussian Mixture Model?

A GMM models data as a weighted mixture of Gaussian distributions and returns soft membership probabilities. Unlike K-means, components can have different covariance shapes and sizes.

### Q12. How does Expectation-Maximization train a GMM?

The E-step computes component responsibilities for each point. The M-step updates weights, means, and covariances using those responsibilities. The process repeats until likelihood improvement is small.

### Q13. What is the difference between hard and soft clustering?

Hard clustering assigns one cluster per observation. Soft clustering gives a probability or degree of membership in multiple clusters, which can better represent overlapping groups.

### Q14. Why is scaling important in clustering?

Most clustering objectives use distances. Features with larger scales dominate those distances unless scaling or a domain-specific metric corrects the imbalance.

### Q15. How can clustering be evaluated without labels?

Use internal cohesion/separation metrics, stability under resampling or initialization, and domain usefulness. If labels exist, adjusted Rand index or normalized mutual information can compare assignments without relying on cluster-label names.

### Q16. How would you cluster mixed numerical and categorical data?

Use an appropriate representation and distance, such as Gower distance, k-prototypes, learned embeddings, or separate similarities combined with domain weights. Blind one-hot Euclidean distance may be misleading.

---

## 14. Dimensionality Reduction

### Q1. Why reduce dimensionality?

To remove redundancy and noise, reduce computation and storage, improve visualization, mitigate the curse of dimensionality, or make downstream modeling easier. Reduction may sacrifice interpretability or information.

### Q2. What is PCA?

Principal Component Analysis finds orthogonal directions of maximum variance and projects centered data onto them. Components are linear combinations of original features and are ordered by explained variance.

### Q3. How is PCA related to covariance eigenvectors?

PCA directions are eigenvectors of the covariance matrix, ordered by descending eigenvalues. Each eigenvalue represents variance captured along its component.

### Q4. How is PCA related to SVD?

Applying SVD to a centered data matrix \(X=U\Sigma V^T\) yields principal directions in columns of \(V\). Singular values determine explained variance. SVD is typically the numerically preferred computation.

### Q5. Should data be scaled before PCA?

Usually yes when feature units or variances differ and no feature should dominate merely due to scale. If raw variance is inherently meaningful, centering without standardizing may be appropriate.

### Q6. How many principal components should be retained?

Choose using cumulative explained variance, a scree plot, cross-validated downstream performance, reconstruction error, or a domain constraint. A common variance threshold is a heuristic, not a universal rule.

### Q7. What are PCA's assumptions and limitations?

It captures linear directions of high variance, assumes variance corresponds to useful structure, is sensitive to scaling and outliers, and can produce components that are hard to interpret. High variance need not be predictive of the target.

### Q8. What is t-SNE?

t-SNE is a nonlinear visualization method that preserves local neighbor relationships by matching probability distributions in high- and low-dimensional spaces. It is mainly used for two- or three-dimensional exploration.

### Q9. How should a t-SNE plot be interpreted?

Nearby points may represent local similarity, but cluster sizes, global distances, and empty space are not reliably meaningful. Results depend on perplexity, initialization, preprocessing, and random seed.

### Q10. What is UMAP?

UMAP constructs a graph of local neighborhoods and optimizes a low-dimensional graph representation. It is often faster than t-SNE and may preserve more global structure, but its plots still require cautious interpretation.

### Q11. What is the difference between PCA, t-SNE, and UMAP?

PCA is linear, deterministic up to numerical/sign choices, supports transformation of new data, and preserves global variance. t-SNE and UMAP are nonlinear and especially useful for visualization of local structure; their apparent clusters are parameter-sensitive.

### Q12. What is an autoencoder?

An autoencoder trains an encoder to compress inputs and a decoder to reconstruct them. A bottleneck can learn nonlinear representations, but a powerful network may learn trivial identity-like behavior without suitable constraints.

### Q13. What is the difference between feature selection and dimensionality reduction?

Feature selection retains a subset of original variables. Dimensionality reduction creates new variables by combining or transforming the originals.

### Q14. How can dimensionality reduction leak information?

Fitting PCA or another reducer before data splitting uses validation/test distribution information. Fit it only on training data within each fold and apply the learned transformation elsewhere.

---

## 15. Anomaly Detection

### Q1. What is anomaly detection?

It identifies observations that differ significantly from expected behavior. Anomalies may be point anomalies, contextual anomalies, or unusual sequences/collections.

### Q2. How is supervised anomaly detection different from unsupervised detection?

Supervised detection treats known anomalies as a class but requires representative labels. Unsupervised methods assume anomalies are rare or structurally different. Semi-supervised methods learn normal behavior and flag deviations.

### Q3. How does Isolation Forest work?

It repeatedly selects random features and split values. Anomalies tend to be isolated with fewer splits, so shorter average path length indicates greater anomaly likelihood.

### Q4. How does Local Outlier Factor work?

LOF compares a point's local density with the densities of its neighbors. A point is anomalous if its neighborhood is substantially less dense than nearby neighborhoods. It detects local rather than only global outliers.

### Q5. How does One-Class SVM work?

It learns a boundary around normal data in a transformed feature space, treating points outside as anomalies. It is sensitive to scaling, kernels, and hyperparameters and can be expensive on large datasets.

### Q6. How can an autoencoder detect anomalies?

Train it primarily on normal examples, then use reconstruction error as an anomaly score. The assumption is that unfamiliar abnormal patterns reconstruct poorly; an overly expressive model may reconstruct anomalies well.

### Q7. How is an anomaly threshold selected?

Use labeled validation data when possible, or set it from an expected contamination rate, tail quantile, cost constraint, or review capacity. Threshold selection is a business and operational decision, not just a modeling step.

### Q8. How do you evaluate anomaly detection with very few labels?

Use precision at review budget, recall on known incidents, PR-AUC, time-to-detection, expert review, synthetic or injected anomalies, and backtesting. Validate that synthetic anomalies resemble operationally relevant failures.

### Q9. What makes anomaly detection difficult in production?

Normal behavior changes, labels arrive late, anomalies are diverse, attackers adapt, and alert volume is constrained. Monitoring score distributions and obtaining analyst feedback are central to maintenance.

### Q10. How should time-series anomalies be handled?

Model seasonality, trend, autocorrelation, and context before thresholding residuals. A value may be normal globally but abnormal for its time, entity, or recent history.

---

# Priority 4: Supporting Mathematics

## 16. Probability

### Q1. What is the difference between probability and likelihood?

Probability treats model parameters as fixed and describes possible data outcomes, such as \(P(X\mid\theta)\). Likelihood treats observed data as fixed and compares parameter values: \(L(\theta;X)\). The same expression can serve both roles, but the quantity being varied differs.

### Q2. What are joint, marginal, and conditional probability?

- **Joint:** \(P(A,B)\), the probability that both events occur.
- **Marginal:** \(P(A)=\sum_b P(A,b)\), probability after summing/integrating over other variables.
- **Conditional:** \(P(A\mid B)=P(A,B)/P(B)\), probability of \(A\) given \(B\).

### Q3. State Bayes' theorem.

\[
P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}.
\]

The posterior equals likelihood times prior divided by evidence. In classification, it reverses a class-conditional probability into a probability of class given features.

### Q4. What is the difference between independent and mutually exclusive events?

Independent events satisfy \(P(A,B)=P(A)P(B)\); observing one does not change the other's probability. Mutually exclusive events cannot occur together, so \(P(A,B)=0\). Nonzero-probability mutually exclusive events are not independent.

### Q5. What is conditional independence?

Events \(A\) and \(B\) are conditionally independent given \(C\) if \(P(A,B\mid C)=P(A\mid C)P(B\mid C)\). Naive Bayes assumes input features are conditionally independent given the class.

### Q6. What is a random variable?

A random variable maps outcomes of a random process to numerical values. A discrete variable has a probability mass function; a continuous variable has a probability density whose integral over a range gives probability.

### Q7. What are expectation and variance?

Expectation is the probability-weighted average, \(E[X]\). Variance measures squared dispersion around the expectation: \(Var(X)=E[(X-E[X])^2]=E[X^2]-E[X]^2\).

### Q8. What are covariance and correlation?

Covariance measures how two variables vary together: \(Cov(X,Y)=E[(X-E[X])(Y-E[Y])]\). Correlation standardizes covariance by both standard deviations, lies between -1 and 1, and measures linear association.

### Q9. Does zero correlation imply independence?

Not generally. Independence implies zero covariance when moments exist, but dependent nonlinear relationships can have zero correlation. For jointly Gaussian variables, zero correlation does imply independence.

### Q10. What is the law of total probability?

If \(B_i\) partitions the sample space, then \(P(A)=\sum_iP(A\mid B_i)P(B_i)\). It accounts for all mutually exclusive ways an event can occur.

### Q11. What is the law of total expectation?

\(E[X]=E[E[X\mid Y]]\). It is useful when an expectation is easier to compute within groups and then average over groups.

### Q12. What is the law of total variance?

\(Var(X)=E[Var(X\mid Y)]+Var(E[X\mid Y])\). Total variability equals average within-group variability plus variability between group means.

### Q13. What is a Bernoulli distribution?

It models one binary trial with success probability \(p\). Its mean is \(p\) and variance is \(p(1-p)\). Logistic regression models a Bernoulli outcome.

### Q14. What is a binomial distribution?

It models the number of successes in \(n\) independent Bernoulli trials with a constant success probability \(p\). Its mean is \(np\) and variance is \(np(1-p)\).

### Q15. When are Poisson and exponential distributions used?

Poisson models event counts in a fixed interval under a constant independent event rate. Exponential models waiting time between events in a Poisson process and has the memoryless property.

### Q16. Why is the normal distribution important?

Many measurements are approximately normal, sums and averages often approach normality through the central limit theorem, and Gaussian assumptions yield convenient estimation. It is characterized by its mean and variance.

### Q17. What is the central limit theorem?

Under broad conditions, the standardized sum or sample mean of independent identically distributed variables approaches a normal distribution as sample size grows, even if the original population is not normal. It does not say the raw data becomes normal.

### Q18. What is the law of large numbers?

As the number of independent observations grows, the sample average converges to the expected value under suitable conditions. It explains why empirical averages stabilize with enough data.

### Q19. What is entropy?

Entropy measures uncertainty in a distribution: \(H(P)=-\sum_xP(x)\log P(x)\). It is highest for a uniform categorical distribution and zero when the outcome is certain.

### Q20. What are cross-entropy and KL divergence?

Cross-entropy \(H(P,Q)=-E_P[\log Q]\) measures how well \(Q\) represents data from \(P\). KL divergence \(D_{KL}(P\|Q)=H(P,Q)-H(P)\) measures distribution mismatch, is nonnegative, asymmetric, and not a distance metric.

---

## 17. Statistics

### Q1. What are population, sample, parameter, and statistic?

A population is the full group of interest; a sample is observed from it. A parameter is a fixed unknown population quantity, while a statistic is a quantity computed from the sample and therefore varies across samples.

### Q2. When should mean, median, or mode be used?

The mean uses all magnitudes but is sensitive to outliers. The median is robust and suitable for skewed distributions. The mode describes the most frequent value and can be useful for categorical data.

### Q3. Why does sample variance use \(n-1\)?

Because estimating the sample mean consumes one degree of freedom. Dividing the squared deviations by \(n-1\) makes the estimator unbiased for population variance under independent sampling.

### Q4. What is an estimator's bias?

Bias is \(E[\hat\theta]-\theta\), the difference between its expected estimate and the true parameter. An unbiased estimator is not necessarily best; a slightly biased estimator can have lower mean squared error because of lower variance.

### Q5. What are consistency and efficiency?

A consistent estimator converges to the true parameter as sample size grows. Among comparable unbiased estimators, a more efficient one has lower variance.

### Q6. What is maximum-likelihood estimation?

MLE chooses parameters maximizing the probability density or mass assigned to observed data. Equivalently, it minimizes negative log-likelihood. Under regularity conditions it is consistent and asymptotically normal.

### Q7. What is MAP estimation?

Maximum a posteriori estimation maximizes \(P(\theta\mid D)\propto P(D\mid\theta)P(\theta)\). It combines likelihood with a prior. Common regularizers correspond to particular priors—for example, L2 to a Gaussian prior and L1 to a Laplace prior.

### Q8. What is a confidence interval?

A 95% frequentist confidence procedure produces intervals that contain the true fixed parameter in 95% of repeated samples. It does not mean there is a 95% probability that the already-computed interval contains the fixed parameter.

### Q9. What are null and alternative hypotheses?

The null \(H_0\) describes the default claim being tested; the alternative \(H_1\) describes the competing claim. A test statistic measures how incompatible the observed data is with \(H_0\).

### Q10. What is a p-value?

It is the probability, assuming the null hypothesis and model assumptions are true, of observing a test statistic at least as extreme as the one obtained. It is not the probability that the null is true and does not measure effect size.

### Q11. What are Type I and Type II errors?

A Type I error rejects a true null; its controlled probability is \(\alpha\). A Type II error fails to reject a false null; its probability is \(\beta\). Statistical power is \(1-\beta\).

### Q12. What affects statistical power?

Effect size, sample size, noise/variance, significance level, experimental design, and the chosen test. Larger true effects and samples generally increase power.

### Q13. What is the difference between statistical and practical significance?

A tiny effect can be statistically significant with a huge sample while having negligible business value. Report effect size and uncertainty, then assess impact, cost, risk, and operational relevance.

### Q14. What is multiple-hypothesis testing?

Testing many hypotheses increases the chance of false positives. Bonferroni controls family-wise error conservatively; Benjamini-Hochberg controls the false discovery rate under suitable conditions.

### Q15. What is bootstrapping?

Bootstrapping repeatedly samples observations with replacement and recalculates a statistic to estimate its sampling distribution, uncertainty, or confidence interval. The resampling scheme must preserve dependence structure where necessary.

### Q16. What is selection bias?

Selection bias occurs when observed or included examples are not representative because selection depends on relevant characteristics. More data from the same biased mechanism does not remove it.

### Q17. What are confounding and Simpson's paradox?

A confounder influences both a predictor and outcome, creating or masking association. Simpson's paradox occurs when an aggregate trend reverses or disappears after stratifying by a relevant variable.

### Q18. What is correlation versus causation?

Correlation describes association; causation means intervening on one variable changes another. Establishing causality requires assumptions and design, such as randomization or justified causal adjustment—not predictive performance alone.

### Q19. How would you design an A/B test?

Define the unit and target population, primary metric, minimum detectable effect, sample size, randomization, guardrails, duration, stopping rule, and analysis plan before launch. Check assignment, sample-ratio mismatch, novelty, interference, and practical impact.

### Q20. What is data snooping?

It is repeatedly inspecting data and adapting hypotheses or analysis while reporting results as if they were pre-specified. Holdouts, pre-registration, correction, and confirmation on fresh data reduce the resulting optimism.

---

## 18. Linear Algebra

### Q1. What are scalars, vectors, matrices, and tensors?

A scalar is one number, a vector is a one-dimensional array, a matrix is a two-dimensional array, and a tensor generalizes arrays to more dimensions. In deep learning, batches and model activations are represented as tensors.

### Q2. What is a dot product?

For vectors, \(x^Ty=\sum_ix_iy_i\). It measures alignment and equals \(\|x\|\|y\|\cos\theta\). Linear models use it to compute weighted sums.

### Q3. What is matrix multiplication?

If \(A\) is \(m\times n\) and \(B\) is \(n\times p\), then \(AB\) is \(m\times p\), with each entry formed by a row-column dot product. Order matters: generally \(AB\neq BA\).

### Q4. What is a transpose?

The transpose swaps rows and columns. It satisfies \((AB)^T=B^TA^T\). Symmetric matrices satisfy \(A=A^T\).

### Q5. What is matrix rank?

Rank is the number of linearly independent rows or columns, equivalently the dimension of the transformed space. Rank deficiency indicates redundant directions and can make a least-squares solution non-unique.

### Q6. What is linear independence?

Vectors are linearly independent if no vector can be represented as a linear combination of the others. Independent columns provide distinct information directions.

### Q7. What are basis and dimension?

A basis is a linearly independent set spanning a vector space. Dimension is the number of vectors in a basis. Coordinates represent a vector relative to a chosen basis.

### Q8. What is a matrix inverse?

For square full-rank \(A\), \(A^{-1}A=I\). In numerical ML, explicitly computing an inverse is often less stable and efficient than solving a linear system through decompositions.

### Q9. What is the pseudoinverse?

The Moore-Penrose pseudoinverse generalizes inversion to non-square or rank-deficient matrices. It yields the minimum-norm least-squares solution and is computed stably using SVD.

### Q10. What are eigenvalues and eigenvectors?

For square \(A\), an eigenvector \(v\neq0\) satisfies \(Av=\lambda v\). The transformation scales that direction by eigenvalue \(\lambda\). PCA uses eigenvectors of a covariance matrix.

### Q11. What is SVD?

Any matrix can be factored as \(A=U\Sigma V^T\), where \(U,V\) contain orthonormal singular vectors and \(\Sigma\) contains nonnegative singular values. SVD supports low-rank approximation, PCA, pseudoinverses, and numerical diagnostics.

### Q12. What is an orthogonal projection?

It maps a vector onto a subspace so the residual is perpendicular to that subspace. Least squares projects the target vector onto the column space of the design matrix.

### Q13. What are common vector norms?

L1 is \(\sum_i|x_i|\), L2 is \(\sqrt{\sum_ix_i^2}\), and L-infinity is \(\max_i|x_i|\). Norms measure magnitude and induce different regularization behavior.

### Q14. What is cosine similarity?

It is \(x^Ty/(\|x\|\|y\|)\), measuring directional similarity independent of magnitude. It is common for text embeddings and high-dimensional sparse vectors.

### Q15. What is a positive semidefinite matrix?

A symmetric matrix \(A\) is positive semidefinite if \(x^TAx\ge0\) for every \(x\). Covariance matrices and many kernel Gram matrices are positive semidefinite.

### Q16. What is a condition number?

It measures sensitivity of a system's output to small input perturbations, often as the ratio of largest to smallest singular value. A high condition number indicates numerical instability and commonly arises with multicollinearity.

### Q17. Why are vectorized operations faster?

They move loops into optimized compiled numerical kernels, improve memory access, and exploit SIMD, multithreading, or accelerators. They also make tensor shapes and batch computation explicit.

---

## 19. Calculus and Optimization

### Q1. What is a derivative?

A derivative measures the local rate of change of a function with respect to one variable. Geometrically, it is the slope of the tangent line.

### Q2. What is a partial derivative?

It measures change with respect to one variable while holding other independent variables constant. A function of many variables has one partial derivative per coordinate.

### Q3. What is a gradient?

The gradient is the vector of partial derivatives. It points in the direction of steepest local increase; the negative gradient points toward steepest local decrease.

### Q4. What is the chain rule?

For composed functions, derivatives multiply through the composition. If \(y=f(g(x))\), then \(dy/dx=(df/dg)(dg/dx)\). Backpropagation efficiently applies this rule through a computation graph.

### Q5. What is the Hessian?

The Hessian is the matrix of second partial derivatives. It describes local curvature and helps distinguish minima, maxima, and saddle points when conditions apply.

### Q6. How does gradient descent work?

It iteratively updates \(\theta_{t+1}=\theta_t-\eta\nabla L(\theta_t)\), where \(\eta\) is the learning rate. It uses local slope to reduce the objective.

### Q7. What happens when the learning rate is too high or too low?

A very high rate can overshoot, oscillate, or diverge. A very low rate is stable but slow and may stall on flat regions. Schedules and adaptive optimizers vary the effective rate during training.

### Q8. Compare batch, stochastic, and mini-batch gradient descent.

Batch uses the entire dataset per update and gives an exact gradient but can be expensive. Stochastic uses one example and is noisy. Mini-batch balances efficient hardware use, gradient quality, and frequent updates.

### Q9. What is a convex function?

A function is convex if the line segment between any two points on its graph lies above the graph. Every local minimum of a convex function is global; strict convexity gives at most one minimizer.

### Q10. Why are neural-network objectives non-convex?

Composed nonlinear layers and parameter symmetries create saddle points, flat regions, and many equivalent minima. First-order optimization can still find solutions that generalize well in practice.

### Q11. What is a saddle point?

It is a stationary point that is a minimum along some directions and a maximum along others. High-dimensional non-convex objectives often contain many saddle regions.

### Q12. What is momentum?

Momentum maintains an exponentially weighted moving direction from past gradients. It accelerates movement along consistent slopes and reduces oscillation across steep directions.

### Q13. What is the relationship between loss, objective, and regularization?

The data loss measures prediction error. The optimization objective often combines average data loss with a regularization penalty. The evaluation metric may differ because it reflects business value rather than a differentiable training signal.

### Q14. Why can gradients vanish or explode?

Repeated multiplication by small or large derivatives or weight matrices through many layers/time steps can drive gradients toward zero or infinity. Initialization, normalization, residual connections, gated recurrence, activation choice, and clipping help.

### Q15. What is gradient clipping?

It caps gradient values or, more commonly, rescales a gradient whose norm exceeds a threshold. It stabilizes training under occasional exploding gradients but does not fix the underlying architecture by itself.

### Q16. What is automatic differentiation?

Automatic differentiation applies the chain rule to elementary operations recorded in a computation graph. Reverse-mode autodiff efficiently computes gradients of a scalar loss with respect to many parameters.

---

# Priority 5: Deep Learning

## 20. Neural-Network Fundamentals

### Q1. What is an artificial neuron?

It computes a weighted sum \(z=w^Tx+b\) followed by an activation \(a=\phi(z)\). Layers of these units learn increasingly complex transformations.

### Q2. What is a perceptron?

A perceptron is a linear binary classifier with a threshold activation and an update rule for misclassified examples. A single perceptron cannot represent non-linearly separable functions such as XOR.

### Q3. Why are nonlinear activation functions necessary?

Without nonlinear activations, composing linear layers is still one linear transformation, regardless of depth. Nonlinearity allows neural networks to approximate complex functions.

### Q4. Compare sigmoid, tanh, ReLU, and GELU.

- **Sigmoid:** outputs 0–1; useful for binary output probabilities but saturates.
- **Tanh:** zero-centered -1–1 output but also saturates.
- **ReLU:** \(\max(0,x)\); efficient and nonsaturating for positive inputs but can create dead units.
- **GELU:** smoothly gates values and is common in Transformers.

### Q5. What is forward propagation?

It applies each layer's operations from input to output to calculate activations, predictions, and loss using current parameters.

### Q6. What is backpropagation?

Backpropagation uses reverse-mode differentiation and the chain rule to propagate loss gradients backward through the network, efficiently obtaining a gradient for every trainable parameter.

### Q7. What is a loss function?

It is a differentiable training objective measuring prediction error. Mean squared error is common for Gaussian-like regression; cross-entropy is common for classification.

### Q8. Why use cross-entropy for classification?

It is the negative log-likelihood of a categorical or Bernoulli model, provides informative gradients, and heavily penalizes confident wrong predictions.

### Q9. What is softmax?

For logits \(z_i\), softmax gives \(p_i=e^{z_i}/\sum_je^{z_j}\), producing nonnegative probabilities summing to one. Implementations subtract the maximum logit for numerical stability.

### Q10. What is the difference between a logit and a probability?

A logit is an unconstrained pre-activation score. Sigmoid or softmax transforms logits into probabilities. Cross-entropy implementations often accept logits directly for numerical stability.

### Q11. What does network depth provide?

Depth enables hierarchical composition and can represent some functions more efficiently than a shallow network. Greater depth also increases optimization and regularization challenges.

### Q12. What does network width provide?

Width increases the number of features a layer can represent and overall capacity. Excess width increases compute and memory but can sometimes make optimization easier.

### Q13. What is the universal approximation theorem?

Under suitable conditions, a sufficiently wide neural network can approximate any continuous function on a compact domain. It does not say learning will be efficient, data requirements will be small, or the model will generalize.

### Q14. What is an embedding?

An embedding is a learned dense vector representation where useful relationships are encoded geometrically. Embedding tables map discrete IDs or tokens to vectors and are trained with the rest of the model.

### Q15. How are multi-label and multiclass output layers different?

Mutually exclusive multiclass problems use softmax and categorical cross-entropy. Multi-label problems use one sigmoid per label and binary cross-entropy because multiple labels may be true simultaneously.

### Q16. How do parameter count and activation memory differ?

Parameters are persistent learned weights. Activations are intermediate values stored mainly for backpropagation and often dominate memory for large batches, long sequences, or high-resolution inputs.

---

## 21. Training Neural Networks

### Q1. Why is weight initialization important?

Initialization should break symmetry while keeping forward activations and backward gradients at useful scales. Setting all weights equal prevents hidden units from learning different features.

### Q2. What are Xavier and He initialization?

Xavier/Glorot initialization scales variance using fan-in and fan-out and suits tanh-like activations. He/Kaiming initialization primarily uses fan-in and suits ReLU-like activations. Both aim to stabilize signal variance across layers.

### Q3. What is an epoch, iteration, and batch size?

An epoch is one pass through the training set. An iteration is one parameter update. Batch size is the number of examples used in that update; iterations per epoch are approximately dataset size divided by batch size.

### Q4. How does batch size affect training?

Larger batches provide smoother gradient estimates and efficient hardware use but consume more memory and may require learning-rate changes. Smaller batches add gradient noise, produce more updates, and sometimes improve generalization.

### Q5. What is SGD with momentum?

SGD updates parameters from mini-batch gradients. Momentum accumulates a moving direction, accelerating consistent progress and damping oscillations.

### Q6. What is RMSProp?

RMSProp divides each parameter's gradient by a running root mean square of recent gradients, giving adaptive per-parameter step sizes. It helps when gradients differ greatly in scale.

### Q7. How does Adam work?

Adam combines moving averages of gradients and squared gradients, applies bias correction, and uses adaptive per-parameter updates. It often converges quickly, though learning rate and weight decay still require tuning.

### Q8. What is AdamW, and how does it differ from L2 regularization in Adam?

AdamW decouples weight decay from the adaptive gradient update. This makes weight decay behave as direct parameter shrinkage and is generally preferred over adding an L2 term to Adam's loss.

### Q9. What is a learning-rate schedule?

It changes learning rate during training—for example, step decay, cosine decay, one-cycle schedules, or reduction on validation plateau. Warmup starts small to avoid unstable early updates, especially in large Transformer training.

### Q10. What is batch normalization?

It normalizes each feature/channel using mini-batch statistics, then applies learned scale and shift. It can stabilize and accelerate training but uses running statistics at inference and can behave poorly with very small batches.

### Q11. What is layer normalization?

It normalizes features within each individual example rather than across the batch. Its behavior is independent of batch size, making it natural for sequence models and Transformers.

### Q12. What is dropout?

During training, dropout randomly zeroes activations and rescales the survivors, discouraging co-adaptation. At inference it is disabled. Excessive dropout can cause underfitting.

### Q13. What is early stopping?

It stops when validation performance fails to improve for a patience interval and restores the best checkpoint. It reduces wasted compute and limits overfitting.

### Q14. What is data augmentation?

It creates label-preserving variations of training examples, such as image crops, flips, color changes, noise, or domain-appropriate transformations. Invalid augmentations can change the true label and hurt performance.

### Q15. What is transfer learning?

It initializes a model from weights learned on another task or large dataset, then adapts it to the target task. It is especially useful with limited labeled data or expensive training.

### Q16. What is the difference between feature extraction and fine-tuning?

Feature extraction freezes the pretrained backbone and trains a new head. Fine-tuning updates some or all pretrained layers, usually with a smaller learning rate. Fine-tuning can adapt better but risks overfitting or catastrophic forgetting.

### Q17. What are common signs of an optimization problem?

Loss is NaN or divergent, gradients are zero or enormous, training loss does not decrease, activations collapse, or performance is highly unstable across runs. Inspect data, labels, loss implementation, scales, gradients, learning rate, and numerical precision.

### Q18. What are mixed-precision training and loss scaling?

Mixed precision uses lower-precision arithmetic where safe to improve speed and memory while retaining higher precision for sensitive operations. Loss scaling magnifies small gradients before backpropagation to avoid underflow, then unscales them before the update.

### Q19. Why is a reproducible neural-network run difficult?

Random initialization, shuffling, augmentation, nondeterministic GPU kernels, distributed reduction order, and environment differences all matter. Fixing seeds helps but does not always guarantee bitwise determinism.

### Q20. How would you diagnose overfitting in a neural network?

Training loss continues improving while validation loss worsens or validation metrics plateau. Try more data or augmentation, regularization, smaller capacity, early stopping, leakage checks, and error analysis before blindly adding dropout.

---

## 22. Convolutional Neural Networks

### Q1. What is convolution in a CNN?

A small learned kernel slides across an input and computes local weighted sums. The same kernel weights are reused across positions, producing a feature map.

### Q2. Why are CNNs effective for images?

They exploit locality and translation-related structure through local receptive fields and parameter sharing. This greatly reduces parameters compared with fully connected layers and builds hierarchical visual features.

### Q3. What are stride and padding?

Stride is the number of positions the kernel moves per step; larger stride reduces spatial resolution. Padding adds values around the input, often zeros, to control output size and border treatment.

### Q4. What is the convolution output-size formula?

For input size \(N\), kernel \(K\), padding \(P\), stride \(S\), and dilation \(D\), the output is
\[
\left\lfloor\frac{N+2P-D(K-1)-1}{S}\right\rfloor+1.
\]

Apply it separately to height and width.

### Q5. What is a receptive field?

It is the region of the original input that can influence a particular activation. Receptive fields grow with stacked convolutions, larger kernels, strides, pooling, and dilation.

### Q6. What is pooling?

Pooling summarizes local regions, commonly by maximum or average, reducing resolution and adding some translation tolerance. Strided convolutions are a learned alternative.

### Q7. What is a channel or feature map?

An input image may have color channels; a convolution layer produces output channels, each corresponding to a learned filter. A filter spans all input channels and creates one output feature map.

### Q8. Why are multiple small convolutions often preferred to one large convolution?

Stacked small kernels can achieve a comparable receptive field with fewer parameters, more nonlinearities, and greater representational flexibility. For example, two 3×3 layers approximate a 5×5 receptive field.

### Q9. What is a 1×1 convolution?

It mixes information across channels at each spatial location. It can change channel count cheaply, create bottlenecks, and add nonlinear channel interactions.

### Q10. What are dilated and depthwise-separable convolutions?

Dilated convolution spaces kernel elements apart to enlarge receptive field without proportionally more parameters. Depthwise-separable convolution first filters each channel separately, then mixes channels with 1×1 convolution, greatly reducing computation.

### Q11. What are residual connections?

A residual block learns \(F(x)\) and adds the input: \(y=F(x)+x\). The identity path improves gradient flow and allows very deep networks to optimize more easily.

### Q12. What is global average pooling?

It averages each final feature map over spatial dimensions, producing one value per channel. It reduces parameters compared with a large fully connected head and gives some spatial invariance.

### Q13. How do classification, object detection, and segmentation differ?

Classification assigns labels to an image. Detection predicts labeled bounding boxes. Semantic segmentation labels every pixel by class; instance segmentation also separates distinct objects of the same class.

### Q14. What is Intersection over Union?

IoU is intersection area divided by union area for predicted and true regions. It evaluates boxes or masks and is used to determine matching thresholds in detection metrics.

### Q15. What is non-maximum suppression?

NMS keeps a high-scoring detection and suppresses overlapping lower-scoring boxes, usually based on an IoU threshold. Variants such as soft-NMS reduce scores rather than removing boxes outright.

### Q16. How should image augmentation be chosen?

Use transformations that preserve the target in the deployment domain, such as crops, flips, rotations, or color variation when valid. Apply identical geometric transformations to boxes and masks and validate that augmentation does not create unrealistic inputs.

---

## 23. RNNs, LSTMs, and GRUs

### Q1. What is a recurrent neural network?

An RNN processes a sequence one step at a time, updating a hidden state from the current input and previous state. Shared weights allow variable sequence lengths.

### Q2. What is backpropagation through time?

BPTT unfolds the recurrent computation across time and backpropagates through the resulting chain. Truncated BPTT limits the number of steps to reduce memory and computation.

### Q3. Why do vanilla RNNs struggle with long dependencies?

Repeated multiplication through time can make gradients vanish or explode. Vanishing gradients prevent distant events from meaningfully affecting learning.

### Q4. How does an LSTM address vanishing gradients?

An LSTM maintains a cell state with additive updates controlled by input, forget, and output gates. This provides a path through which information and gradients can persist longer.

### Q5. What do the LSTM gates do?

The forget gate decides what old cell information to retain, the input gate controls new candidate information, and the output gate controls what cell information becomes the hidden state.

### Q6. How does a GRU differ from an LSTM?

A GRU combines cell and hidden state and uses update and reset gates. It has fewer parameters and may train faster; neither architecture is universally superior.

### Q7. What is a bidirectional RNN?

It processes the sequence forward and backward and combines both representations. It is useful when the complete sequence is available, but it cannot be used directly for causal streaming that must not see future tokens.

### Q8. What are many-to-one, one-to-many, and many-to-many tasks?

Many-to-one maps a sequence to one output, such as sentiment. One-to-many generates a sequence from one input. Many-to-many produces sequence outputs, either aligned per step or through an encoder-decoder.

### Q9. What is an encoder-decoder sequence model?

An encoder converts an input sequence into representations; a decoder generates an output sequence conditionally. Attention improves this design by allowing the decoder to access different encoder states directly.

### Q10. What is teacher forcing?

During training, the decoder receives the true previous token instead of its own prediction. It accelerates learning but creates exposure bias because inference uses model-generated history.

### Q11. What is exposure bias?

The model trains on clean ground-truth prefixes but must handle its own possibly incorrect predictions at inference. Errors can compound. Scheduled sampling is one attempted remedy, though it has trade-offs.

### Q12. How are variable-length sequences batched?

Pad to a common length and use a mask so padding does not affect loss or state, or use packed/ragged sequence support. Length-based bucketing reduces wasted computation.

### Q13. When might an RNN be preferable to a Transformer?

For small models, limited data, strict streaming, very low memory, or naturally sequential state updates. Transformers parallelize training better and usually model long-range context more effectively.

### Q14. What is gradient clipping's role in recurrent networks?

It limits occasional exploding gradients caused by long recurrent chains. Clipping by global norm is common; it stabilizes updates without solving vanishing gradients.

---

## 24. Attention and Transformers

### Q1. What problem does attention solve?

Attention lets a model dynamically retrieve relevant information from a set of representations instead of compressing everything into one fixed vector. It improves long-range interaction and interpretability of information flow, though attention weights are not automatically faithful explanations.

### Q2. What are queries, keys, and values?

A query represents what the current position is looking for, keys represent what each candidate contains for matching, and values contain the information to aggregate. Attention compares queries with keys and uses the resulting weights to combine values.

### Q3. What is scaled dot-product attention?

\[
Attention(Q,K,V)=softmax\left(\frac{QK^T}{\sqrt{d_k}}\right)V.
\]

Dividing by \(\sqrt{d_k}\) prevents large dot products from pushing softmax into saturated regions as key dimension grows.

### Q4. What is self-attention?

Queries, keys, and values are derived from the same sequence, allowing each position to combine information from other positions. A mask may restrict which positions are visible.

### Q5. What is cross-attention?

Queries come from one sequence or component while keys and values come from another, such as a decoder attending to encoder outputs or text attending to image representations.

### Q6. What is multi-head attention?

It runs several learned attention projections in parallel, allowing different heads to model different relationships or subspaces. Head outputs are concatenated and projected.

### Q7. Why do Transformers need positional information?

Self-attention alone is permutation-equivariant and does not know token order. Absolute or relative positional encodings inject sequence position or pairwise-distance information.

### Q8. What is the basic Transformer block?

It consists of multi-head attention, a position-wise feed-forward network, residual connections, and layer normalization. Dropout is commonly included. Modern variants differ in normalization placement and other details.

### Q9. What is the difference between encoder-only, decoder-only, and encoder-decoder Transformers?

- **Encoder-only:** bidirectional context; suited to representation and classification tasks.
- **Decoder-only:** causal next-token modeling; suited to autoregressive generation.
- **Encoder-decoder:** encoder reads input and decoder generates output; suited to translation and conditional generation.

### Q10. What is causal masking?

It prevents a position from attending to future tokens. This preserves the autoregressive requirement that token \(t\) be predicted only from tokens before it.

### Q11. What is a padding mask?

It prevents attention from assigning weight to padding tokens added for batching. Causal and padding masks solve different problems and may be combined.

### Q12. What is the computational complexity of full self-attention?

Attention score computation is quadratic in sequence length, \(O(n^2d)\) approximately, and the score matrix uses \(O(n^2)\) memory per head/batch factor. This motivates sparse, local, low-rank, recurrent, and optimized exact-attention methods.

### Q13. What is pre-norm versus post-norm?

Pre-norm applies layer normalization before attention or the feed-forward sublayer; post-norm applies it after the residual addition. Pre-norm generally improves gradient flow in deep Transformers.

### Q14. What happens during autoregressive Transformer inference?

The model predicts one token, appends or accepts it, and repeats. Key-value caching stores prior attention keys and values so they do not need to be recomputed at every step, though cache memory grows with sequence length.

### Q15. What are greedy decoding, beam search, and sampling?

Greedy decoding always chooses the highest-probability token. Beam search keeps several high-scoring sequences and suits tasks with constrained outputs. Sampling draws tokens from the distribution, enabling diverse generation.

### Q16. What do temperature, top-k, and top-p do?

Temperature rescales logits: lower values sharpen, higher values flatten. Top-k restricts sampling to the \(k\) most likely tokens. Top-p uses the smallest token set whose cumulative probability exceeds \(p\).

### Q17. Why can teacher-forced token accuracy differ from generation quality?

Training evaluates next-token prediction on true prefixes, while generation conditions on previous model outputs. Small errors change later context, and sequence quality also depends on decoding and task-level criteria.

### Q18. Why are residual connections and normalization important in Transformers?

Residual paths preserve information and support gradient flow through deep stacks. Normalization controls activation scale and makes optimization more stable.

### Q19. What is the difference between attention and convolution?

Convolution uses fixed local connectivity and shared position-relative filters. Attention uses content-dependent weighted interactions and can connect all positions directly, at greater sequence-length cost.

### Q20. What common mistakes occur when implementing attention?

Incorrect tensor shapes or transposes, wrong scaling dimension, applying softmax on the wrong axis, inverted masks, failing to mask padding, numerical overflow, and forgetting that dropout or causal masks differ between training modes and tasks.

---

# Priority 6: Final Interview Preparation

## 25. End-to-End ML Case Studies

### Q1. How should you structure an ML case-study answer?

Use this order:

1. Clarify the user, decision, prediction target, and prediction time.
2. Define success metrics and constraints.
3. Describe data sources, labels, and splitting.
4. Establish simple business and model baselines.
5. Propose features and models, starting simple.
6. Explain validation, error analysis, and fairness checks.
7. Describe deployment, experimentation, monitoring, and retraining.

### Q2. How do you determine whether a problem needs machine learning?

Confirm that the decision recurs, patterns can be learned from available data, feedback or labels exist, mistakes have measurable costs, and rules are insufficient. Prefer rules when the logic is stable, exact, auditable, and inexpensive.

### Q3. How do you convert a business goal into an ML objective?

Identify the action the prediction enables, define the target and horizon, quantify error costs, choose offline metrics aligned with value, and specify operational constraints. For example, “reduce fraud loss” may become ranking transactions for review under a fixed analyst capacity.

### Q4. What baseline models should be used?

Use a non-ML business baseline such as the current rule or historical average, then a simple model such as logistic/linear regression or shallow tree. A complex model is justified only by reliable incremental value.

### Q5. How do you design the data split for a case study?

Match deployment. Use chronological splits for future predictions, group splits when entities repeat, and geographic or domain holdouts when transfer matters. Ensure labels and every feature are available as of the prediction cutoff.

### Q6. How would you build a churn-prediction system?

Define churn and the intervention window, create timestamped usage/support/billing features, use temporal validation, and optimize expected retention value or recall at outreach capacity. Compare against recency-frequency rules, evaluate by customer segments, run an intervention experiment, and monitor calibration and population drift.

### Q7. How would you build a fraud-detection system?

Account for extreme imbalance, delayed labels, adaptive adversaries, and asymmetric costs. Combine rules and a model, use time-based backtests, optimize loss prevented at review/decline constraints, calibrate scores, provide low-latency features and explanations, and monitor attacks, false positives, and label delay.

### Q8. How would you build a spam classifier?

Define abuse categories and user tolerance, assemble time-correct labeled messages, use text/metadata features, and begin with TF-IDF plus logistic regression or Naive Bayes. Evaluate precision-recall by language and sender type, choose thresholds, add user-report feedback carefully, and defend against evolving adversarial content.

### Q9. How would you forecast demand?

Specify item-location-horizon granularity, handle stockouts and promotions, build lag/calendar/price features using only past data, and use rolling backtests. Compare seasonal-naive and statistical baselines with tree or sequence models, evaluate scale-appropriate errors and inventory cost, and produce prediction intervals.

### Q10. How would you design a recommendation system at a high level?

Use a multi-stage pipeline: candidate generation retrieves a manageable set, ranking scores candidates with richer features, and re-ranking applies diversity, freshness, policy, and business constraints. Evaluate retrieval recall and ranking metrics offline, then user and ecosystem outcomes online while handling cold start and feedback loops.

### Q11. How would you handle a cold-start problem?

For new users, use popularity, context, onboarding preferences, or cohort information. For new items, use content and metadata representations, exploration, and supplier rules. Gradually shift toward behavioral models as interactions accumulate.

### Q12. How do you choose between batch and real-time prediction?

Choose based on freshness requirements, latency, volume, feature availability, cost, and operational complexity. Batch is simpler and efficient for stable predictions; online inference is necessary when inputs or decisions change quickly. Hybrid systems precompute stable components and calculate dynamic parts online.

### Q13. What should be monitored after deployment?

Service health, latency, errors, input schema, missingness, feature and prediction distributions, calibration, outcome metrics when labels arrive, subgroup performance, business KPIs, and data/feature freshness. Each monitor needs an owner and response plan.

### Q14. What is the difference between data drift, concept drift, and model degradation?

Data drift changes input distribution; concept drift changes the relationship between inputs and target; model degradation is declining performance and can result from either, data bugs, policy changes, or feedback loops. Drift is a warning signal, not proof that performance declined.

### Q15. When should a model be retrained?

Use scheduled retraining when change is predictable or labels are slow, event-triggered retraining after validated degradation, or continuous updating when justified. Retraining should pass data, performance, fairness, and deployment gates rather than being triggered by drift alone.

### Q16. How would you debug a model that performs well offline but poorly online?

Check training-serving feature parity, timestamp leakage, schema/default differences, preprocessing and model versions, population shift, online latency and fallback rates, threshold choice, outcome definitions, experiment assignment, and feedback effects. Reproduce online examples through the offline pipeline.

### Q17. How do you account for fairness in an ML case study?

Identify affected groups and harms, assess data and label bias, select context-appropriate group and individual metrics, report uncertainty, inspect intersections, and consider human appeals or overrides. Fairness criteria may conflict, so trade-offs require product, legal, and stakeholder decisions.

### Q18. How do you communicate trade-offs in a case study?

State the decision, alternatives, evaluation criteria, expected benefits, costs, failure modes, and what evidence would change your recommendation. Avoid claiming one universally best model; make the choice conditional on requirements.

---

## 26. Discussing Your ML Projects

### Q1. How should you introduce an ML project?

In about one minute, explain the problem and user, your responsibility, data scale and type, baseline, approach, evaluation, deployment status, and measurable result. Make your individual contribution explicit.

### Q2. How do you answer “Why did you choose this model?”

Relate the choice to data size and modality, nonlinearity, interpretability, latency, missing values, training/inference cost, and baseline results. Mention alternatives tested and the evidence behind the final trade-off.

### Q3. How do you explain your data split?

Describe the unit of observation and deployment scenario, then explain whether the split was random, temporal, grouped, or geographic. Explicitly identify how you prevented the same entity or future information from crossing splits.

### Q4. How do you answer “What was your baseline?”

Give both the current business heuristic and a simple statistical/model baseline where possible. State their metrics under exactly the same split and explain how much incremental value the final model delivered.

### Q5. How do you discuss feature engineering?

Name a few high-impact features, why they should contain signal, how you calculated them at the correct prediction time, and their production cost. Include an ablation result if possible.

### Q6. How do you answer “What was the hardest technical challenge?”

Choose a real constraint, explain how you diagnosed it, alternatives considered, the selected solution, and quantitative outcome. Strong answers reveal reasoning rather than portraying the project as effortless.

### Q7. How do you discuss a failed experiment?

State the hypothesis, expected mechanism, experiment and result, diagnosis, and what changed afterward. A failed approach is valuable when the experiment was sound and produced reusable learning.

### Q8. How do you prove that improvement came from your model?

Use a controlled comparison: identical data and split, fixed preprocessing where appropriate, ablations, confidence intervals or repeated runs, and preferably an online experiment. Avoid comparing numbers produced under different evaluation setups.

### Q9. How do you answer “What would you improve with more time?”

Prioritize one or two actions based on the largest observed error source or product constraint. State how you would test them and what outcome you expect, instead of listing fashionable models.

### Q10. How do you explain error analysis?

Show how you inspected errors by type, confidence, data slice, time, and business cost. Describe one pattern discovered and the concrete data, feature, label, model, or product change it motivated.

### Q11. How do you discuss model deployment?

Cover serialization, preprocessing parity, interface, batch/online architecture, latency and capacity, versioning, canary or shadow testing, fallbacks, monitoring, and rollback. If the project was not deployed, say so and present a realistic design.

### Q12. How do you discuss collaboration without losing ownership?

Describe the shared goal and interfaces, state what you personally decided or built, explain how you worked with domain, data, engineering, or product partners, and give the team outcome.

### Q13. What project numbers should you know?

Dataset size and time span, positive rate, feature count, split design, baseline and final metrics, uncertainty, training time, inference latency, model size, cost, and measurable product impact. Approximate honestly if an exact value is unavailable.

### Q14. What if an interviewer challenges a project decision?

Clarify their assumption, explain the context and evidence behind your choice, acknowledge valid limitations, and compare the proposed alternative. Update your view when the alternative is better; defensiveness is not technical rigor.

### Q15. What project limitations should you volunteer?

Discuss important known weaknesses such as sample bias, noisy labels, limited external validity, unmeasured business impact, subgroup uncertainty, or manual pipeline steps, along with the mitigation or next experiment.

---

## 27. ML Coding and Implementation

### Q1. What should you clarify before writing ML code in an interview?

Ask about input types and shapes, missing values, constraints, expected output, edge cases, whether libraries are allowed, and desired time/space complexity. Then state a simple correct approach before optimizing.

### Q2. How would you implement a train-test split safely?

Shuffle indices with a local seeded random generator for i.i.d. data, or split by time/group when required. Slice both features and labels with the same indices, preserve an untouched test set, and validate that sets do not overlap.

### Q3. How would you implement standardization without leakage?

Compute mean and standard deviation from training rows only, protect constant columns from division by zero, transform training and test with those stored values, and reuse the same parameters during inference.

### Q4. How would you implement linear regression with gradient descent?

Initialize weights, compute \(\hat y=Xw+b\), calculate residual-based gradients, update parameters using a learning rate, and monitor loss. Vectorize operations, verify shapes, and compare gradients or output against a trusted small example.

### Q5. How would you implement logistic regression?

Compute logits, stable sigmoid probabilities, binary cross-entropy, gradients \(X^T(p-y)/n\) and the bias mean, then update parameters. Add regularization to weights but normally not the bias.

### Q6. How do you implement sigmoid stably?

Avoid directly evaluating \(e^{-x}\) for very negative \(x\). Use separate formulas for positive and negative inputs or a trusted stable library function. For loss, prefer stable logit-based functions rather than taking logs of rounded probabilities.

### Q7. How do you implement softmax stably?

Subtract the maximum logit along the class axis before exponentiating, then divide by the sum along that same axis. The subtraction does not change softmax probabilities and prevents overflow.

### Q8. How would you implement KNN?

Compute distances from a query to training points, select the \(k\) smallest—using partial selection when possible—and aggregate labels or targets, optionally weighted by distance. Define tie and zero-distance behavior.

### Q9. How would you implement K-means?

Initialize \(k\) centroids, assign each point to its nearest centroid, update centroids to cluster means, and repeat until assignments or centroid movement stabilize. Handle empty clusters and use multiple initializations.

### Q10. How do you compute a confusion matrix from scratch?

Compare true and predicted labels and count the four binary combinations. For multiclass, map labels to indices and increment matrix entry \([y_{true},y_{pred}]\) for each example.

### Q11. How would you compute precision, recall, and F1 safely?

Derive counts from the confusion matrix and define zero-denominator behavior explicitly. Test cases with no predicted positives, no actual positives, all-correct, and all-incorrect predictions.

### Q12. How would you implement k-fold cross-validation?

Create disjoint fold indices, loop over each validation fold, fit a fresh pipeline on all other folds, evaluate on the held-out fold, and aggregate scores. Never reuse a fitted preprocessor or model across folds.

### Q13. What is vectorization, and when might you avoid it?

Vectorization expresses batch operations through arrays and optimized kernels, improving speed and clarity. Avoid creating enormous temporary arrays that exceed memory; use batching, streaming, sparse operations, or compiled loops instead.

### Q14. What common numerical problems should ML code handle?

Overflow in exponentials, \(\log(0)\), division by zero, catastrophic cancellation, ill-conditioned matrices, underflow, NaNs, and inappropriate low precision. Use stable identities, clipping where mathematically justified, decompositions, and diagnostic assertions.

### Q15. How do you debug a shape mismatch?

Write expected shapes next to each variable, inspect them at interfaces, distinguish batch/feature/class axes, check broadcasting, and use tiny examples. Avoid fixing errors with arbitrary reshaping that changes semantic alignment.

### Q16. How do you test an ML implementation?

Test shapes, edge cases, deterministic small examples, invariants such as probabilities summing to one, comparison with a trusted implementation, serialization parity, and—where appropriate—finite-difference gradient checks.

### Q17. What is a finite-difference gradient check?

Approximate a derivative by perturbing a parameter: \([f(\theta+\epsilon)-f(\theta-\epsilon)]/(2\epsilon)\), and compare it with the analytical gradient. Use small models and double precision because the method is expensive and numerically sensitive.

### Q18. What code-quality practices matter in ML?

Clear data contracts, modular transformations, fixed interfaces, input validation, configuration instead of hidden constants, local random generators, logs and metrics, versioned artifacts, and tests for training-serving consistency.

---

## 28. Behavioral and Project-Based Questions

### Q1. What is the STAR method?

- **Situation:** concise context.
- **Task:** your responsibility and success criterion.
- **Action:** specific actions and reasoning, emphasizing your contribution.
- **Result:** measurable outcome and learning.

Spend most of the answer on Action and Result.

### Q2. How should you answer “Tell me about yourself” for an ML role?

Give a short present-past-future narrative: your current technical focus, one or two relevant experiences with outcomes, strengths matching the role, and why this opportunity is the logical next step. Do not recite the entire résumé.

### Q3. How do you answer “Tell me about a challenging ML problem”?

Pick a problem with genuine uncertainty or constraints, explain the decision you owned, show structured diagnosis and collaboration, quantify the outcome, and state what you learned.

### Q4. How do you answer “Tell me about a failure”?

Choose a real failure for which you had responsibility. Explain the mistaken assumption or action without blaming others, the impact, how you corrected it, and a concrete process or behavior that changed afterward.

### Q5. How do you answer a disagreement with a stakeholder?

Explain the shared objective, each side's concern, the data or experiment used to clarify trade-offs, how you communicated uncertainty, and the resulting decision. Show constructive disagreement, not victory over the other person.

### Q6. How do you explain a technical result to a non-technical audience?

Start with the decision and impact, use familiar comparisons, separate known facts from uncertainty, and explain trade-offs in terms of costs and risks. Put algorithm details in supporting material unless they change the decision.

### Q7. How do you prioritize when several ML improvements are possible?

Rank them by expected user/business impact, evidence, effort, risk, dependency, and reversibility. Start with diagnostics and cheap experiments that reduce the greatest uncertainty.

### Q8. How do you handle ambiguous requirements?

Identify the user and decision, write assumptions, propose measurable success criteria, clarify the highest-impact unknowns, and build a small baseline or prototype. Iterate with stakeholders instead of waiting for perfect certainty.

### Q9. How do you answer “Why not use a more complex model?”

Compare incremental quality with interpretability, reliability, data needs, latency, cost, and maintenance. Complexity should be earned through validated improvement that matters to the product.

### Q10. How do you handle an unrealistic deadline?

Clarify the essential outcome, present scope-quality-time trade-offs, propose a safe minimum deliverable and milestones, expose risks early, and document what will be deferred. Never silently sacrifice validation for a high-impact model.

### Q11. How do you respond when a model causes harm or a serious incident?

Prioritize containment and affected users, switch to a safe fallback or rollback, communicate facts and uncertainty, preserve evidence, diagnose root causes across data/model/system/process, and implement monitored corrective actions without blame-shifting.

### Q12. How do you demonstrate ownership?

Show that you identified gaps, aligned people, made and documented decisions, handled unglamorous operational work, followed results after launch, and accepted responsibility for outcomes—not merely that you completed assigned code.

### Q13. How do you answer “What is your biggest weakness?”

Choose a genuine, non-fatal development area, give evidence that you recognize its impact, and describe specific habits and progress. Avoid disguised strengths such as “I work too hard.”

### Q14. How do you answer “Why this role/company?”

Connect specific problems, product context, technical scale, or working style to your experience and desired growth. Explain the contribution you can make; generic praise is not convincing.

### Q15. What should you do if you do not know a technical answer?

State what you know, clarify assumptions, reason from fundamentals, propose how you would verify the uncertain part, and accept hints. Do not fabricate definitions, results, or project experience.

### Q16. How should you answer “What would you do differently?”

Identify a decision that was reasonable with the information available but later proved suboptimal, explain new evidence, and propose a concrete improved approach. This demonstrates learning without rewriting history.

### Q17. How do you show cross-functional collaboration?

Explain how you translated among domain, product, data, and engineering constraints; established shared definitions; resolved interface or ownership gaps; and achieved a measurable joint outcome.

### Q18. What questions should you ask the interviewer?

Ask how ML creates value, how problems are selected, what data and platform constraints exist, how models reach production, how success is measured, where projects commonly fail, and what strong performance in the role looks like after six months.

---

# Final Rapid-Revision Checklist

Before an interview, make sure you can do the following without notes:

- Explain bias versus variance, overfitting versus leakage, and parameters versus hyperparameters.
- Derive metrics from a confusion matrix and select a metric from business costs.
- Compare linear/logistic regression, trees, Random Forest, boosting, KNN, Naive Bayes, and SVM.
- Explain regularization, cross-validation, feature scaling, encoding, imbalance, and threshold selection.
- Compare K-means, hierarchical clustering, DBSCAN, GMM, PCA, t-SNE, and UMAP.
- Explain Bayes' theorem, expectation, variance, confidence intervals, p-values, and common testing errors.
- Explain gradients, gradient descent, backpropagation, initialization, normalization, dropout, and optimizers.
- Calculate convolution output shapes and explain CNN, RNN/LSTM/GRU, attention, and Transformer trade-offs.
- Structure an ML case from business objective through monitoring.
- Defend every important decision and metric in your strongest two projects.
- Implement common metrics and simple algorithms with correct edge-case and leakage handling.
- Prepare at least six adaptable STAR stories: success, failure, conflict, ambiguity, leadership, and tight deadline.

## Suggested Practice Method

For each question:

1. Give a **one-sentence direct answer**.
2. Add the **intuition or mechanism**.
3. State one **assumption or limitation**.
4. Give one **practical example**.
5. For comparison questions, end with **when you would choose each option**.
