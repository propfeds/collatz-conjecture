# Collatz Conjecture

## In consideration

- Ask Gilles:
  - [ ] Make a bonus levels function like perma levels from stars

- [ ] Issue: extra increments are not interesting currently
  - Because it sets back progress for not much short-term benefit
  - A fun idea to replace it
    - Ideally, it could be a step to work towards creating a more interesting meta that involves using more than 1 sequence over and over again
  - Because once you've found what you love, the theory becomes just q1q2
  - Although, extra increments solve the setback from having to recover from overstaying pub

- [ ] Apply LSR workload technique to history menu

- [ ] Farm rate is weaker than before
  - (55/2) / (72/4) = 1.53
  - [x] For now, change into log2(Ec) / 10 -> 50.7% of rate before
  - Need more testing
  - Currently: 76% (0.12 Eclog with 2, 8 q1)

- [x] q1 turn into (2, 10) stepwise with low cost increment for activeness?
  - 2.09 or just 1.76? divisible by 11 this time
- [x] q2 return to 2^x
  - [x] Also solves the problem of 1st pub being too big
- [x] Add q3 (unlocked with milestone)
  - (!) Consider other changes first like q1 and log10(Ec/r)
  - q3 = 3^lv (+1 with badge)
  - Probably gonna make the milestone compete with q1 exponent
  - Cost starts at e300 to hint at e301 auto?
    - Cost increment smaller than 30.1 to make it interesting
    - But not too small to make it reasonable
    - Is it too late to be that strong?
    - Or unlock it at e120 or sth and nerf pub exp to like 2.2 lol
- [x] Extra levels instead impose penalty by dividing the whole income
  - rho dot = q1q2|Ec|/(2^r), with r being a (2, 4) stepwise (wtf??)
    - Or maybe (2, 6) and buff final cap to 66 (18/30/48/66)
    - Story: You begin attaching random /2s in your sequence in hopes of not being discovered...
  - I'll figure out the best form of punishment later when playtesting
  - This sounds like a legit good level farming method
  - Needs a max level, not too high to be abuseable, not too low to be worthless
- [x] q1 milestone buffs level by log10(Ec) instead of 64
- I'm not even sure?
  - [ ] (?) Add a new level to cap ms: 16/24/36/48/64
    - Interval: 42/36/27/18/12
  - [ ] (?) q1 level farming has diminishing returns?
    - Does get better a bit with exp milestone
    - Theory loses that uniqueness
  - [ ] (?) q1 level farming has limit at the end of story?

- [x] rho dot is influenced by sum of all c values passed through
  - This way it can still stack after it ends, and income stops fluctuating
  - Like t5
  - Makes freeze a bit less useful
  - [ ] Speed vs. depth issue
  - [ ] Balance between pub exp and c farming
  - [ ] UI clogging issue
- From 0 to e44 is the tutorial. The players must both learn about running
- quickly (early) and running deep (before e44).
  - [ ] (?) Nerf initial pub mult to make mod 4 strat impossible near e44

## 0.07

- [x] Auto-nudge button in main screen
- [x] History menu option to enable/disable last pub preservation
- [x] Perma upgrade that automatically copies last history (Weyl Group style)
  - Does not auto-freeze!
  - Reduces activeness and input error
  - Probably set it at e301, else it will inhibit experimentation
  - Tracks the next move
- From d4N:
  - [x] Make a Collatz Conjoiner that makes ~~decision trees~~ sequences
  - [x] Make runs less monotonous

- Pre-sim Era:
  - [x] Move freeze up to 58? as e44 milestone is enough to run for a while
  - [x] Nerf level caps to 24/36/48/64, as current runs are too long
    - Rescale marathon achievement?
  - [x] Move 3rd ms to 176 but move extra increments forward
    - Right now, extra increments seem useless
    - The players must know about how strong the borrow milestone can be?
    - But how are they gonna know if it's worth it if they've been running the
    level cap upgrade all this time?
    - Is blocking their progress enough? Unlocking extra increments would only
    make borrowing worse
    - By the way, extra increments can also be run with borrow instead of cap
  - [x] Change step length of penalty to 6

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

## Scrapped

- Make pub exponent go down gradually like `y=(10/log(x+1)+6.22)`?
  - This is to make early game more lenient
  - Disproven: early game is very normal at 5.22
  - Counter: make pub exponent go up gradually to 5.22
    - This is to make early game players not delusional about pub multipliers
- (From pietro) Save some levels for the next pub if not used up
  - Solves the problem of players being confused by c level
  - But also trivialises the game by allowing you to farm massive amounts of
  levels early on
  - With the q1 milestone, this is useless anyway
