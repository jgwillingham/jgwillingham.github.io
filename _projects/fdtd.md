---
title: FDTD on a GPU
category: Computational Physics
summary: >-
  Finite-Difference Time Domain (FDTD) solves Maxwell's equations by leapfrogging spacetime-staggered electric and magnetic fields. Here I write a GPU-accelerated solver using PyTorch
context: Developing a GPU-accelerated numerical electrodynamics solver
image: /assets/img/yee_algorithm.png
image_alt: Leapfrogging in the Yee algorithm
featured: true
math: true
order: 2
toc: true
published: true   # set to true once written
---

## Review of FDTD

**Finite-Difference Time Domain** (FDTD) is a technique for numerically solving PDEs in computational electromagnetics. The central equations to solve are the dynamic Maxwell's equations, Faraday's law and Ampere's law:

$$\nabla\times E = -\mu\frac{\partial H}{\partial t} $$

$$\nabla\times H = j + \varepsilon\frac{\partial E}{\partial t}$$

The essential steps of FDTD are known as the **Yee algorithm** and they consist of the following:

- Replace derivatives with central finite differences
- Discretize space and time so that the E and H fields are staggered in space and time
- Evaluate the H-field one time step into the future
- Evaluate the E-field one time step into the future
- Repeat the past 2 steps until the desired duration is captured

The algorithm is straight forward. To get a better feel for it, suppose we replace only the time derivatives with central finite differences. We can then solve for the future fields to write update equations. But in FDTD we do not evaluate both equations at the same time. If we take the central difference in Faraday's law at time $$t$$, then for Ampere's law, the difference is at time $$t+\Delta_t/2$$. The result is

$$ H^{t+\Delta_t/2}\approx H^{t-\Delta_t/2} - \frac{\Delta_t}{\mu}\nabla\times E^t $$

$$ E^{t+\Delta_t} \approx E^t + \frac{\Delta_t}{\varepsilon}\nabla\times H^{t+\Delta_t/2} \:-\:\frac{\Delta_t}{\varepsilon} j^{t+\Delta_t/2}$$

From this form it is evident that if we have the E-field at time $$t$$ and the H-field at time $$t-\Delta_t/2$$, we can calculate $$H^{t+\Delta_t/2}$$ with Faraday's law. Then that value can be used in Ampere's law to compute $$E^{t+\Delta_t}$$. This **leapfrog** procedure can be iterated as many times as needed to evolve the fields forward in time. This is the basic idea of FDTD.


To derive the appropariate update equations which increment the fields in time, we must first put everything on a grid, discretizing space and time. Positions in space will be written $$x=m\Delta_x$$ where $$\Delta_x$$ is the grid spacing and $$m\in\mathbb{Z}^3$$ contains three integers indicating the grid location. Similarly, every time is written $$t=n\Delta_t$$ for some integer $$n$$ and time step $$\Delta_t$$. In this discretized setting, it is convenient to use a more concise notation.

$$ F^n[m] \equiv F(m\Delta_x, n\Delta_t) $$

It will prove useful to use index notation where, for example, the curl of a vector field $$F$$ is written in this notation as $$(\nabla\times F)_i=\epsilon_{ijk}\partial_j F_k$$ where summation over repeated indices is implied and $$\epsilon_{ijk}$$ is the fully antisymmetric tensor. Replacing the partial derivatives with central finite differences, this becomes

$$ (\nabla\times F)_i[m] \approx \epsilon_{ijk}\frac{F_k[m + \hat{j}/2] - F_k[m - \hat{j}/2]}{\Delta_x} $$

where the hat indicates unit vectors in each direction $$\hat{x}=(1\;0\;0)$$, $$\hat{y}=(0\;1\;0)$$ and $$\hat{z}=(0\;0\;1)$$. With the change of notation and the curl expressed this way, the update equation from Faraday's law becomes

$$ H_i^{n+\frac{1}{2}}[m]\approx H_i^{n-\frac{1}{2}}[m]\: -\:\frac{1}{\mu}\frac{\Delta_t}{\Delta_x} \epsilon_{ijk}\bigg[E_k^n[m + \hat{j}/2] - E_k^n[m - \hat{j}/2]\bigg] $$

Observe that the H-field appears in this equation as $$H_i[m]$$, i.e. it is computed at each node $$x=m$$ in the grid. The E-field on the other hand appears on the center of grid edges: $$E_k[m\pm\hat{j}/2]$$. When Ampere's law is written on the grid, the reverse is found --- the E-field appears on each node, $$E_i[m]$$, and the H-field appears on the edges, $$H_k[m\pm\hat{j}/2]$$. Since Faraday's law and Ampere's law are computing fields at different points, this prevents us from being able to directly use the result from one equation in the other. 

To resolve this problem, we must shift where we are computing each field component. The E-field components will be computed along edges of the grid while H-field components will be computed on faces of the grid. This pattern is known as the **Yee cell** or Yee lattice and the resulting update equations are (with $$i,j,k$$ all unequal )

$$ H_i^{n+\frac{1}{2}}[m+(\hat{j} +\hat{k})/2] \:\approx\: H_i^{n-\frac{1}{2}}[m+(\hat{j} +\hat{k})/2] \qquad\qquad\qquad\qquad\qquad\qquad\qquad$$

$$\qquad\qquad\qquad\qquad\qquad-\frac{1}{\mu}\frac{\Delta_t}{\Delta_x} \epsilon_{ijk}\bigg[E_k^n[m + \hat{j} + \hat{k}/2] - E_k^n[m + \hat{k}/2]\bigg] $$
		
$$ E_i^{n+1}[m + \hat{i}/2]\: \approx\: E_i^{n}[m+\hat{i}/2]\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad$$

$$\qquad\qquad\qquad\qquad+\frac{1}{\varepsilon}\frac{\Delta_t}{\Delta_x}\epsilon_{ijk}\bigg[H_k^{n+\frac{1}{2}}[m+(\hat{i}+\hat{j})/2] - H_k^{n+\frac{1}{2}}[m + (\hat{i} -\hat{j})/2]\bigg] $$

$$\;-\frac{\Delta_t}{\varepsilon} j_i^{n+\frac{1}{2}}[m+\hat{i}/2]\qquad\qquad\qquad\qquad\qquad$$

Once we shift to the Yee lattice, the update equations and the rest of FDTD fall out naturally. Taking central finite differences immediately relates H-fields on faces to E-fields on edges and vice versa. But as a consequence of the Yee lattice, not only are the E and H fields defined at different points in time, but all 6 values $$E_x,E_y,E_z,H_x,H_y,H_z$$ are computed at different positions in space too. This means that to compute the full field vector at any single point in spacetime, the results from FDTD must be **interpolated**. 

{% include viz.html src="/assets/viz/fdtd-yee-leapfrog.html" title="Leapfrogging on the Yee grid" caption="A 2D slice of the Yee grid (TMz polarization): Ez lives on the nodes and Hx, Hy on the edge midpoints. Each half step updates one field from the curl of the other, so E is known at whole time steps and H at half steps. The walls are perfect conductors." height=560 %}

## Lossy Media + Conductivity

In electromagnetics, the current density $$j$$ can be treated as either a source term or as an induced current. As a source term, it is known and controlled. As an induced current, it is a priori unknown and must be computed as a consequence of the local fields and material properties. In general we will want to simulate scenarios which both have source terms and induced currents so we will need both. The standard model for induced currents is Ohm's law $$ j = \sigma E $$ where $$  \sigma$$ is the model conductivity tensor. Including this alongside a source current, we have $$ j = j_{src} + \sigma E $$. So then Ampere's law becomes

$$ \nabla\times H = j_{src} + \sigma E + \varepsilon\frac{\partial E}{\partial t}$$

Replacing the time-derivative with a central difference around time $$n+\frac{1}{2}$$ as before, we find an update equation for the E-field which looks like

$$ E^{n+1} \approx E^n  \:-\: \frac{\Delta_t \sigma}{\varepsilon}E^{n+\frac{1}{2}}\;+\; \frac{\Delta_t}{\varepsilon}\bigg[\nabla\times H^{n+\frac{1}{2}} \:-\: j_{src}^{n+\frac{1}{2}} \bigg] $$

This presents a problem. Now there is an E-field term appearing at time $$n+\frac{1}{2}$$ unlike anywhere else in our equations. To force this back into our mold where the E-field is defined at integer times, we can replace $$E^{n+\frac{1}{2}}$$ with an average of the E-fields we do have $$ E^{n+\frac{1}{2}} \approx (E^{n+1} + E^{n})/2 $$. Plugging this back into the update equation, we can rearrange to find

$$ E^{n+1} \approx \left(\frac{1 - \frac{\Delta_t \sigma}{2\varepsilon}}{ 1  + \frac{\Delta_t\sigma}{2\varepsilon}}\right)E^n \;+\;\frac{\Delta_t/\varepsilon}{1  + \frac{\Delta_t\sigma}{2\varepsilon}} \bigg[\nabla\times H^{n+\frac{1}{2}} \:-\:j_{src}^{n+\frac{1}{2}}\bigg]  $$



## Tensor Operations

Keep in mind that in our simulation domain, the conductivity, permittivity, and permeability will all be material dependent (and hence spatially dependent) properties. In memory, they must be stored as tensors just like the field components. 

Looking at the FDTD update equations, we can see that each term in the curl has the generic form 

$$ F^{n+1}_i = F^n_i + \sum_i C_i(G_i - H_i) $$