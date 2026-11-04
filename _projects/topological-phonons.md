---
title: Topological Phonons
category: Theoretical physics
summary: >-
  Numerical phonon calculations in Julia reveal that topological band crossings in CdTe
  lead to double arcs in the (110) surface dispersion.
context: Part of my research in the physics Ph.D. program at Boston University.
image: /assets/img/arcs.png
image_alt: Computed (110) surface phonon dispersion of CdTe showing double surface arcs
featured: true
order: 1
math: true
toc: true
redirect_from: /html/projects/topological_phonons.html
---

## Conceptual Introduction

Perhaps the primary goal of condensed matter physics is to classify phases of matter.
Historically, the best tool in that pursuit has been symmetry --- different phases have different symmetries --- but more recently topology has emerged as a critical tool
for understanding quantum matter. In particular, topology has proven highly fruitful in
studying crystalline systems, where the theory largely goes by the name *topological band
theory*. A proper introduction requires quite a bit of background and can come from a
variety of perspectives, but the gist is that a topological phase is one that exhibits some
form of topological obstruction (a twist, a hole, etc.) distinguishing it from the vacuum. This
twist or hole is not in real space but in the state space, which makes it fairly abstract to fresh eyes.

A central feature of topological phases is that they tend to have unusual surface
properties. Intuitively, since there is a "twist" in the bulk of a topological solid and no
twist in the vacuum outside, there must be some sort of "untwisting" at the surface. The
result is bizarre surface behavior that is highly robust and is said to be *topologically
protected* (at least perturbatively). This was the focus of my research: topological
surface states.

Topological band theory is rich and beautiful, so I would be remiss not to offer a peek
into the deeper theory for the mathematically inclined. Consider this a starting point for anyone
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

## Topology in Periodic Systems

### The Bloch Bundle

Crystals are highly symmetric arrangements of atoms. They consist of some small set of atoms which form a basis/motif which is then repeated through space along a lattice. So then, the lattice consists of a discrete set of points which have identical surroundings in the crystal. It is defined in $$d$$-dimensions by $$d$$ primitive lattice vectors $$a_1 \dots a_d$$ and all integer linear combinations of them:

$$ \Lambda = \{ n_1a_1 + \dots + n_da_d \quad |\quad n_i\in\mathbb{Z} \} $$

$$\Lambda$$ captures the full translation symmetry of the crystal. So then, when we are doing physics and trying to compute the excitation spectrum of a crystalline system, this symmetry will be essential. The spectrum is computed through an eigenvalue problem $$ A\psi = \omega\psi $$ where the operator $$A$$ respects all the crystal symmetries, most notably the discrete translation symmetry of the lattice. Consequently $$A$$ commutes with a translation operator and the two are simultaneously diagonalizable. Or in more symmetry-oriented language, the eigenspaces of $$A$$ are translation invariant and split into 1D irreducible representations such that

$$ \psi_{nk}(x-R) = e^{-ik\cdot R}\psi_{nk}(x) $$

for any lattice vector $$R\in\Lambda$$. Note that $$n$$ here indexes degrees of freedom within the unit cell. Also observe that this translation rule is defined in terms of a wavevector $$k$$ which only uniquely determines the transformation properties up to another wavevector $$G$$ such that $$ G\cdot R \in 2\pi\mathbb{Z} $$. Indeed, for such a $$G$$ we clearly have $$ \psi_{n,k+G}(x-R)=e^{-ik\cdot R}\psi_{n,k+G}(x) $$ and therefore states with $$k$$ and $$k+G$$ have identical translation properties. The set of all such $$G$$ defines the **reciprocal lattice** $$\Lambda^\star$$ in $$k$$-space (which is in fact just the Fourier transform of $$\Lambda $$)

$$ \Lambda^\star = \{ G \in \mathbb{R}^d \quad |\quad G\cdot R \in 2\pi\mathbb{Z} \text{  for all  } R\in\Lambda\}$$

The equivalence relation $$ k \sim k+G$$ then tells us that the wavevector lives actually in the compact space known as the **Brillouin zone**

$$ k\in \mathbb{R}^d/\Lambda^\star $$

The Brillouin zone in $$d$$-dimensions is homeomorphic to the $$d$$-torus since it is essentially a cube with periodic boundary conditions. In 2D, this is neatly visualized as shown below.

{% include viz.html src="/assets/viz/1-brillouin-zone-torus.html" title="Brillouin zone as a torus" caption="Wavevectors differing by a reciprocal lattice vector are identified, so opposite edges of the Brillouin zone glue together into a torus (shown in 2D)." %}

So what have we determined so far? Well, we have taken an eigenvalue problem with discrete translation symmetry and found that its eigenspaces can be separated by how they transform under translations --- namely by a phase determined by $$k\in\mathbb{R}^d/\Lambda^\star$$. Therefore, there is an eigenspace for every point in the Brillouin zone. By considering the space spanned by the eigenvectors over each point, we obtain a mathematical object called a vector bundle --- called the **Bloch bundle** in this context. The topological properties we will discuss concern the topology of vector bundles. 

{% include viz.html src="/assets/viz/bloch-bundle-torus.html" title="The Bloch bundle" caption="The Bloch bundle: the Brillouin-zone torus is the base space, and over each wavevector sits the space of eigenstates (the fiber), drawn here as an arrow." height=380 %}

### Topological Invariants From Curvature

To understand how we find topologically nontrivial features on the Bloch bundle, consider how our states change as we move along a path in $$k$$-space. Focusing on a single isolated band, we may take interest in how nearby states are smoothly related. Consider an eigenstate over $$k$$ and its overlap with the state at $$k+dk$$. At first order, the only difference is a phase factor given by 

$$ \mathcal{A} = i\bra{\psi}d\psi\rangle $$

where we have defined the 1-form $$\ket{d\psi} = \ket{\partial_{k_i}\psi}dk_i$$. This is known as the **Berry connection** and it indeed can be thought of as differential phase accumulation as we move through $$k$$-space. In fact, we can integrate the Berry connection over a path through the Brillouin zone to find an accumulated geometric phase $$ \phi = \int_\gamma \mathcal{A} $$. However, the Berry connection is not $$U(1)$$ gauge invariant so this phase is unphysical. That is to say, when we apply a gauge transformation on the Bloch bundle $$ \ket{\psi_k}\mapsto e^{i\phi(k)}\ket{\psi_k} $$, the Berry connection transforms as $$ \mathcal{A}\mapsto \mathcal{A} - d\phi $$. So the $$d\phi$$ term can contribute some gauge-dependent phase which is unphysical **unless** we travel along a closed loop. With a closed loop, the phase $$\phi= \oint \mathcal{A}$$ loses the gauge-dependent term and we obtain a real physically measurable quantity. Integrating over a loop $$\partial\Sigma$$ which is also the oriented boundary of some open surface $$\Sigma$$, we can write via Stokes' theorem:

$$ \phi = \oint_{\partial\Sigma} \mathcal{A} = \int_\Sigma \mathcal{F} $$

Here we have implicitly defined the **Berry curvature**

$$ \mathcal{F} = d\mathcal{A} $$

which, in coordinates, is $$ \mathcal{F}=i\bra{\partial_{k_i}\psi}\partial_{k_j}\psi\rangle\;dk_i\wedge dk_j $$. Now, the choice of $$\Sigma$$ was fairly arbitrary --- we need only choose a surface with oriented boundary given by our closed path. This means we can consider a complementary surface $$\Sigma^c$$ which shares the same boundary such that $$\Sigma \cup \Sigma^c$$ is closed. Integrating over either $$\Sigma$$ or $$\Sigma^c$$, we must get the same phase (up to a factor of $$2\pi$$). So $$ \int_\Sigma \mathcal{F} - \int_{\Sigma^c}\mathcal{F} = 2\pi \mathcal{C}  $$ for some integer $$\mathcal{C}$$. For $$\Sigma \cup \Sigma^c$$ to be closed and share the same oriented boundary, they must
be oppositely oriented. So with an orientation-aligning sign change, the difference becomes a sum and is simply equal to the integral over the
closed surface $$\Sigma\cup\Sigma^c $$. With this, we obtain

$$ \mathcal{C} = \frac{1}{2\pi}\oint \mathcal{F}  $$

where $$\mathcal{C}$$ is called the **Chern number**. But why should this ever be nonzero? Suppose we could choose a single smooth gauge over the whole closed surface $$M = \Sigma\cup\Sigma^c$$, so that $$\mathcal{A}$$ is well-defined everywhere on it. Then Stokes' theorem gives $$ \oint_M \mathcal{F} = \oint_M d\mathcal{A} = \int_{\partial M}\mathcal{A} = 0 $$, since a closed surface has no boundary. So a nonzero Chern number means no such gauge exists: we can define $$\mathcal{A}$$ smoothly on patches like $$\Sigma$$ and $$\Sigma^c$$, but the patches cannot be stitched together without a phase twist along their shared boundary. In the language of differential forms, the Berry curvature is gauge invariant and globally well-defined, and it is always closed ($$d\mathcal{F}=0$$), but it is only *locally* exact. Its failure to be globally exact is a topological obstruction --- the bundle is twisted, and no smooth deformation can untwist it without closing the band gap.

To reiterate and emphasize: we have found a way to calculate a topological invariant known as the Chern number by integrating the Berry curvature over a closed surface in the Brillouin zone. 


## Two-Band Model in 2D

To better understand the Chern number, it is highly illustrative to consider a generic two-band model in 2D. The Hamiltonian has the general form

$$H = h(k)\cdot \sigma $$

where $$\sigma=(\sigma_1\:\sigma_2\:\sigma_3)$$ are the Pauli matrices and $$h:\mathbb{R}^2/\Lambda^\star \to \mathbb{R}^3$$ is a function governing the Hamiltonian over the 2D Brillouin zone. It is easy to find that this model has spectrum given by $$ \varepsilon_\pm = \pm \|h(k)\| $$ and consequently, the eigenvalue equation can be written as $$ \hat{h}(k)\cdot\sigma\ket{\psi_\pm}=\pm\ket{\psi_\pm} $$ where the hat indicates the unit vector $$\hat{h}=h/\|h\|$$. Crucially, this means that the eigenstates are parameterized by the unit sphere, depending on only the angles $$\theta,\varphi$$ on the Bloch sphere. It is perhaps not too surprising then that the Berry curvature of the lower band takes a simple form so that the Chern number is computed as

$$ \mathcal{C} = \frac{1}{4\pi} \int_\text{BZ} \sin\theta_k \;d\theta_k\wedge d\varphi_k $$

This integral is over the full Brillouin zone (BZ), but is in a form that is evidently related to the total solid angle swept out by $$\hat{h}$$. This leads us to a very nice interpretation of the Chern number --- it is a winding number! It tells us how many times the Bloch sphere is covered by our state as it moves through the full Brillouin zone.



{% include viz.html src="/assets/viz/2-bloch-bundle.html" title="The Bloch bundle and its Chern number" caption="Eigenstates of a two-band model over the Brillouin-zone torus and their image on the Bloch sphere. When the states wrap the whole sphere, the bundle is twisted and the Chern number is nonzero." %}



## Weyl Points in 3D

Now, with the essentials of topological band theory largely in place, we can talk about the kind of topology relevant to my research at BU. I was interested in crystalline systems which have Weyl points. A Weyl point is a uniquely 3D type of band crossing described by the two-band Hamiltonian

$$ H(k) = k\cdot \sigma  $$

This can easily be solved to find the spectrum $$\varepsilon_\pm = \pm\|k\|$$. So then, there is a degeneracy at $$k=0$$ and the system is gapped everywhere else in $$k$$-space. That degeneracy (band crossing) will turn out to be a source of Berry curvature and will act as a topological charge yielding a non-zero Chern number on any closed surface containing $$k=0$$.

{% include viz.html src="/assets/viz/3-weyl-points.html" title="Weyl points as Berry curvature monopoles" caption="Two Weyl points of opposite chirality, at kx = ±1 in the model h(k) = ((kx² − 1)/2, ky, kz), act as a source and a sink of Berry curvature. Move and resize the sphere: its Chern number counts the net Weyl charge it encloses." height=520 %}




## Surface Phonons

To study surface phonon modes and dispersion, there are two popular methods: slab and surface Green's function. The slab method is simple. Just truncate your crystal so it is infinite in 2-dimensions but finite in the third. A large slab matrix can be assembled and exactly diagonalized to obtain the normal modes at the surface. I used the slab method in my research, but eventually found that the surface Green's function is better suited to research in topological phases where very specific energies need to be examined. 

In the surface Green's function, we consider a semi-infinite geometry rather than a slab. In other words, we consider a surface with an infinite bulk beneath it. Then to obtain the surface spectrum, we use the resolvent and a renormalization-decimation algorithm. The resolvent is simply an operator defined by $$ G(z)=(z-H)^{-1} $$. From it, we can obtain the full spectrum of the system by computing the spectral function

$$ \rho(\omega) = -\frac{1}{\pi} \lim_{\eta\to 0^+}\text{Im}\text{ tr}G(\omega+i\eta) $$

Indeed, writing the trace out as a sum over eigenvalues, it is straight forward to derive that the spectral function is exactly $$ \rho(\omega) = \sum_\lambda g_\lambda \delta(\omega - \lambda) $$. So it has a delta function peak at every eigenvalue and is zero elsewhere --- perfect for finding the spectrum.

The essential idea of the surface Green's function method is that we may write the semi-infinite Hamiltonian in the block tridiagonal form

$$ H = \begin{pmatrix}
H_s & V^\dagger & & & & & \\
V & H_\text{bulk} & V^\dagger & & & & \\
 & V & H_\text{bulk} & V^\dagger & & & \\
 & & V & \ddots & & & 
\end{pmatrix} $$

{% include viz.html src="/assets/viz/4-decimation.html" title="Renormalization decimation" caption="Decimation for the edge of the two-band Chern insulator from earlier. Each row of the lattice is a layer, with momentum k∥ along the surface conserved. Each iteration eliminates every other remaining row and folds its effect into renormalized blocks, so after n steps the result is exactly the edge spectrum of a 2ⁿ-row ribbon. The coupling collapses faster than exponentially, and the converged surface spectral function shows a chiral edge state crossing the bulk gap whenever the Chern number is nonzero." height=720 %}








## LatticeDynamics.jl

As part of my graduate work studying topological surface phonons, I developed a Julia
package called `LatticeDynamics.jl`. It provides tools for studying crystal phonons by
building interatomic force models and computing their bulk and surface phonon structure.
Surfaces can be studied in both slab and semi-infinite geometries.
