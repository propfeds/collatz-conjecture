import { BigNumber } from '../api/BigNumber';
import { ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from
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
var version = 0.04;

const menuLang = Localization.language;
const cColour = new Map();
cColour.set(Theme.STANDARD, 'c0c0c0');
cColour.set(Theme.DARK, 'b5b5b5');
cColour.set(Theme.LIGHT, '434343');

const cIterProgBar = ui.createProgressBar
({
    margin: new Thickness(6, 0)
});

const locStrings =
{
    en:
    {
        versionName: 'v0.04, Work \\\\\nin Progress',
        
        historyDesc: 'History',
        historyInfo: 'Shows the last and current runs\' sequences',
        pausecDesc: ['\\text{Freeze }c', '\\text{Unfreeze }c'],
        pausecInfo: '\\text{Freezes }c\\text{\'s value}',

        permaPause: '\\text{{the ability to freeze }}c',
        permaPreserveDesc: '\\text{Preserve }c\\text{ after publishing}',
        permaPreserveInfo: '\\text{Preserves }c\\text{ after publishing}',

        c1Level: 'c_1\\text{{ level}}',
        cLevel: '1/{{{0}}}\\text{{{{ of }}}}c\\text{{{{\'s level}}}}',
        cLevelCap: 'c\\text{{ level cap}}',
        cooldown: '\\text{{interval}}',
        cooldownInfo: 'Interval',
        nTicks: '{{{0}}}\\text{{{{ ticks}}}}',

        alternating: ' (alternating)',

        btnClose: 'Close',
        btnNumDispMode:
        [
            'Numbers: Decimal',
            'Numbers: Scientific',
            'Numbers: Binary'
        ],
        btnLvlDispMode: ['Levels: Total', 'Levels: Offset'],
        errorInvalidNumMode: 'Invalid number mode',

        menuHistory: 'Sequence History',
        labelCurrentRun: 'Current publication:',
        labelLastRun: 'Last publication:',

        reset: 'You are about to reset the current publication.\nNote: resetting is only available before publishing opens.',
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
    let s = n;
    if(typeof s !== 'string')
        s = s.toString();
    if(s.length > 9)
        s = `${s.slice(0, 5)}...${s.slice(-3)}`;
    return s;
}

let getShorterString = (n) =>
{
    let s = n;
    if(typeof s !== 'string')
        s = s.toString();
    if(s.length > 7)
        s = `${s.slice(0, 3)}...${s.slice(-3)}`;
    return s;
}

let getShortBinaryString = (n) =>
{
    let s = n;
    if(typeof s === 'string')
        s = BigInt(s);
    s = s.toString(2);
    if(s.length > 9)
        s = `${s.slice(0, 3)}...${s.slice(-5)}`;
    return s;
}

let getShorterBinaryString = (n) =>
{
    let s = n;
    if(typeof s === 'string')
        s = BigInt(s);
    s = s.toString(2);
    if(s.length > 7)
        s = `${s.slice(0, 1)}...${s.slice(-5)}`;
    return s;
}

let getStringFromNumMode = (n, numMode = 0) =>
{ 
    switch(numMode)
    {
        case 0:
            return getShorterString(n);
        case 1:
            return BigNumber.from(n).toString(0);
        case 2:
            return getShorterBinaryString(n);
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
        ${getStringFromNumMode(sequence[key], numMode)}&\\leftarrow
        ${key & 1 ? '+1' : '-1'}`;
        ++i;
    }
    result += '&\\end{array}';

    return Utils.getMath(result);
}

let BIObjtoString = (sequence) =>
{
    let result = {};
    for(key in sequence)
        result[key] = sequence[key].toString();
    
    return result;
}

let stringObjtoBI = (sequence) =>
{
    let result = {};
    for(key in sequence)
        result[key] = BigInt(sequence[key]);
    
    return result;
}

const getc1 = (level) =>
{
    if(c1BorrowMs.level > 0)
        return Utils.getStepwisePowerSum(level + incrementc.level /
        borrowFactor, 2, 5, 1);
    
    return Utils.getStepwisePowerSum(level, 2, 5, 1);
}
const borrowFactor = 2;
const c1Cost = new FirstFreeCost(new ExponentialCost(1, 3.01));
const c1ExpInc = 0.03;
const c1ExpMaxLevel = 4;
const getc1Exponent = (level) => BigNumber.from(1 + c1ExpInc * level);
const getc2 = (level) => BigNumber.TWO.pow(level);
const c2Cost = new ExponentialCost(1e6, 11);

const pubExp = 5.22;
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

const permaCosts = bigNumArray(['1e12', '1e22', '1e31', '1e66']);
const milestoneCost = new LinearCost(4.4, 4.4);

const cLevelCap = [24, 36, 52, 72];
const cooldown = [44, 30, 18, 10];

let time = 0;
let c = 0n;
let cBigNum = BigNumber.from(c);
let tmpTime = 0;
let tmpc = 0n;
let totalIncLevel = 0;
let incRemainder = 0;
let history = {};
let lastHistory;
let writeHistory = true;
let historyNumMode = 0;
let historyLvlMode = 1;

var pausec;
var incrementc, c1, c2;
var pausePerma;
var cooldownMs, c1BorrowMs, c1ExpMs;

var currency;

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
        let getDesc = (level) =>
        {
            if(c1ExpMs.level > 0)
                return `c_1=${getc1(level).toString(0)}^{${getc1Exponent(
                c1ExpMs.level)}}`;
            
            return `c_1=${getc1(level).toString(0)}`;
        }
        let getInfo = (level) => `c_1=${getc1(level).pow(
        getc1Exponent(c1ExpMs.level)).toString()}`;
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
    Shame that we never got the chance to test out this one. Other than breaking
    progression, it can also pose a threat to the theory's performance.
    */
    // {
    //     preservePerma = theory.createPermanentUpgrade(4, currency,
    //     new ConstantCost(permaCosts[4]));
    //     preservePerma.description = Utils.getMath(getLoc('permaPreserveDesc'));
    //     preservePerma.info = Utils.getMath(getLoc('permaPreserveInfo'));
    //     preservePerma.maxLevel = 1;
    // }

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
            incrementc.maxLevel = totalIncLevel + incRemainder +
            cLevelCap[cooldownMs.level];
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
        'c1Level'), Localization.format(getLoc('cLevel'), borrowFactor));
        c1BorrowMs.info = Localization.getUpgradeIncCustomInfo(getLoc(
        'c1Level'), Localization.format(getLoc('cLevel'), borrowFactor));
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

    updateAvailability();

    theory.primaryEquationHeight = 66;
    theory.primaryEquationScale = 0.9;
}

var updateAvailability = () =>
{
    pausec.isAvailable = pausePerma.level > 0;
}

var tick = (elapsedTime, multiplier) =>
{
    if(pausec.level % 2 == 0)
    {
        ++time;
        if(time >= cooldown[cooldownMs.level])
        {
            cIterProgBar.progressTo(0, 99, Easing.LINEAR);
            if(c % 2n != 0)
                c = 3n * c + 1n;
            else
                c /= 2n;

            cBigNum = BigNumber.from(c);
            theory.invalidatePrimaryEquation();
            theory.invalidateTertiaryEquation();
            time -= cooldown[cooldownMs.level];
        }
        else// if(time == 1)
            cIterProgBar.progressTo((time / (cooldown[cooldownMs.level] - 1)) **
            1.5, 110, Easing.LINEAR);
            // cIterProgBar.progressTo(1, (cooldown[cooldownMs.level] - 1 - time) * 100, Easing.CUBIC_IN);
    }

    let dt = BigNumber.from(elapsedTime * multiplier);
    let vc1 = getc1(c1.level).pow(getc1Exponent(c1ExpMs.level));
    let vc2 = getc2(c2.level);
    let bonus = theory.publicationMultiplier;

    currency.value += dt * cBigNum.abs() * vc1 * vc2 * bonus;
}

let createHistoryMenu = () =>
{
    let toggleNumMode = () =>
    {
        historyNumMode = (historyNumMode + 1) % 3;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyLvlMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyLvlMode);
        toggleNumButton.text = getLoc('btnNumDispMode')[historyNumMode];
        theory.invalidatePrimaryEquation();
    };
    let toggleNumButton = ui.createButton
    ({
        row: 0,
        column: 1,
        text: getLoc('btnNumDispMode')[historyNumMode],
        onClicked: () =>
        {
            Sound.playClick();
            toggleNumMode();
        }
    });
    let toggleLvlMode = () =>
    {
        historyLvlMode = 1 - historyLvlMode;
        currentPubHistory.text = getSequence(history, historyNumMode,
        historyLvlMode);
        lastPubHistory.text = getSequence(lastHistory, historyNumMode,
        historyLvlMode);
        toggleLvlButton.text = getLoc('btnLvlDispMode')[historyLvlMode];
    };
    let toggleLvlButton = ui.createButton
    ({
        row: 0,
        column: 0,
        text: getLoc('btnLvlDispMode')[historyLvlMode],
        onClicked: () =>
        {
            Sound.playClick();
            toggleLvlMode();
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

var getEquationOverlay = () =>
{
    let historyButton = ui.createImage
    ({
        // margin: new Thickness(2),
        source: ImageSource.BOOK,
        aspect: Aspect.ASPECT_FIT,
        useTint: false
    });

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
                margin: new Thickness(5, 3),
                text: getLoc('versionName'),
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
            ui.createFrame
            ({
                row: 0,
                column: 2,
                cornerRadius: 1,
                horizontalOptions: LayoutOptions.END,
                verticalOptions: LayoutOptions.START,
                margin: new Thickness(10, 9),
                hasShadow: true,
                heightRequest: 24,
                content: historyButton,
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
            }),
            ui.createLatexLabel
            ({
                row: 0,
                column: 2,
                horizontalOptions: LayoutOptions.END,
                verticalOptions: LayoutOptions.START,
                margin: new Thickness(1, 36),
                text: getLoc('historyDesc'),
                fontSize: 10,
                textColor: () => Color.fromHex(cColour.get(game.settings.theme))
            }),
        ]
    });
    return result;
}

var getPrimaryEquation = () =>
{
    let cStr = historyNumMode == 2 ? getShortBinaryString(c) :
    getShortString(c);
    let result = `\\begin{matrix}c=\\begin{cases}c/2,&\\text{if }c\\equiv0
    \\text{ (mod 2)}\\\\\\\\3c+1,&\\text{if }c\\equiv1\\text{ (mod 2)}
    \\end{cases}\\\\\\\\\\color{#${cColour.get(game.settings.theme)}}{=${cStr}}
    \\end{matrix}`;

    return result;
}

var getSecondaryEquation = () =>
{
    let result = `\\begin{matrix}\\dot{\\rho}=c_1${c1ExpMs.level > 0 ? `^{${getc1Exponent(c1ExpMs.level)}}` : ''}c_2|c|,&${theory.latexSymbol}=\\max{\\rho}^{0.1}\\end{matrix}`;
    return result;
}

var getTertiaryEquation = () =>
{
    let result;
    if(c > 1e6 || c < -1e6)
        result = `c=${cBigNum}`;
    else
        result = '';
    return result;
}

var getPublicationMultiplierFormula = (symbol) =>
`\\frac{{${symbol}}^{${pubExp}}}{${pubMult}}`;

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
    // if(preservePerma.level > 0)
    // {
    //     tmpTime = time;
    //     tmpc = c;
    // }
    totalIncLevel = incrementc.level;
    // incRemainder = incrementc.maxLevel - incrementc.level;
    lastHistory = history;
}

var postPublish = () =>
{
    if(true/*preservePerma.level == 0*/)
    {
        time = 0;
        cIterProgBar.progressTo(0, 220, Easing.CUBIC_INOUT);
        c = 0n;
        cBigNum = BigNumber.from(c);
    }
    // This is to circumvent the extra levelling
    writeHistory = false;
    tmpc = c;
    incrementc.level = totalIncLevel;
    c = tmpc;
    writeHistory = true;
    cBigNum = BigNumber.from(c);
    incrementc.maxLevel = totalIncLevel + incRemainder +
    cLevelCap[cooldownMs.level];

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
    history = {};
}

var canResetStage = () => !theory.canPublish ||
theory.permanentUpgrades[0].level == 0;

var getResetStageMessage = () => getLoc('reset');

var resetStage = () =>
{
    /*
    You could exploit the c levelling mechanism by resetting to 0 before a pub
    and get 24 levels for free. Now you can't.
    */
    if(theory.canPublish && theory.permanentUpgrades[0].level > 0)
        return;

    for (let i = 0; i < theory.upgrades.length; ++i)
        theory.upgrades[i].level = 0;

    currency.value = 0;
    // if(preservePerma.level > 0)
    // {
    //     time = tmpTime;
    //     c = tmpc;
    //     cBigNum = BigNumber.from(c);
    // }
    theory.clearGraph();
    postPublish();
}

var getInternalState = () => JSON.stringify
({
    version: version,
    time: time,
    c: c.toString(),
    tmpTime: tmpTime,
    tmpc: tmpc.toString(),
    totalIncLevel: totalIncLevel,
    // incRemainder: incRemainder,
    history: history,
    lastHistory: lastHistory,
    historyNumMode: historyNumMode,
    historyLvlMode: historyLvlMode
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
    if('tmpTime' in state)
        tmpTime = state.tmpTime;
    if('tmpc' in state)
        tmpc = BigInt(state.tmpc);

    let tmpIML = cLevelCap[cooldownMs.level];
    if('totalIncLevel' in state)
    {
        totalIncLevel = state.totalIncLevel;
        tmpIML += totalIncLevel;
    }
    if('incRemainder' in state)
    {
        // incRemainder = state.incRemainder;
        // tmpIML += incRemainder;
    }
    incrementc.maxLevel = tmpIML;

    if('history' in state)
        history = state.history;
    if('lastHistory' in state)
        lastHistory = state.lastHistory;
    if('historyNumMode' in state)
        historyNumMode = state.historyNumMode;
    if('historyLvlMode' in state)
        historyLvlMode = state.historyLvlMode;

    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

init();
