---
title: Class D Amplifier Build
category: Circuit design
summary: >-
  By abandoning linear operation, class D amplifiers attain high power efficiency without
  sacrificing fidelity. Here I design, simulate and build a full-bridge, closed-loop class D amplifier.
image: /assets/img/class-d-diagram.png
image_alt: Block diagram of a full-bridge, closed-loop class D amplifier
featured: true
order: 2
toc: true
published: true   # set to true once written
redirect_from: /html/projects/class_d_amplifier.html
---

## Background

Around 2017, I built a class AB amplifier based on the LM3886 chip. The project was a "Gainclone" which is a design that mimics an amp that came out in 1999 called the Gaincard. The Gaincard sold for thousands but its components could be purchased for around $100, so naturally it inspired a large DIY community. Consequently, there are countless resources online to help someone build a Gainclone. That project laid the groundwork for me to understand amp design, and I decided in 2023ish that I wanted to try my hand at something a bit more involved. I wanted to build a class D amp.

Class D amplifiers work in a wholly different way than most amps. They are actually nonlinear, operating by encoding the audio signal in a modulated pulse train (PWM) which drives power FETs to achieve large gain at very high efficiencies. The amplified pulse train is filtered at the output so that the audio band is the only signal that passes through cleanly. It is a very nice design concept and can produce Hi-Fi quality sound, but there are lots of challenges that must be addressed when building one.

## Class D Operation

## Design Overview

## Simulation



