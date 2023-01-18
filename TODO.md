# Collatz Conjecture

## In consideration

- [ ] Make pub exponent go down gradually like `y=(10/log(x+1)+6.22)`?
  - This is to make early game more lenient
  - Disproven: early game is very normal at 5.62
- [ ] Buff c1?
- [ ] Buff c2 base to 2.2?
- [ ] Determine a good preserve unlocking point
- [ ] From pietro:
  - Save some levels for the next pub if not used up in current one
- [ ] Solve the problem of being stuck
  - From Gen:
    > possible solutions:
    > 1. add Refunds (interferes with autobuy, doesn't work)
    > 2. + term that holds 30%+ power so that a mess up only slows down and can be recovered
    > 3. Figure out why it happens in detail and find a buying mechanism/eq that limits the max stuckness (is that a word?) to a reasonable amount
  - [x] How about implementing a history of last run's sequence?
    - Do I want to make players recite a manuscript?
  - [ ] Regular variable with cost growth that refills c, and unfreezes?

## 0.03

- [x] Interval milestone also increases level cap
- [x] Buff c2 by reduce 1/2 of cost growth
