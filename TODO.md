# Collatz Conjecture

## In consideration

- Ask Gilles:
  - [ ] Make a bonus levels function like perma levels from stars
- Better to defer these to when XLII comes online to sim
  - [ ] Nerf initial pub mult?
  - [ ] From 0 to e44 is the tutorial. The players must both learn about running
  - quickly (early) and running deep (before e44).
  - [ ] Nerf level caps to 24/36/48/64
    - Rescale marathon achievement
  - [ ] Move 3rd ms to 176 but move extra increments forward
  - [ ] Change step length of penalty to 6
- From d4N:
  - Make a Collatz Conjurator/Conjoiner that makes decision trees or sequences
  -  Make runs less monotonous
- Make pub exponent go down gradually like `y=(10/log(x+1)+6.22)`?
  - This is to make early game more lenient
  - Disproven: early game is very normal at 5.22
  - Counter: make pub exponent go up gradually to 5.22
    - This is to make early game players not delusional about pub multipliers
- From pietro:
  - Save some levels for the next pub if not used up in current one
    - Solves the problem of players being confused by c level
    - But also trivialises the game by allowing you to farm massive amounts of
    levels

## 0.06

- [x] History shows number of turns between nudges
- [x] Determine metrics for:
  - [x] History book icon (24)
  - [x] History menu buttons (44)
  - [x] History pub labels (24)
- [x] Rename c1c2 to q1q2 for distinction from c
- [x] Emergency upgrade that opens after c hits cap
  - Only increments, no decrements (does it benefit negative runs?)
  - [x] Deducts 2+ levels of c every time it's bought
  - Can make players more impatient
  - [x] Make it a perma upgrade
- [x] Nerf exp to 4.72 or 4.92? Also remove division
- [x] Buff c2 base to ~~3.01~~ 3? Compensate by nerfing pub exp

## 0.05

- Show this run's level count in 3rd eq: `l_c=0/24`
  - [x] Alternatively, show on ~~bottom right~~ or under history: `0/24`
  - History unlocks after first perma
- [x] Add 4th number mode that makes binary numbers in sci notation (lol)
  - Two toggles that flip bit flags: base and notation
  - Something funny like `1.01e369` (max 8 chars)

## 0.04

- [x] History numbering mode: either full level or level offset
  - [x] Binary display?
- [x] Turn ~~freeze and~~ history into icons
- [x] Buff c1
- [x] Solve the problem of being stuck
  - From Gen:
    > possible solutions:
    > 1. add Refunds (interferes with autobuy, doesn't work)
    > 2. + term that holds 30%+ power so that a mess up only slows down and can be recovered
    > 3. Figure out why it happens in detail and find a buying mechanism/eq that limits the max stuckness (is that a word?) to a reasonable amount
  - [x] Scrap preserve, instead add a milestone to give a bonus based on c level
    - This will have the same implication where you'll be grinding it out, it's
    just gonna grow slower than preserve
      - Nerf c1 exp to 0.03
      - Nerf pub exp to 5.22
  - [x] How about implementing a history of last run's sequence?
    - Do I want to make players recite a manuscript?
  - [ ] Regular variable with cost growth that refills c, and unfreezes?

## 0.03

- [x] Interval milestone also increases level cap
- [x] Buff c2 by reduce 1/2 of cost growth
