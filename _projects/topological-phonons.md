---
title: Topological Phonons
category: Computational physics
summary: >-
  Numerical phonon calculations in Julia reveal that topological band crossings in CdTe
  lead to double arcs in the (110) surface dispersion.
context: Part of my graduate research in the physics Ph.D. program at Boston University.
image: /assets/img/arcs.png
image_alt: Computed (110) surface phonon dispersion of CdTe showing double surface arcs
featured: true
order: 1
math: true
toc: true
redirect_from: /html/projects/topological_phonons.html
---

## Conceptual introduction

Perhaps the primary goal of condensed matter physics is to classify phases of matter.
Historically, the best tool in that pursuit has been symmetry (see Landau's theory of
second-order phase transitions), but more recently topology has emerged as a critical tool
for understanding quantum matter. In particular, topology has proven highly fruitful in
studying crystalline systems, where the theory largely goes by the name *topological band
theory*. A proper introduction requires quite a bit of background and can come from a
variety of perspectives, but the gist is that a topological phase is one that exhibits some
form of topological obstruction (a twist, a hole, etc.) separating it from the vacuum. This
twist or hole is not in real space but in the state space (it is a property of the ground
state), which makes it fairly abstract to fresh eyes.

A central feature of topological phases is that they tend to have unusual surface
properties. Intuitively, since there is a "twist" in the bulk of a topological solid and no
twist in the vacuum outside, there must be some sort of "untwisting" at the surface. The
result is bizarre surface behavior that is highly robust and is said to be *topologically
protected* (at least perturbatively). This was the focus of my research: topological
surface states.

Topological band theory is rich and beautiful, so I would be remiss not to offer a peek
into the theory for the mathematically inclined. Consider this a starting point for anyone
who wants to read more:

- One approach, known as [*topological quantum chemistry*](https://arxiv.org/abs/1709.01935),
  uses graph theory and an unorthodox representation theory of space groups to infer whether
  a band structure has a corresponding real-space description. Here, a topological system is
  one that has no such real-space description and is said to have an *obstructed atomic
  limit*.
- Another, more general approach uses *topological K-theory*
  ([pdf](https://www.math.harvard.edu/media/Krulewski-K-Theoretic-thesis.pdf)), a scheme
  for classifying vector bundles by their topological properties. Here, we use the fact that
  the ground-state configuration of a crystalline system forms a vector bundle over a compact
  momentum space, which is isomorphic to a $$d$$-torus in $$d$$ dimensions.

{% comment %}
TODO: write this section, then remove the comment tags around it.

## Theory of Weyl phonons

{% endcomment %}

## LatticeDynamics.jl

As part of my graduate work studying topological surface phonons, I developed a Julia
package called `LatticeDynamics.jl`. It provides tools for studying crystal phonons by
building interatomic force models and computing their bulk and surface phonon structure.
Surfaces can be studied in both slab and semi-infinite geometries.
