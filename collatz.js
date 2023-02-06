import { BigNumber } from '../api/BigNumber';
import { CompositeCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from '../api/Costs';
import { Localization } from '../api/Localization';
import { Theme } from '../api/Settings';
import { theory } from '../api/Theory';
import { ui } from '../api/ui/UI';
import { Color } from '../api/ui/properties/Color';
import { Utils } from '../api/Utils';
import { LayoutOptions } from '../api/ui/properties/LayoutOptions';
import { ImageSource } from '../api/ui/properties/ImageSource';
import { Aspect } from '../api/ui/properties/Aspect';
import { TouchType } from '../api/ui/properties/TouchType';
import { Thickness } from '../api/ui/properties/Thickness';
import { Easing } from '../api/ui/properties/Easing';
import { ScrollOrientation } from '../api/ui/properties/ScrollOrientation';

var id = 'collatz_conjecture';
var getName = (language) =>
{
    let names =
    {
        en: 'Collatz Conjecture',
    };

    return names[language] || names.en;
}
var getDescription = (language) =>
{
    let descs =
    {
        en:
`A puzzle revolving around nudging a number's value in order to counteract ` +
`the even clause of the Collatz conjecture.

Warning: for spoiler purposes, it is ill-advised to
share your sequences to new players.

'If it's odd, triple it plus one,
If it's even, divide it in two.

If you woke up today and ate bread,
what would you do?'`,
    };

    return descs[language] || descs.en;
}
var authors = 'propfeds#5988\n\nThanks to:\nCipher#9599, for the idea';
var version = 0.06;

let turns = 0;
let time = 0;
let c = 0n;
let cBigNum = BigNumber.from(c);
let totalIncLevel = 0;
let history = {};
let lastHistory;
let lastHistoryLength = 0;
let writeHistory = true;
let historyNumMode = 0;
let historyIdxMode = 0;
let reachedFirstPub = false;
let marathonBadge = false;

let bigNumArray = (array) => array.map(x => BigNumber.from(x));

// All balance parameters are aggregated for ease of access

const borrowFactor = 4;
const q1Cost = new FirstFreeCost(new ExponentialCost(1, 3.01));
const getIncrementPenalty = (level) => Utils.getStepwisePowerSum(level,
2, 4, 0).toNumber();
const getq1BonusLevels = (bl, pl) => Math.max(Math.floor((bl * nudgec.level - 
getIncrementPenalty(pl)) / borrowFactor), 0);
const getq1 = (level) => Utils.getStepwisePowerSum(level + getq1BonusLevels(
q1BorrowMs.level, incrementc.level), 2, 5, 1);

const q1ExpInc = 0.03;
const q1ExpMaxLevel = 4;
const getq1Exponent = (level) => 1 + q1ExpInc * level;

const q2Cost = new ExponentialCost(2.2e7, 11);
const getq2 = (level) => BigNumber.THREE.pow(level) + (marathonBadge ? 1 : 0);

const permaCosts = bigNumArray(['1e12', '1e22', '1e31', '1e54', '1e160']);
const milestoneCost = new CompositeCost(2, new LinearCost(4.4, 4.4),
new CompositeCost(2, new LinearCost(13.2, 8.8), new LinearCost(30.8, 13.2)));

const cLevelCap = [24, 36, 52, 72];
const cooldown = [42, 30, 20, 12];

const tauRate = 0.1;
const pubExp = 4.2;
var getPublicationMultiplier = (tau) => tau.pow(pubExp);
var getPublicationMultiplierFormula = (symbol) => `{${symbol}}^{${pubExp}}`;

var pausec;
var nudgec, q1, q2, incrementc;
var pausePerma, extraIncPerma;
var cooldownMs, q1BorrowMs, q1ExpMs;

var currency;

const locStrings =
{
    en:
    {
        versionName: 'v0.06',
        workInProgress: /*', WIP',*/', Work in\\\\Progress',
        changeLog: `\\text{Change log!}\\\\ \\begin{array}{l}
\\bullet \\text{ Now grants}\\\\ \\text{increments at}\\\\
\\text{72 nudge levels}\\\\
\\bullet \\text{ Pub formula~}\\\\ \\frac{{\\tau}^{5.22}}{31} \\rightarrow
{\\tau}^{4.72}\\\\
\\bullet \\text{ } q_1 \\text{ level ms~}\\\\
1/2 \\rightarrow 1/4,\\\\
\\text{rounded down}\\\\
\\bullet \\text{ Freeze cost~}\\\\ 1e66 \\rightarrow 1e54\\\\
\\bullet \\text{ Spaced out}\\\\ \\text{ms costs}\\\\
\\end{array}`,

        historyDesc: `\\begin{{array}}{{c}}\\text{{History}}\\\\{{{0}}}/{{{1}}}
        \\end{{array}}`,
        historyInfo: 'Shows the last and current runs\' sequences',
        pausecDesc: ['Freeze {0}', 'Unfreeze {0}'],
        pausecInfo:
        [
            'Freezes the iteration timer in place',
            'Resumes the iteration timer'
        ],

        permaPause: '\\text{{the ability to freeze }}c',
        permaIncrement: `\\text{{extra in/decrements for }}c`,
        permaIncrementInfo: `Dependent on {0}'s sign, and incurs a penalty ` +
`on its level`,
        // permaPreserveDesc: '\\text{Preserve }c\\text{ after publishing}',
        // permaPreserveInfo: '\\text{Preserves }c\\text{ after publishing}',

        q1Level: 'q_1\\text{{ level}}',
        cLevel: '1/{{{0}}}\\text{{{{ of }}}}c\\text{{{{ level}}}}',
        cLevelth: `1/{{{0}}}^\\text{{{{th}}}}\\text{{{{ of }}}}c
        \\text{{{{ level}}}}`,
        cLevelCap: 'c\\text{{ level cap}}',
        cooldown: '\\text{{interval}}',
        cooldownInfo: 'Interval',
        nTicks: '{{{0}}}\\text{{{{ ticks}}}}',
        condition: `\\text{{if }}{{{0}}}`,

        alternating: ' (alternating)',
        penalty: '{0} level penalty = ',
        deductFromc: '\\text{{ (- }} {{{0}}} \\text{{ levels from }}c)',

        ch1Title: 'Preface',
        ch1Desc: `You are a talented undergraduate student.
Your professors see a bright future ahead of you.
One professor you respect hands you a formula,
then asks you if it converges into a finite cycle.
It is a modular recursive equation.
Not knowing how to solve it, you nudge the value
behind their backs.

It's thesis time.`,

        achNegativeTitle: 'Shrouded by Fog',
        achNegativeDesc: `Publish with an odd level of c and go negative.`,
        achMarathonTitle: 'Annual Lothar-athon',
        achMarathonDesc: 'Reach a c value of ±1e60. Reward: +1 to q2.',
        achSixNineTitle: 'I\'m proud of you.',
        achSixNineDesc: 'Reach a c value of 69.',

        btnClose: 'Close',
        btnIndexingMode: ['Indexing: Turns', 'Indexing: Levels'],
        btnNotationMode: ['Notation: Digits', 'Notation: Scientific'],
        btnBaseMode: ['Base: 10', 'Base: 2'],
        errorInvalidNumMode: 'Invalid number mode',
        errorBinExpLimit: 'Too big',

        menuHistory: 'Sequence History',
        labelCurrentRun: 'Current publication:',
        labelLastRun: 'Last publication:',

        reset: `You are about to reset the current publication.
Note: resetting is disabled if publishing is open and extra c levels are ` +
`bought.`
    }
};

const menuLang = Localization.language;
/**
 * Returns a localised string.
 * @param {string} name the internal name of the string.
 * @returns {string} the string.
 */
let getLoc = (name, lang = menuLang) =>
{
    if(lang in locStrings && name in locStrings[lang])
        return locStrings[lang][name];

    if(name in locStrings.en)
        return locStrings.en[name];
    
    return `String missing: ${lang}.${name}`;
}

const cDispColour = new Map();
cDispColour.set(Theme.STANDARD, 'c0c0c0');
cDispColour.set(Theme.DARK, 'b5b5b5');
cDispColour.set(Theme.LIGHT, '434343');

const cIterProgBar = ui.createProgressBar
({
    margin: new Thickness(6, 0)
});
const historyFrame = ui.createFrame
({
    isVisible: false,
    row: 0,
    column: 2,
    cornerRadius: 1,
    horizontalOptions: LayoutOptions.END,
    verticalOptions: LayoutOptions.START,
    margin: new Thickness(10),
    hasShadow: true,
    heightRequest: 24,
    content: ui.createImage
    ({
        // margin: new Thickness(2),
        source: ImageSource.BOOK,
        aspect: Aspect.ASPECT_FIT,
        useTint: false
    }),
    onTouched: (e) =>
    {
        if(e.type == TouchType.SHORTPRESS_RELEASED ||
        e.type == TouchType.LONGPRESS_RELEASED)
        {
            Sound.playClick();
            let menu = createHistoryMenu();
            menu.show();
        }
    }
});
const historyLabel = ui.createLatexLabel
({
    isVisible: false,
    row: 0,
    column: 2,
    horizontalOptions: LayoutOptions.END,
    verticalOptions: LayoutOptions.START,
    margin: new Thickness(3, 40),
    text: () => Utils.getMath(Localization.format(getLoc('historyDesc'),
    (nudgec ? nudgec.level : 0) + (incrementc ? incrementc.level : 0) -
    totalIncLevel, lastHistoryLength)),
    fontSize: 9,
    textColor: () => Color.fromHex(cDispColour.get(game.settings.theme))
});

let getShortString = (n) =>
{
    let s = n.toString();
    if(s.length > 9)
        s = `${s.slice(0, 5)}...${s.slice(-3)}`;
    return s;
}

let getShortBinaryString = (n) =>
{
    let s = BigInt(n).toString(2);
    if(s.length > 9)
        s = `${s.slice(0, 3)}...${s.slice(-5)}`;
    return s;
}

let getSciBinString = (n) =>
{
    let offset = 1;
    let s = BigInt(n).toString(2);
    if(s[0] == '-')
        offset = 2;

    if(s.length < 8)
        return s;

    let exponent = s.length - offset;
    // Negative
    if(s[0] == '-')
    {
        if(exponent >= 1000000)
        {
            let expofExp = Math.log10(exponent);
            if(expofExp >= 100000)  // -eee5.00     I'm lazy.
                return getLoc('errorBinExpLimit');
            if(expofExp >= 10000)   // -ee10000
                return `${s[0]}ee${expofExp.toFixed(0)}`;
            if(expofExp >= 1000)    // -ee1000.
                return `${s[0]}ee${expofExp.toFixed(0)}.`;
            if(expofExp >= 100)     // -ee100.0
                return `${s[0]}ee${expofExp.toFixed(1)}`;
            if(expofExp >= 10)      // -ee10.00
                return `${s[0]}ee${expofExp.toFixed(2)}`;
                                    // -ee6.000
            return `${s[0]}ee${expofExp.toFixed(3)}`;
        }
        if(exponent >= 100000)  // -e100000
            return `${s[0]}e${exponent}`;
        if(exponent >= 10000)   // -1e10000
            return `${s.slice(0, 2)}e${exponent}`;
        if(exponent >= 1000)    // -1.e1000
            return `${s.slice(0, 2)}.e${exponent}`;
        if(exponent >= 100)     // -1.0e100
            return `${s.slice(0, 2)}.${s[2]}e${exponent}`;
        if(exponent >= 10)      // -1.00e10
            return `${s.slice(0, 2)}.${s.slice(2, 4)}e${exponent}`;
                                // -1.000e9
        return `${s.slice(0, 2)}.${s.slice(2, 5)}e${exponent}`;
    }
    // Positive
    if(exponent >= 1000000)
    {
        let expofExp = Math.log10(exponent);
        if(expofExp >= 1000000) // eee6.000     I'm lazy.
            return getLoc('errorBinExpLimit');
        if(expofExp >= 100000)  // ee100000
            return `ee${expofExp.toFixed(0)}`;
        if(expofExp >= 10000)   // ee10000.
            return `ee${expofExp.toFixed(0)}.`;
        if(expofExp >= 1000)    // ee1000.0
            return `ee${expofExp.toFixed(1)}`;
        if(expofExp >= 100)     // ee100.00
            return `ee${expofExp.toFixed(2)}`;
        if(expofExp >= 10)      // ee10.000
            return `ee${expofExp.toFixed(3)}`;
                                // ee6.0000
        return `ee${expofExp.toFixed(4)}`;
    }
    if(exponent >= 100000)  // 1e100000
        return `${s[0]}e${exponent}`;
    if(exponent >= 10000)   // 1.e10000
        return `${s[0]}.e${exponent}`;
    if(exponent >= 1000)    // 1.0e1000
        return `${s[0]}.${s[1]}e${exponent}`;
    if(exponent >= 100)     // 1.00e100
        return `${s[0]}.${s.slice(1, 3)}e${exponent}`;
    if(exponent >= 10)      // 1.000e10
        return `${s[0]}.${s.slice(1, 4)}e${exponent}`;
                            // 1.0000e9
    return `${s[0]}.${s.slice(1, 5)}e${exponent}`;
}

let getShorterString = (n) =>
{
    let s = n.toString();
    if(s.length > 7)
        s = `${s.slice(0, 3)}...${s.slice(-3)}`;
    return s;
}

let getShorterBinaryString = (n) =>
{
    let s = BigInt(n).toString(2);
    if(s.length > 7)
        s = `${s.slice(0, 1)}...${s.slice(-5)}`;
    return s;
}

let getStringForm = (n, numMode = 0) =>
{ 
    switch(numMode)
    {
        case 0:
            return getShortString(n);
        case 1:
            return BigNumber.from(n).toString(0);
        case 2:
            return getShortBinaryString(n);
        case 3:
            return getSciBinString(n);
        default:
            return getLoc('errorInvalidNumMode');
    }
}

let getSequence = (sequence, numMode = 0, idxMode = 0) =>
{
    let result = '\\begin{array}{rrr}';
    let i = 0;
    let start;
    let oldFormat = false;
    for(key in sequence)
    {
        if(i)
            result += '\\\\';
        else
        {
            start = Number(key) - 1;
            if(typeof sequence[key] === 'string')
                oldFormat = true;
        }
        if(oldFormat)
            result += `${idxMode ? Number(key) - start : '?'}:&
            ${getStringForm(sequence[key], numMode)}&
            (${key & 1 ? '+1' : '-1'})`;
        else
            result += `${idxMode ? Number(key) - start : sequence[key][0]}:&
            ${getStringForm(sequence[key][1], numMode)}&
            (${key & 1 ? '+1' : '-1'})`;
        ++i;
    }
    result += '&\\end{array}';

    return Utils.getMath(result);
}

var init = () =>
{
    currency = theory.createCurrency();
    /* Freeze
    Freeze c's value and the timer in place, which allows for idling. This will
    become more important later on, and also helps with farming c levels.
    */
    {
        pausec = theory.createSingularUpgrade(3, currency, new FreeCost);
        pausec.getDescription = () => Localization.format(getLoc(
        'pausecDesc')[pausec.level & 1], Utils.getMath('c'));
        pausec.getInfo = () => getLoc('pausecInfo')[pausec.level & 1];
    }
    /* Nudge c
    The theory's core mechanic revolves around nudging c around. This upgrade
    alternates between incrementing and decrementing by 1. If an increment nudge
    is used on a number divisible by 4, the next number will become divisible by
    4 again, which can be super annoying.
    */
    {
        let getDesc = (level) => `c \\leftarrow c${level & 1 ? '-' : '+'}1
        \\text{${getLoc('alternating')}}`;
        nudgec = theory.createUpgrade(0, currency, new FreeCost);
        nudgec.getDescription = (_) => Utils.getMath(
        getDesc(nudgec.level));
        nudgec.getInfo = (_) => `${nudgec.level & 1 ?
        Localization.getUpgradeDecCustomInfo('c', 1) :
        Localization.getUpgradeIncCustomInfo('c', 1)}${getLoc('alternating')}`;
        nudgec.bought = (_) =>
        {
            if(nudgec.isAutoBuyable)
            {
                nudgec.refund(1);
                return;
            }
            if(writeHistory)
                history[nudgec.level] = [turns, c.toString()];
            // even level: -1, odd level: +1, because this is post-processing
            if(nudgec.level & 1)
                c += 1n;
            else
                c -= 1n;

            cBigNum = BigNumber.from(c);
            if(nudgec.level == nudgec.maxLevel)
                updateAvailability();
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        nudgec.isAutoBuyable = false;
        nudgec.maxLevel = cLevelCap[0];
    }
    /* q1 (c1 prior to 0.06)
    Most theories use a (2, 10) stepwise power, which I criticise to be too weak
    to be worth putting autobuy on. In Botched, a (3, 6) was used, and c1's cost
    there would align with c2 near perfectly at ~6 c1 upgrades per c2 upgrade.
    Collatz uses a (2, 5), which aligns more with tradition, while being twice
    more powerful.
    */
    {
        let getDesc = (level) => `q_1=${getq1(level).toString(0)}`;
        let getInfo = (level) =>
        {
            if(q1ExpMs.level > 0)
                return `q_1^{${getq1Exponent(q1ExpMs.level)}}=
                ${getq1(level).pow(getq1Exponent(q1ExpMs.level)).toString()}`;

            return getDesc(level);
        }
        q1 = theory.createUpgrade(1, currency, q1Cost);
        q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level),
        getInfo(q1.level + amount));
    }
    /* q2 (c2 prior to 0.06)
    Standard doubling upgrade.
    */
    {
        let getDesc = (level) => `q_2=3^{${level}}${marathonBadge ? '+1' : ''}`;
        let getInfo = (level) => `q_2=${getq2(level).toString(0)}`;
        q2 = theory.createUpgrade(2, currency, q2Cost);
        q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level),
        getInfo(q2.level + amount));
    }
    /* Increment c
    Unlike nudge, this upgrade only increments c. It is both weaker in positive
    and negative.
    */
    {
        let getDesc = (level) => `c \\leftarrow c${c < 0n ? '-' : '+'}1
        ${Localization.format(getLoc('deductFromc'),
        getIncrementPenalty(level))}`;
        incrementc = theory.createUpgrade(3, currency, new FreeCost);
        incrementc.getDescription = () => Utils.getMath(getDesc(
        incrementc.level));
        incrementc.getInfo = (amount) => `${Localization.format(
        getLoc('penalty'), Utils.getMath('c'))}
        ${Utils.getMathTo(getIncrementPenalty(incrementc.level),
        getIncrementPenalty(incrementc.level + amount))}`;
        incrementc.bought = (_) =>
        {
            if(incrementc.isAutoBuyable)
            {
                incrementc.refund(1);
                return;
            }
            if(c < 0n)
                c -= 1n;
            else
                c += 1n;

            cBigNum = BigNumber.from(c);
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        incrementc.isAutoBuyable = false;
        incrementc.isAvailable = false;
    }

    theory.createPublicationUpgrade(0, currency, permaCosts[0]);
    // theory.permanentUpgrades[0].bought = (_) => updateAvailability();
    theory.createBuyAllUpgrade(1, currency, permaCosts[1]);
    theory.createAutoBuyerUpgrade(2, currency, permaCosts[2]);
    /* Unlocks freeze
    Shame that you unlock such a useful tool really late.
    */
    {
        pausePerma = theory.createPermanentUpgrade(3, currency,
        new ConstantCost(permaCosts[3]));
        pausePerma.description = Localization.getUpgradeUnlockDesc(getLoc(
        'permaPause'));
        pausePerma.info = Localization.getUpgradeUnlockInfo(getLoc(
        'permaPause'));
        pausePerma.bought = (_) => updateAvailability();
        pausePerma.maxLevel = 1;
    }
    /* Extra increments
    Generally used to aid with catching up. Not sure if it's actually effective.
    */
    {
        extraIncPerma = theory.createPermanentUpgrade(4, currency,
        new ConstantCost(permaCosts[4]));
        extraIncPerma.description = Localization.getUpgradeUnlockDesc(getLoc(
        'permaIncrement'));
        extraIncPerma.info = Localization.format(getLoc('permaIncrementInfo'),
        Utils.getMath('c'));
        extraIncPerma.bought = (_) => updateAvailability();
        extraIncPerma.maxLevel = 1;
    }
    /* Preserve c
    We had the chance to test out this one. It breaks progression, and poses a
    threat to the theory's performance.
    */

    theory.setMilestoneCost(milestoneCost);
    /* Interval speed-up
    Technically, this is a c level cap milestone coupled with a drawback. This
    allows you to farm for the borrow milestone faster.
    */
    {
        let getInfo = (level, amount = 1) => `${getLoc('cooldownInfo')}=
        ${cooldown[level] || cooldown[level - amount]}`;
        cooldownMs = theory.createMilestoneUpgrade(0, cooldown.length - 1);
        cooldownMs.getDescription = (amount) =>
        {
            let cd = Localization.getUpgradeDecCustomDesc(getLoc(
            'cooldown'), Localization.format(getLoc('nTicks'),
            cooldown[cooldownMs.level] - cooldown[cooldownMs.level + amount] ||
            0));
            let cap = Localization.getUpgradeIncCustomDesc(getLoc(
            'cLevelCap'), cLevelCap[cooldownMs.level + amount] -
            cLevelCap[cooldownMs.level] || 0);
            return `${cd}; ${cap}`;
        };
        cooldownMs.getInfo = (amount) =>
        {
            let cd = `${getLoc('cooldownInfo')} = ${Utils.getMathTo(
            cooldown[cooldownMs.level], cooldown[cooldownMs.level + amount] ||
            cooldown[cooldownMs.level])}`;
            let cap = `${Utils.getMath(getLoc('cLevelCap'))} = 
            ${Utils.getMathTo(cLevelCap[cooldownMs.level],
            cLevelCap[cooldownMs.level + amount] ||
            cLevelCap[cooldownMs.level])}`;
            return `${cd}; ${cap}`;
        }
        cooldownMs.boughtOrRefunded = (_) =>
        {
            nudgec.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
        };
        cooldownMs.canBeRefunded = (amount) => nudgec.level <=
        totalIncLevel + cLevelCap[cooldownMs.level - amount];
    }
    /* Level borrowing
    It'll be useless for a while at first when you unlock it at e44. But, it can
    be farmed simply by doing a bunch of empty publishes at 1.00 multiplier.
    */
    {
        q1BorrowMs = theory.createMilestoneUpgrade(1, 1);
        q1BorrowMs.description = Localization.getUpgradeIncCustomDesc(getLoc(
        'q1Level'), Localization.format(getLoc('cLevelth'), borrowFactor));
        q1BorrowMs.info = Localization.getUpgradeIncCustomInfo(getLoc(
        'q1Level'), Localization.format(getLoc('cLevelth'), borrowFactor));
    }
    /* q1 exponent
    Standard exponent upgrade.
    */
    {
        q1ExpMs = theory.createMilestoneUpgrade(2, q1ExpMaxLevel);
        q1ExpMs.description = Localization.getUpgradeIncCustomExpDesc('q_1',
        q1ExpInc);
        q1ExpMs.info = Localization.getUpgradeIncCustomExpInfo('q_1', q1ExpInc);
        q1ExpMs.boughtOrRefunded = (_) => theory.invalidateSecondaryEquation();
    }

    theory.createStoryChapter(0, getLoc('ch1Title'), getLoc('ch1Desc'),
    () => true);

    theory.createAchievement(0, undefined, getLoc('achNegativeTitle'),
    getLoc('achNegativeDesc'), () => cBigNum < 0);
    theory.createAchievement(1, undefined, getLoc('achMarathonTitle'),
    getLoc('achMarathonDesc'), () => cBigNum.abs() >= 1e60, () => c == 0n ? 0 :
    cBigNum.abs().log10().toNumber() / 60);
    theory.createAchievement(2, undefined, getLoc('achSixNineTitle'),
    getLoc('achSixNineDesc'), () => c == 69n);

    updateAvailability();

    theory.primaryEquationHeight = 66;
    theory.primaryEquationScale = 0.9;
}

var updateAvailability = () =>
{
    pausec.isAvailable = pausePerma.level > 0;
    if(theory.permanentUpgrades[0].level)
    {
        historyFrame.isVisible = true;
        historyLabel.isVisible = true;
        reachedFirstPub = true;
    }
    marathonBadge = theory.achievements[1].isUnlocked;
    incrementc.isAvailable = extraIncPerma.level > 0 &&
    nudgec.level == nudgec.maxLevel;
}

var tick = (elapsedTime, multiplier) =>
{
    if(elapsedTime > 0.1)
        log(`Long tick: ${elapsedTime.toFixed(3)}s`);

    nudgec.isAutoBuyable = false;
    incrementc.isAutoBuyable = false;

    if(pausec.level % 2 == 0)
    {
        ++time;
        if(time >= cooldown[cooldownMs.level])
        {
            cIterProgBar.progressTo(0, 33, Easing.CUBIC_IN);
            if(c % 2n != 0)
                c = 3n * c + 1n;
            else
                c /= 2n;

            cBigNum = BigNumber.from(c);
            if(nudgec.level > totalIncLevel)
                ++turns;
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
            time -= cooldown[cooldownMs.level];
        }
        else
            cIterProgBar.progressTo((time / (cooldown[cooldownMs.level] - 1)) **
            1.5, 110, Easing.LINEAR);
    }

    let dt = BigNumber.from(elapsedTime * multiplier);
    let q1Term = getq1(q1.level).pow(getq1Exponent(q1ExpMs.level));
    let q2Term = getq2(q2.level);
    let bonus = theory.publicationMultiplier;

    currency.value += dt * cBigNum.abs() * q1Term * q2Term * bonus;
}

var getEquationOverlay = () =>
{
    let result = ui.createGrid
    ({
        rowDefinitions: ['auto', '80*', 'auto'],
        columnDefinitions: ['1*', '2*', '1*'],
        children:
        [
            ui.createLatexLabel
            ({
                row: 0,
                column: 0,
                verticalOptions: LayoutOptions.START,
                margin: new Thickness(6, 3),
                text: getLoc('versionName') + getLoc('workInProgress')/* +
                Utils.getMath(getLoc('changeLog'))*/,
                fontSize: 9,
                textColor: Color.TEXT_MEDIUM
            }),
            ui.createFrame
            ({
                row: 0,
                column: 1,
                hasShadow: true,
                verticalOptions: LayoutOptions.START,
                cornerRadius: 1,
                content: cIterProgBar
            }),
            historyFrame,
            historyLabel
        ]
    });
    return result;
}

var getPrimaryEquation = () =>
{
    let cStr = historyNumMode & 2 ? getShortBinaryString(c) :
    getShortString(c);
    let evenClause = Localization.format(getLoc('condition'),
    `c\\equiv0\\text{ (mod 2)}`);
    let oddClause = Localization.format(getLoc('condition'),
    `c\\equiv1\\text{ (mod 2)}`);
    let result = `\\begin{matrix}c\\leftarrow\\begin{cases}c/2&${evenClause}\\\\
    3c+1&${oddClause}\\end{cases}\\\\\\\\
    \\color{#${cDispColour.get(game.settings.theme)}}
    {=${cStr}${historyNumMode & 2 ? '_2' : ''}}\\end{matrix}`;

    return result;
}

var getSecondaryEquation = () =>
{
    let result = `\\begin{matrix}\\dot{\\rho}=|c|\\,q_1${q1ExpMs.level > 0 ?
    `^{${getq1Exponent(q1ExpMs.level)}}` : ''}q_2,&${theory.latexSymbol}
    =\\max{\\rho}^{0.1}\\end{matrix}`;
    return result;
}

var getTertiaryEquation = () =>
{
    let mStr = '';
    let cStr = '';
    if(reachedFirstPub)
        mStr = `t=${turns}`;
    if(historyNumMode & 2 || c > 1e6 || c < -1e6)
        cStr = `c=${cBigNum.toString(0)}`;

    return `\\begin{matrix}${mStr}${mStr && cStr ? ',&' : ''}${cStr}
    \\end{matrix}`;
}

let createHistoryMenu = () =>
{
    let toggleIdxMode = () =>
    {
        historyIdxMode ^= 1;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyIdxMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyIdxMode);
        toggleIdxButton.text = getLoc('btnIndexingMode')[historyIdxMode & 1];
    }
    let toggleIdxButton = ui.createButton
    ({
        column: 0,
        text: getLoc('btnIndexingMode')[historyIdxMode & 1],
        onClicked: () =>
        {
            Sound.playClick();
            toggleIdxMode();
        }
    });
    let toggleBaseMode = () =>
    {
        historyNumMode = historyNumMode ^ 2;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyIdxMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyIdxMode);
        toggleLvlButton.text = getLoc('btnBaseMode')[(historyNumMode & 2) >>
        1];
        theory.invalidatePrimaryEquation();
        theory.invalidateTertiaryEquation();
    };
    let toggleLvlButton = ui.createButton
    ({
        column: 1,
        text: getLoc('btnBaseMode')[(historyNumMode & 2) >> 1],
        onClicked: () =>
        {
            Sound.playClick();
            toggleBaseMode();
        }
    });
    let toggleNotationMode = () =>
    {
        historyNumMode = historyNumMode ^ 1;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyIdxMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyIdxMode);
        toggleNumButton.text = getLoc('btnNotationMode')[historyNumMode & 1];
    };
    let toggleNumButton = ui.createButton
    ({
        column: 2,
        text: getLoc('btnNotationMode')[historyNumMode & 1],
        onClicked: () =>
        {
            Sound.playClick();
            toggleNotationMode();
        }
    });
    let currentPubHistory = ui.createLatexLabel
    ({
        row: 2,
        column: 0,
        text: getSequence(history, historyNumMode, historyIdxMode),
        margin: new Thickness(0, 0, 3, 0),
        horizontalOptions: LayoutOptions.CENTER,
    });
    let lastPubHistory = ui.createLatexLabel
    ({
        row: 2,
        column: 1,
        text: getSequence(lastHistory, historyNumMode, historyIdxMode),
        margin: new Thickness(3, 0, 0, 0),
        horizontalOptions: LayoutOptions.CENTER,
    });
    let historyGrid = ui.createGrid
    ({
        rowDefinitions: ['24', '13', 'auto'],
        columnDefinitions: ['1*', '1*'],
        columnSpacing: 0,
        children:
        [
            ui.createLatexLabel
            ({
                row: 0,
                column: 0,
                text: getLoc('labelCurrentRun'),
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.END
            }),
            ui.createLatexLabel
            ({
                row: 0,
                column: 1,
                text: getLoc('labelLastRun'),
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.END
            }),
            ui.createBox
            ({
                row: 1,
                column: 0,
                margin: new Thickness(0, 6)
            }),
            ui.createBox
            ({
                row: 1,
                column: 1,
                margin: new Thickness(0, 6)
            }),
            currentPubHistory,
            lastPubHistory
        ]
    });

    let menu = ui.createPopup
    ({
        isPeekable: true,
        title: getLoc('menuHistory'),
        content: ui.createStackLayout
        ({
            children:
            [
                ui.createGrid
                ({
                    rowDefinitions: [44],
                    columnDefinitions: ['8*', '5*', '9*'],
                    columnSpacing: 8,
                    children:
                    [
                        toggleIdxButton,
                        toggleNumButton,
                        toggleLvlButton
                    ]
                }),
                ui.createScrollView
                ({
                    // heightRequest: ui.screenHeight * 0.32,
                    content: historyGrid,
                    orientation: ScrollOrientation.BOTH
                }),
                ui.createBox
                ({
                    heightRequest: 1,
                    margin: new Thickness(0, 6)
                }),
                ui.createButton
                ({
                    text: getLoc('btnClose'),
                    onClicked: () =>
                    {
                        Sound.playClick();
                        menu.hide();
                    }
                })
            ]
        })
    });
    return menu;
}

// Check out the Giant's Causeway in Ireland!
var get2DGraphValue = () =>
{
    if(cBigNum == BigNumber.ZERO)
        return 0;
    
    return (cBigNum.abs().log2() * cBigNum.sign).toNumber();
}

var getTau = () => currency.value.pow(tauRate);

var getCurrencyFromTau = (tau) =>
[
    tau.max(BigNumber.ONE).pow(BigNumber.ONE / tauRate),
    currency.symbol
];

// Will not trigger if you press reset.
var prePublish = () =>
{
    totalIncLevel = nudgec.level - getIncrementPenalty(incrementc.level);
    lastHistory = history;
    lastHistoryLength = Object.keys(lastHistory).length;
}
var postPublish = () =>
{
    turns = 0;
    time = 0;
    // Disabling history write circumvents the extra levelling
    writeHistory = false;
    nudgec.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
    nudgec.level = totalIncLevel;
    writeHistory = true;
    history = {};
    // c is reset to 0 afterwards

    c = 0n;
    cBigNum = BigNumber.from(c);
    cIterProgBar.progressTo(0, 220, Easing.CUBIC_INOUT);

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
    updateAvailability();
}

var canResetStage = () => !theory.canPublish || incrementc.level == 0;

var getResetStageMessage = () => getLoc('reset');

var resetStage = () =>
{
    if(theory.canPublish && incrementc.level)
        return;

    for (let i = 0; i < theory.upgrades.length; ++i)
        theory.upgrades[i].level = 0;

    currency.value = 0;
    theory.clearGraph();
    postPublish();
}

var getInternalState = () => JSON.stringify
({
    version: version,
    turns: turns,
    time: time,
    c: c.toString(),
    totalIncLevel: totalIncLevel,
    history: history,
    lastHistory: lastHistory,
    historyNumMode: historyNumMode,
    historyIdxMode: historyIdxMode
})

var setInternalState = (stateStr) =>
{
    if(!stateStr)
        return;

    let state = JSON.parse(stateStr);
    if('turns' in state)
        turns = state.turns;
    if('time' in state)
    {
        time = state.time;
        cIterProgBar.progress = (time / (cooldown[cooldownMs.level] - 1)) **
        1.5;
    }
    if('c' in state)
    {
        c = BigInt(state.c);
        cBigNum = BigNumber.from(c);
    }

    let tmpIML = cLevelCap[cooldownMs.level];
    if('totalIncLevel' in state)
    {
        totalIncLevel = state.totalIncLevel;
        tmpIML += totalIncLevel;
    }
    nudgec.maxLevel = tmpIML;

    if('history' in state)
        history = state.history;
    if('lastHistory' in state)
    {
        lastHistory = state.lastHistory;    
        lastHistoryLength = Object.keys(lastHistory).length;
    }
    if('historyNumMode' in state)
        historyNumMode = state.historyNumMode;
    if('historyIdxMode' in state)
        historyIdxMode = state.historyIdxMode;

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

init();
