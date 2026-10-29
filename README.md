# jgwillingham.github.io

Personal site, built with [Jekyll](https://jekyllrb.com/) and published by GitHub Pages on every push to `main`.

## Where things live

| To change…                    | Edit                                  |
| ----------------------------- | ------------------------------------- |
| Name, tagline, contact links  | `_config.yml`                         |
| Home page intro               | `index.html`                          |
| Nav links                     | `_data/navigation.yml`                |
| Experience timeline           | `_data/experience.yml`                |
| A project write-up            | `_projects/<name>.md`                 |
| Colors, fonts, spacing        | `assets/css/main.scss` (tokens at top)|

## Adding or publishing a project

Each project is a Markdown file in `_projects/`. The front matter controls the card and page:

```yaml
---
title: Class D Amplifier Build
category: Circuit design
summary: One or two sentences for the card and page caption.
image: /assets/img/class-d-diagram.png   # optional
featured: true      # show on the home page (first 3 by `order`)
order: 2            # position in the grid
math: true          # load MathJax on this page
toc: true           # "On this page" list built from ## headings
published: false    # unfinished: hidden from the site until set to true
---
```

Math uses `$$ ... $$` (inline inside a sentence, display on its own line).

## Running locally

1. Install Ruby with DevKit from <https://rubyinstaller.org/> (Windows).
2. `bundle install`
3. `bundle exec jekyll serve`, then open <http://localhost:4000>.

Add `--unpublished` to the serve command to preview projects that have `published: false`.
