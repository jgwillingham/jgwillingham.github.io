---
title: Monte Carlo Risk Evaluation with Copulas
category: Statistical Modeling
summary: Modeling correlated stock prices with copulas for Monte Carlo risk estimation
context: A personal project on modeling correlated stock prices and simulating portfolio risk
image: /assets/img/risky/payoff-evolution.png
image_alt: Time evolution of the distribution of simulated portfolio payoffs
order: 3
math: true
featured: true
toc: true
published: true   # set to true once written
redirect_from: /html/projects/risk_evaluation.html
---

## Background - Monte Carlo Risk Estimation

Suppose you hold a portfolio of stocks and options and want to know how badly things could go over the next month. The standard way to put a number on this is **value-at-risk** (VaR). For some small probability $$\alpha$$ (typically 5% or 1%), VaR is the return $$R_\alpha$$ such that

$$ P(\text{return} < R_\alpha) = \alpha $$

So VaR is nothing more than the $$\alpha$$-quantile of the distribution of portfolio returns. The catch is that we do not know that distribution. The portfolio return is a nonlinear function (options!) of many correlated asset prices, so even with a tidy model for each asset there is rarely a closed form for the portfolio as a whole.

Monte Carlo sidesteps this entirely. The recipe is:

- Pick a stochastic model for the joint evolution of asset prices
- Calibrate it to historical data
- Simulate a large ensemble of possible futures
- Evaluate the portfolio payoff in each one
- Read the quantile off the resulting histogram

The whole thing lives or dies on the first step, and in particular on how the model handles **dependence** between assets. The textbook choice is geometric Brownian motion (GBM), where the log returns are jointly normal with some mean vector and covariance matrix. It is trivial to calibrate (a mean and a covariance) and trivial to sample (a Cholesky factor times a vector of standard normals). But it bakes in two assumptions that are both famously wrong for real markets: the marginals are Gaussian (real returns have fat tails) and the dependence is linear (real assets crash *together* far more than they rally together). What we would really like is to model the shape of each asset's return distribution and the dependence between assets separately. This is exactly what copulas let us do.

## Copula-Based Modeling

A copula is a joint distribution on the unit cube $$[0,1]^N$$ whose marginals are all uniform. The reason this is useful is **Sklar's theorem**: any joint CDF $$F$$ with marginals $$F_1,\dots,F_N$$ can be written as

$$ F(x_1,\dots,x_N) = C\big(F_1(x_1),\dots,F_N(x_N)\big) $$

for some copula $$C$$, which is unique when the marginals are continuous. In other words, the joint distribution factors into the marginals (what each asset does on its own) and the copula (how they move together), and each piece can be modeled however we like.

For the marginals I used the empirical CDF of each asset's historical log returns --- no distributional assumption at all, fat tails included for free. For the copula there are two options:

- **Gaussian copula**: the dependence structure of a multivariate normal with its marginals thrown away. Calibration is a probit transform of the pseudo-observations $$u_i=F_i(x_i)$$ followed by an ordinary correlation matrix, $$z_i = \Phi^{-1}(u_i)$$ and $$\rho = \text{corr}(z)$$.
- **Student's t copula**: same idea but from a multivariate t distribution with $$\nu$$ degrees of freedom. Its signature feature is *tail dependence* --- joint extreme moves are much more likely than under the Gaussian copula, increasingly so for small $$\nu$$. Here the correlation matrix is estimated robustly from Kendall's $$\tau$$ via $$\rho_{ij}=\sin(\pi\tau_{ij}/2)$$, a relation which holds for the whole elliptical family.

Simulating a price path is then a short loop. Sample a correlated vector from the copula (correlated normals pushed through $$\Phi$$, or multivariate t samples pushed through the t CDF) to get uniforms $$u$$. Push each $$u_i$$ through the inverse empirical CDF $$F_i^{-1}$$ to get a log return. Cumulatively sum and exponentiate to get prices. The marginals come out looking exactly like history and the dependence comes out looking like whichever copula you picked.

## risky

`risky` is the Python package I wrote to do all of the above. It is unpublished and, frankly, unfinished, but the core pipeline works end to end and is organized into three pieces matching the recipe.

**Models.** `GBM`, `GaussianCopula`, and `TCopula` share one interface inherited from an abstract base class: hand it a dataframe of historical prices, call `calibrate`, then call `run_simulation` with a number of steps into the future and an ensemble size. Output is written to an HDF5 file alongside the historical data, since ten thousand paths for a handful of tickers is big enough that keeping it all in RAM gets annoying.

**Portfolios.** `Stock`, `Call`, and `Put` objects each know their own payoff as a function of the underlying price (short positions are just negative share counts). A `Portfolio` is a list of positions and its payoff is the sum.

**Analysis.** The `Analysis` class opens a simulation file and reads from it lazily. It can plot individual paths or the whole ensemble against the historical data, plot the distribution of prices at any future time step, and build a kernel density estimate of the portfolio's payoff distribution. VaR is then found by root-finding on the CDF of that estimate. All the plotting is done with [Bokeh](https://bokeh.org/) because I wanted everything to be interactive. The figure at the top of the page is the main output: the projected payoff distribution for a portfolio with the worst $$\alpha$$ tail shaded red. The next section walks through how it was made.

I also started a Bokeh server app for exploring simulations in the browser without writing any code --- load a simulation file, get a summary in a sidebar, then poke through tabs for log-return distributions, stationarity checks, and so on. The scaffolding (layout, file input, summary panel) is there but the tabs are empty. It is on the long list of things I would like to come back to.

The code is at [github.com/jgwillingham/risky](https://github.com/jgwillingham/risky).

## Use Case - A Five-Stock Portfolio

To show the whole pipeline in action, here is a small end-to-end analysis. I pulled two years of daily closing prices (November 2023 through October 2025, 502 trading days) for five stocks: three from tech (AAPL, MSFT, NVDA) and two from elsewhere (XOM in energy, JPM in banking). The point of mixing sectors is to have some assets which move together and some which mostly do not.

### Calibration

A quick look at the historical log returns already tells us GBM is going to struggle. Every one of these stocks has daily returns with excess kurtosis well above zero --- AAPL and JPM are above 10, where a Gaussian would give exactly 0 --- so the tails are far fatter than a normal distribution allows. The copula models take care of this automatically since their marginals are empirical.

The calibrated copula correlations are about what you would guess. MSFT and NVDA are the most strongly coupled pair at 0.57, AAPL sits at 0.3-0.4 with the other two tech names, JPM is weakly correlated with everything at roughly 0.3, and XOM is essentially uncorrelated with tech. But the correlation matrix is only part of the story, and the scatter plot below is the most convincing picture I have of why.

{% include figure.html src="/assets/img/risky/dependence.png" alt="Scatter plots of MSFT vs NVDA daily log returns: historical data and simulated data from GBM, the Gaussian copula, and the t copula" caption="One day of log returns, MSFT vs. NVDA: two years of history on the left and 1,500 simulated days from each model to the right. All three models agree on the correlation coefficient but disagree completely about the tails." %}

GBM produces a tidy ellipse. The Gaussian copula has the right fat marginals, but its extremes stick out along the axes --- one stock has a wild day while the other does nothing. Only the t copula puts points in the corners, where both stocks have a huge move on the same day, which is exactly what the real data does.

### Simulation

I used the t copula with $$\nu=4$$ degrees of freedom, simulated 60 trading days (roughly one quarter) ahead, and ran 10,000 iterations. This takes about ten seconds on a laptop.

```python
import risky as rk

model = rk.TCopula(4)
model.add_historical(prices)     # dataframe of daily closes, one column per ticker
model.calibrate()
filepath = model.run_simulation(60, 10_000)
```

{% include figure.html src="/assets/img/risky/sim-path.png" alt="Two years of historical prices for five stocks followed by one simulated 60-day path" caption="A single simulated path (faded) continuing the historical data. In this particular draw NVDA roughly doubles in a quarter, which is about a three-sigma event under this model and the sort of thing fat tails produce now and then." %}

{% include figure.html src="/assets/img/risky/sim-all.png" alt="Historical prices followed by 300 simulated paths fanning out over 60 days" caption="300 of the 10,000 simulated paths. The ensemble fans out like the square root of time, as it should." %}

{% include figure.html src="/assets/img/risky/price-distributions.png" alt="Histograms and kernel density estimates of each stock's simulated price after 60 trading days" caption="Price distributions after 60 trading days. The histograms use Freedman-Diaconis binning and the curves are kernel density estimates. NVDA is the widest and most right-skewed, XOM the tightest." %}

### The Portfolio

The portfolio is deliberately a bit of a mess so that the payoff function is genuinely nonlinear:

- Long 20 AAPL, 10 MSFT, 45 XOM, and 16 JPM (about $20,400 in total)
- Short 25 NVDA (about $5,000)
- A call on 25 shares of NVDA at a $220 strike ($5 premium), which caps the loss on the short
- A put on 45 shares of XOM at a $100 strike ($1 premium), which protects the XOM position

```python
positions = [rk.Stock('AAPL', 20, 269.37),
             rk.Stock('MSFT', 10, 513.58),
             rk.Stock('NVDA', -25, 202.01),
             rk.Stock('XOM', 45, 111.14),
             rk.Stock('JPM', 16, 305.24),
             rk.Call(rk.Stock('NVDA', 25), 220.0, 5.0),
             rk.Put(rk.Stock('XOM', 45), 100.0, 1.0)]
pf = rk.Portfolio(positions)

analysis = rk.Analysis(filepath)
analysis.payoff_histogram(pf, 59)                  # the figure at the top of the page
VaR = analysis.value_at_risk(pf, 59, alpha=0.05)   # -1497.68
```

{% include figure.html src="/assets/img/risky/payoff-var.png" alt="Histogram and density estimate of the portfolio payoff after 60 trading days with the worst 5 percent shaded dark red" caption="Distribution of the portfolio payoff after 60 trading days under the t copula model. Red is a loss and dark red is the worst 5% of outcomes." %}

So after one quarter, the expected payoff is about +$800, roughly 30% of outcomes are a loss, and in the worst 5% of cases the loss is at least $1,500. Pushing to the 99% level, the loss is at least $2,400.

A word of honesty about that positive drift. These models inherit the mean log return from the calibration window, and the two years I used were an extremely good stretch for tech (NVDA went up nearly fivefold). So the positive expected payoff is partly baked in by the choice of window, and the short NVDA position would look rather different calibrated to a different period. This is a real limitation of calibrating to a short history, and it is why the quantity to pay attention to is the width and shape of the distribution rather than its center.

### Does the Copula Matter?

Since all three models share one interface, it costs nothing to push the same portfolio through GBM and the Gaussian copula calibrated to the same data.

| Model | Mean payoff | 95% VaR | 99% VaR |
|---|---|---|---|
| GBM | $1,008 | $1,583 | $2,486 |
| Gaussian copula | $526 | $1,992 | $2,928 |
| t copula ($$\nu=4$$) | $817 | $1,498 | $2,364 |

{% include figure.html src="/assets/img/risky/payoff-by-model.png" alt="Kernel density estimates of the portfolio payoff after 60 days under GBM, the Gaussian copula, and the t copula" caption="Payoff distributions after 60 trading days for all three models. Dashed lines mark the 95% VaR of each." %}

{% include figure.html src="/assets/img/risky/payoff-tail-by-model.png" alt="Zoomed view of the loss tail of the payoff distribution for the three models" caption="Zooming in on the loss tail. The Gaussian copula puts noticeably more weight on large losses than the other two." %}

The model choice moves VaR by about 25%, which is not nothing. What I did not expect was the ordering: the Gaussian copula is the most pessimistic and the t copula the least. My read is that this is the hedges at work. The short NVDA position partially offsets the long AAPL and MSFT positions, so the scenario that really hurts is one where a single long name drops *without* the others moving. That is precisely what the Gaussian copula produces (fat marginals with no tail dependence), whereas under the t copula a tech selloff drags NVDA down too and the short pays for the losses elsewhere. GBM lands in the middle because its thin marginals rarely produce a large single-name move in the first place. So tail dependence cuts both ways: it is dangerous for a portfolio that is long everything and helpful for one that is hedged. Either way it is not something you get to ignore, and the fact that a one-line model swap changes the answer this much is the whole argument for building the package around a common interface.

### Watching the Risk Evolve

Nothing restricts us to the final time step. The analysis object can build the payoff distribution at every step of the simulation, so we can watch the risk accumulate over the quarter.

{% include figure.html src="/assets/img/risky/expected-payoff.png" alt="Mean payoff, interquartile range, and 95 percent VaR of the portfolio as a function of trading days ahead" caption="Mean payoff (black), interquartile range (grey), and 95% VaR (dashed red) as a function of time under the t copula model." %}

{% include figure.html src="/assets/img/risky/payoff-evolution.png" alt="Heatmap of the portfolio payoff distribution at every time step with mean and VaR curves overlaid" caption="The full payoff distribution at every time step, with each column normalised to its own peak so that later times stay visible. The mean drifts upward while the VaR curve flattens out." %}

The mean drifts upward linearly, as it must, while the spread grows like $$\sqrt{t}$$. The interesting feature is the VaR curve flattening out near $$-\$1{,}500$$ in the second half of the quarter. Part of this is simply the drift catching up with the $$\sqrt{t}$$ growth of the spread, but part of it is the two options putting a floor under the hedged positions: the XOM put kicks in about 10% below the current price and the NVDA call caps the short about 9% above it.

The whole exercise --- downloading the data, calibrating three models, simulating, building the portfolio, and producing every plot in this section --- is about a hundred lines of Python on top of `risky`.
