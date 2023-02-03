# Collatz Conjecture

## In testing

- v0.06

## In consideration

- [x] Emergency upgrade that opens after c hits cap
  - Only increments, no decrements (does it benefit negative runs?)
  - [ ] Deducts 2 levels of c every time it's bought
    - Currently only deducts 1 for leniency
  - Can make players more impatient
- [x] Nerf exp to 4.72 or 4.92? Also remove division
- From d4N:
  - Make a Collatz Conjurator/Conjoiner that makes decision trees or sequences
- [ ] Buff c2 base to 3.01? Compensate by nerfing pub exp
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
