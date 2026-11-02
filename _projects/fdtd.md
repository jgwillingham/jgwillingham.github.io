---
title: FDTD on a GPU
category: Computational Physics
summary: >-
  Finite-Difference Time Domain (FDTD) solves Maxwell's equations by leapfrogging spacetime-staggered electric and magnetic fields. Here I write a GPU-accelerated solver using PyTorch
context: Developing an FDTD solver and training a PINN
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

The algorithm is straight forward. To get a better feel for it, suppose we replace only the time derivatives with central finite differences. We can then solve for the future fields to write update equations. But in FDTD we do not evaluate both equations at the same time. If we take the central difference in Faraday's law at time $$t$$, for Ampere's law, the difference is at time $$t+\Delta_t/2$$. The result is

$$ H^{t+\Delta_t/2}\approx H^{t-\Delta_t/2} - \frac{\Delta_t}{\mu}\nabla\times E^t $$

$$ E^{t+\Delta_t} \approx E^t + \frac{\Delta_t}{\varepsilon}\nabla\times H^{t+\Delta_t/2} \:-\:\frac{\Delta_t}{\varepsilon} j^{t+\Delta_t/2}$$

From this form it is evident that if we have the E-field at time $$t$$ and the H-field at time $$t-\Delta_t/2$$, we can exactly calculate $$H^{t+\Delta_t/2}$$ with Faraday's law. Then that value can be used in Amp\`ere's law to compute $$E^{t+\Delta_t}$$. This **leapfrog** procedure can be iterated as many times as needed to evolve the fields forward in time. This is the basic idea of FDTD.


### The Yee Cell and Update Equations

To derive the appropariate update equations which increment the fields in time, we must first put everything on a grid, discretizing space and time. Positions in space will be written $$x=m\Delta_x$$ where $$\Delta_x$$ is the grid spacing and $$m\in\mathbb{Z}^3$$ contains three integers indicating the grid location. Similarly, every time is written $$t=n\Delta_t$$ for some integer $$n$$ and time step $$\Delta_t$$. In this discretized setting, it is convenient to use a more concise notation.

$$ F^n[m] \equiv F(m\Delta_x, n\Delta_t) $$

It will prove useful to use index notation where, for example, the curl of a vector field $$F$$ is written in this notation as $$(\nabla\times F)_i=\epsilon_{ijk}\partial_j F_k$$ where summation over repeated indices is implied and $$\epsilon_{ijk}$$ is the fully antisymmetric tensor. Replacing the partial derivatives with central finite differences, this becomes

$$ (\nabla\times F)_i[m] \approx \epsilon_{ijk}\frac{F_k[m + \hat{j}/2] - F_k[m - \hat{j}/2]}{\Delta_x} $$

where the hat indicates unit vectors in each direction $$\hat{x}=(1\;0\;0)$$, $$\hat{y}=(0\;1\;0)$$ and $$\hat{z}=(0\;0\;1)$$. With the change of notation and the curl expressed this way, the update equation from Faraday's law becomes

$$ H_i^{n+\frac{1}{2}}[m]\approx H_i^{n-\frac{1}{2}}[m]\: -\:\frac{1}{\mu}\frac{\Delta_t}{\Delta_x} \epsilon_{ijk}\bigg[E_k^n[m + \hat{j}/2] - E_k^n[m - \hat{j}/2]\bigg] $$

Observe that the H-field appears in this equation as $$H_i[m]$$, i.e. it is computed at each node $$x=m$$ in the grid. The E-field on the other hand appears on the center of grid edges: $$E_k[m\pm\hat{j}/2]$$. When Ampere's law is written on the grid, the reverse is found --- the E-field appears on each node, $$E_i[m]$$, and the H-field appears on the edges, $$H_k[m\pm\hat{j}/2]$$. Since Faraday's law and Ampere's law are computing fields at different points, this prevents us from being able to directly use the result from one equation in the other. 

To resolve this problem, we must shift where we are computing each field component. The E-field components will be computed along edges of the grid while H-field components will be computed on faces of the grid. This pattern is known as the **Yee cell** or Yee lattice and the resulting update equations are:

$$ H_i^{n+\frac{1}{2}}[m+(\hat{j} +\hat{k})/2] \:\approx\: H_i^{n-\frac{1}{2}}[m+(\hat{j} +\hat{k})/2] \qquad\qquad\qquad\qquad\qquad\qquad\qquad$$

$$\qquad\qquad\qquad\qquad\qquad-\frac{1}{\mu}\frac{\Delta_t}{\Delta_x} \epsilon_{ijk}\bigg[E_k^n[m + \hat{j} + \hat{k}/2] - E_k^n[m + \hat{k}/2]\bigg] $$
		
$$ E_i^{n+1}[m + \hat{i}/2]\: \approx\: E_i^{n}[m+\hat{i}/2]\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad$$

$$\qquad\qquad\qquad\qquad+\frac{1}{\varepsilon}\frac{\Delta_t}{\Delta_x}\epsilon_{ijk}\bigg[H_k^{n+\frac{1}{2}}[m+(\hat{i}+\hat{j})/2] - H_k^{n+\frac{1}{2}}[m + (\hat{i} -\hat{j})/2]\bigg] $$

$$\;-\frac{\Delta_t}{\varepsilon} j_i^{n+\frac{1}{2}}[m+\hat{i}/2]\qquad\qquad\qquad\qquad\qquad$$

Once we shift to the Yee lattice, the update equations and the rest of FDTD fall out naturally. Taking central finite differences immediately relates H-fields on faces to E-fields on edges and vice versa. But as a consequence of the Yee lattice, not only are the E and H fields defined at different points in time, but all 6 values $$E_x,E_y,E_z,H_x,H_y,H_z$$ are computed at different positions in space too. This means that to compute the full field vector at any single point in spacetime, the results from FDTD must be **interpolated**.


## Dispersion and Stability

The algorithm as discussed so far is fully valid but there are details that must be touched upon. It seems obvious that as $$\Delta_x$$ and $$\Delta_t$$ tend toward zero, we get a better and better approximation to the true solution.However, what might not be obvious at first is that we cannot (or perhaps should not) treat the step sizes independently. One important consequence of a poor choice of step size is the algorithm can become unstable. This stems from the fact that the Yee lattice is a dispersive medium just by virtue of being discrete. We will prove this now. 
	
As is well known, solutions to Maxwell's equations are also solutions to the wave equation:

$$ \frac{\partial^2 E}{\partial t^2} - c^2\nabla^2E = 0 $$

In continuous spacetime, this can be solved with a plane wave of the form $$E(x,t)=e^{i(k\cdot x- \omega t)}\hat{z}$$. Plugging this into the wave equation yields the classic dispersion(less) relation $$ \omega = c\|k\| $$.Things become a bit different when we move onto the lattice. The wave equation can be replaced with second-order central finite differences so that

$$ \frac{E_z^{n+1}[m] - 2E_z^n[m] + E_z^{n-1}[m]}{\Delta_t^2} = \frac{c^2}{\Delta_x^2}\sum_{i=x,y,z}\left[ E_z^n[m+\hat{i}] - 2E_z^n[m] + E_z^n[m - \hat{i}] \right]$$

And the $$z$$-component of the plane wave becomes

$$ E_z^n[m] = e^{i(k\cdot m\Delta_x - \omega n\Delta_t)} $$

Observe that the discretized plane wave has the following properties. When shifted in time, we get $$ E_z^{n+1}[m] = e^{-i\omega\Delta_t} E_z^n[m]$$ and similarly when shifted in space: $$ E_z^n[m + \hat{x}] = e^{ik_x\Delta_x} E_z^n[m]$$. Just as the continuous wave equation reduces to $$\omega^2=c^2\|k\|^2$$ for a plane wave, these shift identities and a couple trig identities can be used to show that the discrete wave equation reduces to the **lattice dispersion relation**:

$$ \sin^2(\omega\Delta_t) = \frac{c^2\Delta_t^2}{\Delta_x^2} \left[\sin^2(k_x\Delta_x) + \sin^2(k_y\Delta_x) + \sin^2(k_z\Delta_x) \right]$$

Now for stable wave solutions, we must have **real**-valued solutions $$\omega$$ for every $$k_x,k_y,k_z$$ in this equation. But the left side is clearly bounded from above by 1 so if the right exceeds 1, then no real solution $$\omega$$ exists --- we get frequencies with imaginary components leading to exponentially growing/decaying waves. In the maximum case where all the sines on the right are 1, this gives us a stability condition:

$$ \frac{c^2\Delta_t^2}{\Delta_x^2} 3 \leq 1 $$

Defining the **Courant number** $$S\equiv c\Delta_t/\Delta_x$$, this becomes

$$ S\leq \frac{1}{\sqrt{3}} $$