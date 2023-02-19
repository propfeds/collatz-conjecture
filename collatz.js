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
import { TextAlignment } from '../api/ui/properties/TextAlignment';

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
`A puzzle revolving around trying to counteract the even clause of the ` +
`Collatz conjecture.

Warning: for spoiler purposes, it is ill-advised to
share your sequences to new players.

'If it's odd, take triple and one,
If it's even, cut in two.

If you woke up with bread in hand,
what would you do?'`,
    };

    return descs[language] || descs.en;
}
var authors = 'propfeds#5988\n\nThanks to:\nCipher#9599, the original ' +
'suggester\nXLII#0042, a computer pretending to be a normal player, acting ' +
'at the speed of light';
var version = 0.07;

let turns = 0;
let time = 0;
let c = 0n;
let cBigNum = BigNumber.from(c);
let cSum = cBigNum;
let totalIncLevel = 0;
let history = {};
let lastHistory;
let lastHistoryLength = 0;
let writeHistory = true;
let historyNumMode = 0;
let historyIdxMode = 1;
let mimickLastHistory = false;
let nextNudge = 0;
let preserveLastHistory = false;
let reachedFirstPub = false;
let marathonBadge = false;
let longTickMsg = '';

let bigNumArray = (array) => array.map(x => BigNumber.from(x));

// All balance parameters are aggregated for ease of access

const borrowFactor = 4;
const q1Cost = new FirstFreeCost(new ExponentialCost(1, 3.01));
const getIncrementPenalty = (level) => Math.round(Utils.getStepwisePowerSum(
level, 2, 6, 0).toNumber());
const getq1BonusLevels = (bl, pl) => Math.max(Math.floor((bl * nudge.level - 
getIncrementPenalty(pl)) / borrowFactor), 0);
const getq1 = (level) => Utils.getStepwisePowerSum(level + getq1BonusLevels(
q1BorrowMs.level, extraInc.level), 2, 5, 1);

const q1ExpInc = 0.03;
const q1ExpMaxLevel = 4;
const getq1Exponent = (level) => 1 + q1ExpInc * level;

const q2Cost = new ExponentialCost(2.2e7, 11);
const getq2 = (level) => BigNumber.THREE.pow(level) + (marathonBadge ? 1 : 0);

const permaCosts = bigNumArray(['1e12', '1e22', '1e31', '1e58', '1e126',
'1e301']);
// 44, 88, 176, 264, 352, 480, 600, 720
const milestoneCost = new CompositeCost(2, new LinearCost(4.4, 4.4),
new CompositeCost(3, new LinearCost(17.6, 8.8), new LinearCost(48, 12)));

const cLevelCap = [24, 36, 48, 64];
const cooldown = [42, 30, 20, 12];

const tauRate = 0.1;
const pubExp = 4;
var getPublicationMultiplier = (tau) => tau.pow(pubExp);
var getPublicationMultiplierFormula = (symbol) => `{${symbol}}^{${pubExp}}`;

var freeze;
var nudge, q1, q2, extraInc;
var freezePerma, extraIncPerma, mimickPerma;
var cooldownMs, q1BorrowMs, q1ExpMs;

var currency;

const locStrings =
{
    en:
    {
        versionName: 'v0.07, Work in\\\\Progress',
        longTick: 'Tick: {0}s',

        historyDesc: `\\begin{{array}}{{c}}\\text{{History}}\\\\{{{0}}}/{{{1}}}
        \\end{{array}}`,
        historyInfo: 'Shows the last and current publications\' sequences',
        freezeDesc: ['Freeze {0}', 'Unfreeze {0}'],
        freezeInfo:
        [
            'Freezes the turn timer in place',
            'Resumes the turn timer'
        ],

        permaFreeze: '\\text{{the ability to freeze }}c',
        permaIncrement: `\\text{{extra in/decrements for }}c`,
        permaIncrementInfo: `Dependent on {0}'s sign, and incurs a penalty ` +
`on its level`,
        permaMimick: 'Auto-nudge {0}',
        permaMimickInfo: 'Follows the last publication',

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
        auto: ['Auto: off', 'Auto: on'],

        ch1Title: 'Preface',
        ch1Text: `You are a talented undergraduate student.
Your professors see a bright future ahead of you.
One professor you respect hands you a formula,
then asks you if it converges into a finite cycle.
It is a modular recursive equation.
Not knowing how to solve it, you start to
nudge the value behind their backs.`,

        ch2Title: 'Nudge Theory',
        ch2Text: `In your graduation thesis, you have documented
sequences that seemingly go from 0 to
breaking the integer limits.
It's certainly interesting: even though it's
bound to fall, if you cheat by even just a little bit,
the outcome can get a lot better.

Impressed by your work, a professor offers you
an internship in his research lab.
Occasionally, you can be heard in the lab,
giggling with some of your online chat friends,
who call you: the CEO of Nudge.

But inside, you are afraid.
It's bound to fall.`,

        ch3Title: 'Escalations',
        ch3Text: `Eventually, a colleague of yours has come to
know about your nudging business...

'I've always had these nightmares about climbing.
Weaving through the cityscapes, but
the purpose had never been for recreation...
It was always some kind of accident.
Then suddenly, I was caught under the
scrying eyes of a headmaster, and
I had to keep scaling and scaling,
I wanted it to stop, I wished I could jump
into one of those windows, and
beg the family inside to let me stay!'`,

        ch3bTitle: '...Escalations',
        ch3bText:`'...But I got caught again, and my punishments
escalated. Then there were the constant chases,
fruitless beggings, and then I was caught again.
My punishments escalated.
But I don't want to be a criminal...'

You woke yourself up, looking frozen all over.
A shiver shook you up, and suddenly, you
chanced upon that colleague in the hallway.
She is the only one who knows this.`,

        ch4Title: 'Something about the Auto-nudge',
        ch4Text: `Something about the Auto-nudge being a mysterious tool gifted
to you and you are suspicious of it and totally not super scared.`,

        achNegativeTitle: 'Shrouded by Fog',
        achNegativeDesc: `Publish with an odd level of c and go negative.`,
        achMarathonTitle: 'Annual Lothar-athon',
        achMarathonDesc: 'Reach a c value of ±1e60. Reward: +1 to q2.',
        achSixNineTitle: 'I\'m proud of you.',
        achSixNineDesc: 'Reach a c value of 69.',

        btnSave: 'Save',
        btnIndexingMode: ['Indexing: Turns', 'Indexing: Levels'],
        btnNotationMode: ['Notation: Digits', 'Notation: Scientific'],
        btnBaseMode: ['Base: 10', 'Base: 2'],

        menuHistory: 'Sequence History',
        labelCurrentRun: 'Current publication:',
        labelLastRun: 'Last publication:',
        labelMimick: 'Auto-nudge {0} (follows last pub): ',
        labelPreserve: 'Preserve last publication: ',
        errorInvalidNumMode: 'Invalid number mode',
        errorBinExpLimit: 'Too big',

        reset: `You are about to reset the current publication.
Note: resetting is disabled if publishing opens while extra c levels are ` +
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
    margin: new Thickness(6, 0),
    progressColor: () => !mimickLastHistory || (nudge &&
    nudge.level == nudge.maxLevel) || (nextNudge in lastHistory &&
    turns == lastHistory[nextNudge][0] - 1) ? Color.TEXT : Color.BORDER
});
/* Image size reference
Size 20:
270x480

Size 24:
360x640
450x800
540x960

Size 36:
720x1280

Size 48:
1080x1920
*/
let getImageSize = (width) =>
{
    if(width >= 1080)
        return 48;
    if(width >= 720)
        return 36;
    if(width >= 360)
        return 24;

    return 20;
}

let getBtnSize = (width) =>
{
    if(width >= 1080)
        return 96;
    if(width >= 720)
        return 72;
    if(width >= 360)
        return 48;

    return 40;
}

let getMediumBtnSize = (width) =>
{
    if(width >= 1080)
        return 88;
    if(width >= 720)
        return 66;
    if(width >= 360)
        return 44;

    return 36;
}

let getSmallBtnSize = (width) =>
{
    if(width >= 1080)
        return 80;
    if(width >= 720)
        return 60;
    if(width >= 360)
        return 40;

    return 32;
}

const historyFrame = ui.createFrame
({
    isVisible: false,
    row: 0,
    column: 2,
    cornerRadius: 1,
    horizontalOptions: LayoutOptions.END,
    verticalOptions: LayoutOptions.START,
    margin: new Thickness(9.5),
    padding: new Thickness(0, 0, 0, 1),
    hasShadow: true,
    heightRequest: getImageSize(ui.screenWidth),
    widthRequest: getImageSize(ui.screenWidth),
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
    verticalTextAlignment: TextAlignment.START,
    margin: new Thickness(2.5, 41, 2.5, 0),
    text: () => Utils.getMath(Localization.format(getLoc('historyDesc'),
    (nudge ? nudge.level : 0) + (extraInc ? extraInc.level : 0) -
    totalIncLevel, lastHistoryLength)),
    fontSize: 9,
    textColor: () => Color.fromHex(cDispColour.get(game.settings.theme))
});
const mimickFrame = ui.createFrame
({
    isVisible: false,
    row: 1,
    column: 2,
    cornerRadius: 1,
    horizontalOptions: LayoutOptions.END,
    verticalOptions: LayoutOptions.END,
    margin: new Thickness(9.5),
    // padding: new Thickness(0, 0, 0, 1),
    hasShadow: true,
    heightRequest: getImageSize(ui.screenWidth),
    widthRequest: getImageSize(ui.screenWidth),
    content: ui.createImage
    ({
        source: () => mimickLastHistory && nudge &&
        nudge.level < nudge.maxLevel ? ImageSource.STAR_FULL :
        ImageSource.STAR_EMPTY,
        aspect: Aspect.ASPECT_FIT,
        useTint: false
    }),
    onTouched: (e) =>
    {
        if(e.type == TouchType.SHORTPRESS_RELEASED ||
        e.type == TouchType.LONGPRESS_RELEASED)
        {
            Sound.playClick();
            mimickLastHistory = !mimickLastHistory;
            if(mimickLastHistory)
            nextNudge = binarySearch(Object.keys(lastHistory), turns);
        }
    }
});
const mimickLabel = ui.createLatexLabel
({
    isVisible: false,
    row: 1,
    column: 2,
    horizontalOptions: LayoutOptions.END,
    verticalTextAlignment: TextAlignment.START,
    verticalOptions: LayoutOptions.END,
    margin: new Thickness(2.5, 0, 2.5, 42),
    text: () => (getLoc('auto')[Number(mimickLastHistory)]),
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

let binarySearch = (arr, target) =>
{
    let l = Number(arr[0]);
    let r = Number(arr[arr.length - 1]);
    while(l < r)
    {
        let m = Math.floor((l + r) / 2);
        if(lastHistory[m][0] <= target)
            l = m + 1;
        else
            r = m;
    }
    return l;
}

var init = () =>
{
    currency = theory.createCurrency();
    /* Freeze
    Freeze c's value and the timer in place, which allows for idling. This will
    become more important later on, and also helps with farming c levels.
    */
    {
        freeze = theory.createSingularUpgrade(3, currency, new FreeCost);
        freeze.getDescription = () => Localization.format(getLoc(
        'freezeDesc')[freeze.level & 1], Utils.getMath('c'));
        freeze.getInfo = () => getLoc('freezeInfo')[freeze.level & 1];
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
        nudge = theory.createUpgrade(0, currency, new FreeCost);
        nudge.getDescription = (_) => Utils.getMath(
        getDesc(nudge.level));
        nudge.getInfo = (_) => `${nudge.level & 1 ?
        Localization.getUpgradeDecCustomInfo('c', 1) :
        Localization.getUpgradeIncCustomInfo('c', 1)}${getLoc('alternating')}`;
        nudge.bought = (amount) =>
        {
            if(nudge.isAutoBuyable)
            {
                nudge.refund(amount);
                return;
            }
            if(writeHistory)
                history[nudge.level] = [turns, c.toString()];
            // even level: -1, odd level: +1, because this is post-processing
            if(nudge.level & 1)
            {
                c += 1n;
                // cSum += BigNumber.ONE;
            }
            else
            {
                c -= 1n;
                // cSum -= BigNumber.ONE;
            }
            cBigNum = BigNumber.from(c);

            if(nudge.level == nudge.maxLevel)
                updateAvailability();
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        nudge.isAutoBuyable = false;
        nudge.maxLevel = cLevelCap[0];
    }
    /* q1 (c1 prior to 0.06)
    Most theories use a (2, 10) stepwise power, which I criticise to be too weak
    to be worth putting autobuy on. In Botched, a (3, 6) was used, and c1's cost
    there would align with c2 near perfectly at ~6 c1 upgrades per c2 upgrade.
    Collatz uses a (2, 5), which aligns more with tradition, while being twice
    more powerful.
    Optimal cost ratios (mod 5) against q2: 3/(10+2r) --> inverse: 4+0.667r
    r=1,    2,     3,     4,     5
    3/12,   14,    16,    18,    20
    0.25, 0.214, 0.188, 0.167, 0.15
      4,  4.667, 5,333,   6,   6,667
    */
    {
        let getDesc = (level) =>
        {
            let blSub = q1BorrowMs.level ? `_{(+
            ${getq1BonusLevels(q1BorrowMs.level, extraInc.level)})}\\,` : '';
            return `${blSub}q_1=${getq1(level).toString(0)}`;
        }
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
        extraInc = theory.createUpgrade(3, currency, new FreeCost);
        extraInc.getDescription = () => Utils.getMath(getDesc(
        extraInc.level));
        extraInc.getInfo = (amount) => `${Localization.format(
        getLoc('penalty'), Utils.getMath('c'))}
        ${Utils.getMathTo(getIncrementPenalty(extraInc.level),
        getIncrementPenalty(extraInc.level + amount))}`;
        extraInc.bought = (_) =>
        {
            if(extraInc.isAutoBuyable)
            {
                extraInc.refund(1);
                return;
            }
            if(c < 0n)
            {
                c -= 1n;
                // cSum -= BigNumber.ONE;
            }
            else
            {
                c += 1n;
                // cSum += BigNumber.ONE;
            }
            cBigNum = BigNumber.from(c);

            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        extraInc.isAutoBuyable = false;
        extraInc.isAvailable = false;
    }

    theory.createPublicationUpgrade(0, currency, permaCosts[0]);
    theory.createBuyAllUpgrade(1, currency, permaCosts[1]);
    theory.createAutoBuyerUpgrade(2, currency, permaCosts[2]);
    /* Unlocks freeze
    Shame that you unlock such a useful tool really late.
    */
    {
        freezePerma = theory.createPermanentUpgrade(3, currency,
        new ConstantCost(permaCosts[3]));
        freezePerma.description = Localization.getUpgradeUnlockDesc(getLoc(
        'permaFreeze'));
        freezePerma.info = Localization.getUpgradeUnlockInfo(getLoc(
        'permaFreeze'));
        freezePerma.bought = (_) => updateAvailability();
        freezePerma.maxLevel = 1;
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
    /* Mimick history
    Now that's quality of life.
    */
    {
        mimickPerma = theory.createPermanentUpgrade(5, currency,
        new ConstantCost(permaCosts[5]));
        mimickPerma.description = Localization.format(getLoc('permaMimick'),
        Utils.getMath('c'));
        mimickPerma.info = getLoc('permaMimickInfo');
        mimickPerma.maxLevel = 1;
    }

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
            nudge.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
        };
        cooldownMs.canBeRefunded = (amount) => nudge.level <=
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

    theory.createStoryChapter(0, getLoc('ch1Title'), getLoc('ch1Text'),
    () => true);
    theory.createStoryChapter(1, getLoc('ch2Title'), getLoc('ch2Text'),
    () => totalIncLevel >= 480);
    theory.createStoryChapter(2, getLoc('ch3Title'), getLoc('ch3Text'),
    () => totalIncLevel >= 1200);
    theory.createStoryChapter(3, getLoc('ch3bTitle'), getLoc('ch3bText'),
    () => theory.storyChapters[2].isUnlocked && (c == 1n || c == -1n));
    theory.createStoryChapter(4, getLoc('ch4Title'), getLoc('ch4Text'),
    () => mimickPerma.level > 0);

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
    // theory.secondaryEquationHeight = 66;
}

var updateAvailability = () =>
{
    freeze.isAvailable = freezePerma.level > 0;
    if(theory.autoBuyerUpgrade.level)
    {
        historyFrame.isVisible = true;
        historyLabel.isVisible = true;
        reachedFirstPub = true;
    }
    extraIncPerma.isAvailable = freezePerma.level > 0;
    mimickPerma.isAvailable = extraIncPerma.level > 0;
    if(mimickPerma.level)
    {
        mimickFrame.isVisible = true;
        mimickLabel.isVisible = true;
    }
    marathonBadge = theory.achievements[1].isUnlocked;
    extraInc.isAvailable = extraIncPerma.level > 0 &&
    nudge.level == nudge.maxLevel;
}

var tick = (elapsedTime, multiplier) =>
{
    if(elapsedTime > 0.1)
        longTickMsg = Localization.format(getLoc('longTick'),
        elapsedTime.toFixed(3));

    nudge.isAutoBuyable = false;
    extraInc.isAutoBuyable = false;

    if(freeze.level % 2 == 0)
    {
        time += elapsedTime * 10;
        if(time + 1e-8 >= cooldown[cooldownMs.level])
        {
            time -= cooldown[cooldownMs.level];
            cIterProgBar.progressTo(0, mimickLastHistory &&
            nextNudge in lastHistory && turns == lastHistory[nextNudge][0] - 2 ?
            0 : 33, Easing.LINEAR);

            if(c % 2n != 0)
                c = 3n * c + 1n;
            else
                c /= 2n;

            cSum += cBigNum;
            cBigNum = BigNumber.from(c);

            if(nudge.level > totalIncLevel)
                ++turns;

            if(mimickLastHistory)
            {
                while(nextNudge in lastHistory &&
                turns == lastHistory[nextNudge][0])
                {
                    nudge.buy(1);
                    ++nextNudge;
                }
            }

            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        else
            cIterProgBar.progressTo(Math.min(1,
            (time / (cooldown[cooldownMs.level] - 1)) ** 1.5), 100,
            Easing.LINEAR);
    }

    let dt = BigNumber.from(elapsedTime * multiplier);
    let q1Term = getq1(q1.level).pow(getq1Exponent(q1ExpMs.level));
    let q2Term = getq2(q2.level);
    let bonus = theory.publicationMultiplier;

    currency.value += dt * cSum.abs() * q1Term * q2Term * bonus;
}

var getEquationOverlay = () =>
{
    let result = ui.createGrid
    ({
        verticalOptions: LayoutOptions.FILL,
        rowDefinitions: ['1*', '1*'],
        columnDefinitions: ['1*', '2*', '1*'],
        children:
        [
            // For reference
            // ui.createFrame({row: 0, column: 2}),
            // ui.createFrame({row: 1, column: 2}),
            ui.createLatexLabel
            ({
                row: 0,
                column: 0,
                verticalTextAlignment: TextAlignment.START,
                margin: new Thickness(6, 3),
                text: getLoc('versionName')/* +
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
            historyLabel,
            // ui.createLatexLabel
            // ({
            //     row: 1,
            //     column: 2,
            //     horizontalOptions: LayoutOptions.END,
            //     verticalTextAlignment: TextAlignment.END,
            //     margin: new Thickness(6, 3),
            //     text: () => longTickMsg,
            //     fontSize: 9,
            //     textColor: Color.TEXT_MEDIUM
            // }),
            mimickFrame,
            mimickLabel
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
    let result = `\\begin{matrix}\\dot{\\rho}=q_1${q1ExpMs.level > 0 ?
    `^{${getq1Exponent(q1ExpMs.level)}}` : ''}q_2\\,|\\sum c\\,|,&
    ${theory.latexSymbol}=\\max{\\rho}^{0.1}\\end{matrix}`;
    return result;
}

var getTertiaryEquation = () =>
{
    let mStr = '';
    let cStr = `(${cBigNum < 0 ? '' : '+'}${cBigNum.toString(0)})`;
    if(reachedFirstPub)
        mStr = `t=${turns},&`;
    
    let csStr = `\\Sigma\\,c=${cSum.toString(0)}`;
    let mcStr = `\\begin{matrix}${mStr}${csStr}
    \\end{matrix}`;

    return `\\begin{array}{c}${mcStr}\\\\${cStr}\\end{array}`;
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
        horizontalTextAlignment: TextAlignment.CENTER,
    });
    let lastPubHistory = ui.createLatexLabel
    ({
        row: 2,
        column: 1,
        text: getSequence(lastHistory, historyNumMode, historyIdxMode),
        margin: new Thickness(3, 0, 0, 0),
        horizontalTextAlignment: TextAlignment.CENTER,
    });
    let historyGrid = ui.createGrid
    ({
        rowDefinitions:
        [
            'auto',
            'auto',
            'auto'
        ],
        columnDefinitions: ['1*', '1*'],
        columnSpacing: 0,
        children:
        [
            ui.createLatexLabel
            ({
                row: 0,
                column: 0,
                margin: new Thickness(0, 2, 0, 0),
                text: getLoc('labelCurrentRun'),
                horizontalTextAlignment: TextAlignment.CENTER,
                verticalTextAlignment: TextAlignment.END
            }),
            ui.createLatexLabel
            ({
                row: 0,
                column: 1,
                margin: new Thickness(0, 2, 0, 0),
                text: getLoc('labelLastRun'),
                horizontalTextAlignment: TextAlignment.CENTER,
                verticalTextAlignment: TextAlignment.END
            }),
            ui.createBox
            ({
                row: 1,
                column: 0,
                heightRequest: 1,
                margin: new Thickness(0, 6)
            }),
            ui.createBox
            ({
                row: 1,
                column: 1,
                heightRequest: 1,
                margin: new Thickness(0, 6)
            }),
            currentPubHistory,
            lastPubHistory
        ]
    });
    let tmpPreserve = preserveLastHistory;
    let preserveSwitch = ui.createSwitch
    ({
        isToggled: tmpPreserve,
        row: 0,
        column: 1,
        horizontalOptions: LayoutOptions.END,
        onTouched: (e) =>
        {
            if(e.type == TouchType.SHORTPRESS_RELEASED ||
            e.type == TouchType.LONGPRESS_RELEASED)
            {
                Sound.playClick();
                tmpPreserve = !tmpPreserve;
                preserveSwitch.isToggled = tmpPreserve;
            }
        }
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
                    rowDefinitions: [getBtnSize(ui.screenWidth)],
                    columnDefinitions: ['8*', '5*', '9*'],
                    columnSpacing: 8,
                    margin: new Thickness(0, 6),
                    children:
                    [
                        toggleIdxButton,
                        toggleNumButton,
                        toggleLvlButton
                    ]
                }),
                // ui.createBox
                // ({
                //     heightRequest: 1,
                //     margin: new Thickness(0, 6)
                // }),
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
                ui.createGrid
                ({
                    rowDefinitions: [getImageSize(ui.screenWidth)],
                    columnDefinitions: ['4*', '1*'],
                    margin: new Thickness(0, 0, 0, 6),
                    children:
                    [
                        ui.createLatexLabel
                        ({
                            text: getLoc('labelPreserve'),
                            row: 0,
                            column: 0,
                            verticalTextAlignment: TextAlignment.CENTER
                        }),
                        preserveSwitch
                    ]
                }),
                ui.createButton
                ({
                    text: getLoc('btnSave'),
                    onClicked: () =>
                    {
                        Sound.playClick();
                        preserveLastHistory = tmpPreserve;
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
    totalIncLevel = nudge.level - getIncrementPenalty(extraInc.level);
    if(!preserveLastHistory)
        lastHistory = history;
    lastHistoryLength = Object.keys(lastHistory).length;
}

var postPublish = () =>
{
    turns = 0;
    time = 0;
    // Disabling history write circumvents the extra levelling
    writeHistory = false;
    nudge.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
    nudge.level = totalIncLevel;
    writeHistory = true;
    history = {};
    // c is reset to 0 afterwards

    c = 0n;
    cBigNum = BigNumber.from(c);
    cSum = cBigNum;
    cIterProgBar.progressTo(0, 220, Easing.CUBIC_INOUT);

    if(mimickLastHistory)
        nextNudge = binarySearch(Object.keys(lastHistory), turns);

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
    updateAvailability();
}

var canResetStage = () => !theory.canPublish || extraInc.level == 0;

var getResetStageMessage = () => getLoc('reset');

var resetStage = () =>
{
    if(theory.canPublish && extraInc.level)
        return;

    for(let i = 0; i < theory.upgrades.length; ++i)
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
    cSum: cSum.toBase64String(),
    totalIncLevel: totalIncLevel,
    history: history,
    lastHistory: lastHistory,
    historyNumMode: historyNumMode,
    historyIdxMode: historyIdxMode,
    mimickLastHistory: mimickLastHistory,
    preserveLastHistory: preserveLastHistory,
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
        cIterProgBar.progress = Math.min(1,
        (time / (cooldown[cooldownMs.level] - 1)) ** 1.5);
    }
    if('c' in state)
    {
        c = BigInt(state.c);
        cBigNum = BigNumber.from(c);
    }
    if('cSum' in state)
        cSum = BigNumber.fromBase64String(state.cSum);
    else
        cSum = cBigNum;

    let tmpIML = cLevelCap[cooldownMs.level];
    if('totalIncLevel' in state)
    {
        totalIncLevel = state.totalIncLevel;
        tmpIML += totalIncLevel;
    }
    nudge.maxLevel = tmpIML;

    if('history' in state)
        history = state.history;

    if('mimickLastHistory' in state)
        mimickLastHistory = mimickPerma.level > 0 ?
        state.mimickLastHistory : false;
    if('preserveLastHistory' in state)
        preserveLastHistory = state.preserveLastHistory;
    if('lastHistory' in state)
    {
        lastHistory = state.lastHistory;
        LHObj = Object.keys(lastHistory);
        lastHistoryLength = LHObj.length;
        if(mimickLastHistory)
            nextNudge = binarySearch(LHObj, turns);
    }
    if('historyNumMode' in state)
        historyNumMode = state.historyNumMode;
    if('historyIdxMode' in state)
        historyIdxMode = state.historyIdxMode;

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

init();
