import { BigNumber } from '../api/BigNumber';
import { CompositeCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from
'../api/Costs';
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

'If it's odd, triple it plus one,
If it's even, divide it in two.

If you woke up today and ate bread,
what would you do?'`,
    };

    return descs[language] || descs.en;
}
var authors = 'propfeds#5988\n\nThanks to:\nCipher#9599, for the idea';
var version = 0.06;

const cDispColour = new Map();
cDispColour.set(Theme.STANDARD, 'c0c0c0');
cDispColour.set(Theme.DARK, 'b5b5b5');
cDispColour.set(Theme.LIGHT, '434343');

const menuLang = Localization.language;
const locStrings =
{
    en:
    {
        versionName: 'v0.06',
        workInProgress: ', Work in\\\\Progress',

        historyDesc: `\\begin{{array}}{{c}}\\text{{History}}\\\\{{{0}}}/{{{1}}}
\\end{{array}}`,
        historyInfo: 'Shows the last and current runs\' sequences',
        pausecDesc: ['\\text{Freeze }c', '\\text{Unfreeze }c'],
        pausecInfo: '\\text{Freezes }c\\text{\'s value}',

        permaPause: '\\text{{the ability to freeze }}c',
        permaPreserveDesc: '\\text{Preserve }c\\text{ after publishing}',
        permaPreserveInfo: '\\text{Preserves }c\\text{ after publishing}',

        c1Level: 'c_1\\text{{ level}}',
        cLevel: '1/{{{0}}}\\text{{{{ of }}}}c\\text{{{{\'s level}}}}',
        cLevelth: `1/{{{0}}}^\\text{{{{th}}}}\\text{{{{ of }}}}c
        \\text{{{{\'s level}}}}`,
        cLevelCap: 'c\\text{{ level cap}}',
        cooldown: '\\text{{interval}}',
        cooldownInfo: 'Interval',
        nTicks: '{{{0}}}\\text{{{{ ticks}}}}',

        alternating: ' (alternating)',

        achNegativeTitle: 'Shadow Realm',
        achNegativeDesc: `Publish with an odd c level and go negative.`,
        achMarathonTitle: 'Lothar-athon',
        achMarathonDesc: 'Reach a c value of 1e60.',
        achSixNineTitle: 'I\'m proud of you.',
        achSixNineDesc: 'Reach a c value of 69.',

        btnClose: 'Close',
        btnNotationMode: ['Notation: Digits', 'Notation: Scientific'],
        btnBaseMode: ['Base: 10', 'Base: 2'],
        errorInvalidNumMode: 'Invalid number mode',
        errorBinExpLimit: 'Too big',

        menuHistory: 'Sequence History',
        labelCurrentRun: 'Current publication:',
        labelLastRun: 'Last publication:',

        reset: 'You are about to reset the current publication.'
    }
};

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

let bigNumArray = (array) => array.map(x => BigNumber.from(x));

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

    if(s.length < 9)
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

let getSequence = (sequence, numMode = 0, lvlMode = 0) =>
{
    let result = '\\begin{array}{rrr}';
    let i = 0;
    let start;
    for(key in sequence)
    {
        if(i)
            result += '\\\\';
        else
            start = Number(key) - 1;
        result += `${lvlMode ? Number(key) - start : key}:&
        ${getStringForm(sequence[key], numMode)}&(${key & 1 ? '+1' : '-1'})`;
        ++i;
    }
    result += '&\\end{array}';

    return Utils.getMath(result);
}

const getc1 = (level) => Utils.getStepwisePowerSum(level + Math.floor(
c1BorrowMs.level * incrementc.level / borrowFactor), 2, 5, 1);
const borrowFactor = 4;
const c1Cost = new FirstFreeCost(new ExponentialCost(1, 3.01));
const c1ExpInc = 0.07;
const c1ExpMaxLevel = 4;
const getc1Exponent = (level) => 1 + c1ExpInc * level;
const getc2 = (level) => BigNumber.TWO.pow(level);
const c2Cost = new ExponentialCost(1e6, 11);

const pubExp = 5.12;
const pubMult = 31;
var getPublicationMultiplier = (tau) => tau.pow(pubExp) /
BigNumber.from(pubMult);
const tauRate = 0.1;
var getTau = () => currency.value.pow(BigNumber.from(tauRate));
var getCurrencyFromTau = (tau) =>
[
    tau.max(BigNumber.ONE).pow(BigNumber.ONE / tauRate),
    currency.symbol
];

const permaCosts = bigNumArray(['1e12', '1e22', '1e31', '1e54']);
const milestoneCost = new CompositeCost(2, new LinearCost(4.4, 4.4),
new CompositeCost(2, new LinearCost(13.2, 8.8), new LinearCost(30.8, 13.2)));

const cLevelCap = [24, 36, 52, 72];
const cooldown = [42, 30, 20, 12];

let time = 0;
let c = 0n;
let cBigNum = BigNumber.from(c);
let totalIncLevel = 0;
let history = {};
let lastHistory;
let lastHistoryLength = 0;
let writeHistory = true;
let historyNumMode = 0;
let historyLvlMode = 1;

var pausec;
var incrementc, c1, c2;
var pausePerma;
var cooldownMs, c1BorrowMs, c1ExpMs;

var currency;

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
    (incrementc ? incrementc.level : 0) - totalIncLevel, lastHistoryLength)),
    fontSize: 9,
    textColor: () => Color.fromHex(cDispColour.get(game.settings.theme))
});

var init = () =>
{
    currency = theory.createCurrency();
    /* Freeze
    Freeze c's value and the timer in place, which allows for idling. This will
    become more important later on, and also helps with farming c levels.
    */
    {
        pausec = theory.createSingularUpgrade(3, currency, new FreeCost);
        pausec.getDescription = () => Utils.getMath(getLoc(
        'pausecDesc')[pausec.level & 1]);
        pausec.info = Utils.getMath(getLoc('pausecInfo'));
    }
    /* c
    The theory's core mechanic revolves around nudging c around. This upgrade
    alternates between incrementing and decrementing by 1. If an increment nudge
    is used on a number divisible by 4, the next number will become divisible by
    4 again, which can be super annoying.
    */
    {
        let getDesc = (level) => `c \\leftarrow c${level & 1 ? '-' : '+'}1
        \\text{${getLoc('alternating')}}`;
        incrementc = theory.createUpgrade(0, currency, new FreeCost);
        incrementc.getDescription = (_) => Utils.getMath(
        getDesc(incrementc.level));
        incrementc.getInfo = (_) => `${incrementc.level & 1 ?
        Localization.getUpgradeDecCustomInfo('c', 1) :
        Localization.getUpgradeIncCustomInfo('c', 1)}${getLoc('alternating')}`;
        incrementc.bought = (_) =>
        {
            if(writeHistory)
                history[incrementc.level] = c.toString();
            // even level: -1, odd level: +1, because this is post-processing
            if(incrementc.level & 1)
                c += 1n;
            else
                c -= 1n;

            cBigNum = BigNumber.from(c);
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
        }
        incrementc.isAutoBuyable = false;
        incrementc.maxLevel = cLevelCap[0];
    }
    /* c1
    Most theories use a (2, 10) stepwise power, which I criticise to be too weak
    to be worth putting autobuy on. In Botched, a (3, 6) was used, and c1's cost
    there would align with c2 near perfectly at ~6 c1 upgrades per c2 upgrade.
    Collatz uses a (2, 5), which aligns more with tradition, while being twice
    more powerful.
    */
    {
        let getDesc = (level) => `c_1=${getc1(level).toString(0)}`;
        let getInfo = (level) =>
        {
            if(c1ExpMs.level > 0)
                return `c_1^{${getc1Exponent(c1ExpMs.level)}}=
                ${getc1(level).pow(getc1Exponent(c1ExpMs.level)).toString()}`;

            return getDesc(level);
        }
        c1 = theory.createUpgrade(1, currency, c1Cost);
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getInfo(c1.level),
        getInfo(c1.level + amount));
    }
    /* c2
    Standard doubling upgrade.
    */
    {
        let getDesc = (level) => `c_2=2^{${level}}`;
        let getInfo = (level) => `c_2=${getc2(level).toString(0)}`;
        c2 = theory.createUpgrade(2, currency, c2Cost);
        c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level),
        getInfo(c2.level + amount));
    }

    theory.createPublicationUpgrade(0, currency, permaCosts[0]);
    theory.permanentUpgrades[0].bought = (_) => updateAvailability();
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
            incrementc.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
        };
        cooldownMs.canBeRefunded = (amount) => incrementc.level <=
        totalIncLevel + cLevelCap[cooldownMs.level - amount];
    }
    /* Level borrowing
    It'll be useless for a while at first when you unlock it at e44. But, it can
    be farmed simply by doing a bunch of empty publishes at 1.00 multiplier.
    */
    {
        c1BorrowMs = theory.createMilestoneUpgrade(1, 1);
        c1BorrowMs.description = Localization.getUpgradeIncCustomDesc(getLoc(
        'c1Level'), Localization.format(getLoc('cLevelth'), borrowFactor));
        c1BorrowMs.info = Localization.getUpgradeIncCustomInfo(getLoc(
        'c1Level'), Localization.format(getLoc('cLevelth'), borrowFactor));
    }
    /* c1 exponent
    Standard exponent upgrade.
    */
    {
        c1ExpMs = theory.createMilestoneUpgrade(2, c1ExpMaxLevel);
        c1ExpMs.description = Localization.getUpgradeIncCustomExpDesc('c_1',
        c1ExpInc);
        c1ExpMs.info = Localization.getUpgradeIncCustomExpInfo('c_1', c1ExpInc);
        c1ExpMs.boughtOrRefunded = (_) => theory.invalidateSecondaryEquation();
    }

    theory.createAchievement(0, undefined, getLoc('achNegativeTitle'),
    getLoc('achNegativeDesc'), () => cBigNum < 0);
    theory.createAchievement(1, undefined, getLoc('achMarathonTitle'),
    getLoc('achMarathonDesc'), () => cBigNum >= 1e60, () => c == 0n ? 0 :
    cBigNum.log10().toNumber() / 60);
    theory.createAchievement(2, undefined, getLoc('achSixNineTitle'),
    getLoc('achSixNineDesc'), () => c == 69n);

    updateAvailability();

    theory.primaryEquationHeight = 66;
    theory.primaryEquationScale = 0.9;

}

var updateAvailability = () =>
{
    pausec.isAvailable = pausePerma.level > 0;
    historyFrame.isVisible = theory.permanentUpgrades[0].level > 0;
    historyLabel.isVisible = theory.permanentUpgrades[0].level > 0;
}

var tick = (elapsedTime, multiplier) =>
{
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
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
            time -= cooldown[cooldownMs.level];
        }
        else
            cIterProgBar.progressTo((time / (cooldown[cooldownMs.level] - 1)) **
            1.5, 110, Easing.LINEAR);
    }

    let dt = BigNumber.from(elapsedTime * multiplier);
    let vc1 = getc1(c1.level).pow(getc1Exponent(c1ExpMs.level));
    let vc2 = getc2(c2.level);
    let bonus = theory.publicationMultiplier;

    currency.value += dt * cBigNum.abs() * vc1 * vc2 * bonus;
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
                text: getLoc('versionName') + getLoc('workInProgress'),
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
    let result = `\\begin{matrix}c\\leftarrow\\begin{cases}c/2&\\text{if }c
    \\equiv0\\text{ (mod 2)}\\\\3c+1&\\text{if }c\\equiv1\\text{ (mod 2)}
    \\end{cases}\\\\\\\\\\color{#${cDispColour.get(game.settings.theme)}}
    {=${cStr}${historyNumMode & 2 ? '_2' : ''}}\\end{matrix}`;

    return result;
}

var getSecondaryEquation = () =>
{
    let result = `\\begin{matrix}\\dot{\\rho}=c_1${c1ExpMs.level > 0 ?
    `^{${getc1Exponent(c1ExpMs.level)}}` : ''}c_2|c|,&${theory.latexSymbol}
    =\\max{\\rho}^{0.1}\\end{matrix}`;
    return result;
}

var getTertiaryEquation = () =>
{
    let result;
    if(historyNumMode & 2 || c > 1e6 || c < -1e6)
        result = `c=${cBigNum.toString(0)}`;
    else
        result = '';
    return result;
}

var getPublicationMultiplierFormula = (symbol) =>
`\\frac{{${symbol}}^{${pubExp}}}{${pubMult}}`;

let createHistoryMenu = () =>
{
    let toggleBaseMode = () =>
    {
        historyNumMode = historyNumMode ^ 2;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyLvlMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyLvlMode);
        toggleLvlButton.text = getLoc('btnBaseMode')[(historyNumMode & 2) >>
        1];
        theory.invalidatePrimaryEquation();
        theory.invalidateTertiaryEquation();
    };
    let toggleLvlButton = ui.createButton
    ({
        row: 0,
        column: 0,
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
        historyLvlMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyLvlMode);
        toggleNumButton.text = getLoc('btnNotationMode')[historyNumMode & 1];
    };
    let toggleNumButton = ui.createButton
    ({
        row: 0,
        column: 1,
        text: getLoc('btnNotationMode')[historyNumMode & 1],
        onClicked: () =>
        {
            Sound.playClick();
            toggleNotationMode();
        }
    });
    let currentPubHistory = ui.createLatexLabel
    ({
        column: 0,
        horizontalOptions: LayoutOptions.CENTER,
        text: getSequence(history, historyNumMode, historyLvlMode)
    });
    let lastPubHistory = ui.createLatexLabel
    ({
        column: 1,
        horizontalOptions: LayoutOptions.CENTER,
        text: getSequence(lastHistory, historyNumMode, historyLvlMode)
    });
    let historyGrid = ui.createGrid
    ({
        columnDefinitions: ['1*', '1*'],
        // columnSpacing: 8,
        children:
        [
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
                    rowDefinitions: ['44', '24'],
                    columnDefinitions: ['1*', '1*'],
                    columnSpacing: 12,
                    children:
                    [
                        toggleNumButton,
                        toggleLvlButton,
                        ui.createLatexLabel
                        ({
                            row: 1,
                            column: 0,
                            text: getLoc('labelCurrentRun'),
                            horizontalOptions: LayoutOptions.CENTER,
                            verticalOptions: LayoutOptions.END
                        }),
                        ui.createLatexLabel
                        ({
                            row: 1,
                            column: 1,
                            text: getLoc('labelLastRun'),
                            horizontalOptions: LayoutOptions.CENTER,
                            verticalOptions: LayoutOptions.END
                        })
                    ]
                }),
                ui.createBox
                ({
                    heightRequest: 1,
                    margin: new Thickness(0, 6)
                }),
                ui.createScrollView
                ({
                    // heightRequest: ui.screenHeight * 0.32,
                    content: historyGrid
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

// Will not trigger if you press reset.
var prePublish = () =>
{
    totalIncLevel = incrementc.level;
    lastHistory = history;
    lastHistoryLength = Object.keys(lastHistory).length;
}

var postPublish = () =>
{
    time = 0;
    // Disabling history write circumvents the extra levelling
    writeHistory = false;
    incrementc.maxLevel = totalIncLevel + cLevelCap[cooldownMs.level];
    incrementc.level = totalIncLevel;
    writeHistory = true;
    history = {};
    // c is reset to 0 afterwards
    c = 0n;
    cBigNum = BigNumber.from(c);
    cIterProgBar.progressTo(0, 220, Easing.CUBIC_INOUT);

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

var canResetStage = () => true;

var getResetStageMessage = () => getLoc('reset');

var resetStage = () =>
{
    for (let i = 0; i < theory.upgrades.length; ++i)
        theory.upgrades[i].level = 0;

    currency.value = 0;
    theory.clearGraph();
    postPublish();
}

var getInternalState = () => JSON.stringify
({
    version: version,
    time: time,
    c: c.toString(),
    totalIncLevel: totalIncLevel,
    history: history,
    lastHistory: lastHistory,
    historyNumMode: historyNumMode
})

var setInternalState = (stateStr) =>
{
    if(!stateStr)
        return;

    let state = JSON.parse(stateStr);
    if('time' in state)
    {
        time = state.time;
        cIterProgBar.progressTo((time / (cooldown[cooldownMs.level] - 1)) **
        1.5, 220, Easing.CUBIC_INOUT);
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
    incrementc.maxLevel = tmpIML;

    if('history' in state)
        history = state.history;
    if('lastHistory' in state)
    {
        lastHistory = state.lastHistory;    
        lastHistoryLength = Object.keys(lastHistory).length;
    }
    if('historyNumMode' in state)
        historyNumMode = state.historyNumMode;

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

init();
