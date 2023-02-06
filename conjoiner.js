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

var id = 'collatz_conjoiner';
var getName = (language) =>
{
    let names =
    {
        en: 'Collatz Conjoiner',
    };

    return names[language] || names.en;
}
var getDescription = (language) =>
{
    let descs =
    {
        en:
`A companion theory to Collatz Conjecture that allows you to create your own ` +
`sequences.

Warning: for spoiler purposes, it is ill-advised to
share your sequences to new players.

'If it's odd, triple it plus one,
If it's even, divide it in two.

If this second was your life,
what would you do?'`,
    };

    return descs[language] || descs.en;
}
var authors = 'propfeds#5988\n\nThanks to:\nd4Nf6Bg51-0#2276, for the idea';
var version = 0.01;

let turns = 0;
let c = 0n;
let cBigNum = BigNumber.from(c);
let choices = ['0'];
let tmpRho = 0;
let history = {};
let lastHistory;
let lastHistoryLength = 0;
let historyNumMode = 0;
let historyIdxMode = 0;
let reachedFirstPub = true;

const getIncrementPenalty = (level) => Utils.getStepwisePowerSum(level,
2, 4, 0).toNumber();

var getPublicationMultiplier = (tau) => tau;
var getPublicationMultiplierFormula = (symbol) => `${symbol}`;

var pausec;
var nudgec, choiceNav, incrementc;
var extraIncPerma;

var currency;

const locStrings =
{
    en:
    {
        versionName: 'v0.01',
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
        choiceNav: 'Navigate choices',
        choiceNavInfo: 'Buy to move forward, refund to move backwards',
        choice: `\\begin{{array}}{{c}}\\text{{Choose next number: }}{{{0}}}
        \\\\({{{1}}})\\end{{array}}`,

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

        reset: `You are about to reset the current publication.`
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
    (nudgec ? nudgec.level : 0) + (incrementc ? incrementc.level : 0),
    lastHistoryLength)),
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
            // even level: -1, odd level: +1, because this is post-processing
            let target = choices[choiceNav.level];
            turns += choiceNav.level;
            history[nudgec.level] = [turns, target];
            if(nudgec.level & 1)
                c = BigInt(target) + 1n;
            else
                c = BigInt(target) - 1n;

            cBigNum = BigNumber.from(c);
            choices = [c.toString()];
            choiceNav.level = 1;
            if(nudgec.level >= 24)
            {
                currency.value += 1;
                updateAvailability();
            }
            theory.invalidatePrimaryEquation();
            theory.invalidateSecondaryEquation();
            theory.invalidateTertiaryEquation();
        }
        nudgec.isAutoBuyable = false;
        nudgec.canBeRefunded = () => false;
    }
    {
        choiceNav = theory.createUpgrade(1, currency, new FreeCost);
        choiceNav.description = getLoc('choiceNav');
        choiceNav.info = getLoc('choiceNavInfo');
        choiceNav.boughtOrRefunded = (_) =>
        {
            theory.invalidateSecondaryEquation();
            theory.invalidateTertiaryEquation();
        }
        choiceNav.maxLevel = 0;
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

    theory.createPublicationUpgrade(0, currency, 0);
    /* Extra increments
    Generally used to aid with catching up. Not sure if it's actually effective.
    */
    {
        extraIncPerma = theory.createPermanentUpgrade(4, currency,
        new FreeCost);
        extraIncPerma.description = Localization.getUpgradeUnlockDesc(getLoc(
        'permaIncrement'));
        extraIncPerma.info = Localization.format(getLoc('permaIncrementInfo'),
        Utils.getMath('c'));
        extraIncPerma.bought = (_) => updateAvailability();
        extraIncPerma.maxLevel = 1;
    }

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
    if(reachedFirstPub)
    {
        historyFrame.isVisible = true;
        historyLabel.isVisible = true;
    }
    marathonBadge = theory.achievements[1].isUnlocked;
    incrementc.isAvailable = extraIncPerma.level > 0 &&
    nudgec.level >= 24;
}

var tick = (elapsedTime, multiplier) =>
{
    if(elapsedTime > 0.1)
        log(`Long tick: ${elapsedTime.toFixed(3)}s`);

    nudgec.isAutoBuyable = false;
    incrementc.isAutoBuyable = false;

    for(let i = 0; i < 100; ++i)
    {
        let tmpc = BigInt(choices[choices.length - 1]);

        if((tmpc == 0n || tmpc == 1n || tmpc == -1n || tmpc == -5n ||
        tmpc == -17n) && choices.length > 20)
            break;
        if(tmpc % 2n != 0)
            choices.push((3n * tmpc + 1n).toString());
        else
            choices.push((tmpc / 2n).toString());
    }
    choiceNav.maxLevel = choices.length - 1;
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
                text: getLoc('versionName')/* + getLoc('workInProgress')/* +
                Utils.getMath(getLoc('changeLog'))*/,
                fontSize: 9,
                textColor: Color.TEXT_MEDIUM
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
    let nStr = historyNumMode & 2 ? getShortBinaryString(
    choices[choiceNav.level]) : getShortString(choices[choiceNav.level]);
    let sStr = BigNumber.from(choices[choiceNav.level]).toString(0);

    return Localization.format(getLoc('choice'), nStr, sStr);
};

var getTertiaryEquation = () =>
{
    let mStr = '';
    let cStr = '';
    if(reachedFirstPub)
        mStr = `t=${turns}${choiceNav.level ? `+${choiceNav.level}` : ''}`;
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
        theory.invalidateSecondaryEquation();
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

var getTau = () => currency.value;

var getCurrencyFromTau = (tau) =>
[
    tau.max(BigNumber.ONE),
    currency.symbol
];

// Will not trigger if you press reset.
var prePublish = () =>
{
    tmpRho = currency.value;
    totalIncLevel = nudgec.level - getIncrementPenalty(incrementc.level);
    lastHistory = history;
    lastHistoryLength = Object.keys(lastHistory).length;
}
var postPublish = () =>
{
    currency.value = tmpRho;
    turns = 0;
    time = 0;
    history = {};
    choices = ['0'];

    c = 0n;
    cBigNum = BigNumber.from(c);

    theory.invalidatePrimaryEquation();
    theory.invalidateSecondaryEquation();
    theory.invalidateTertiaryEquation();
    updateAvailability();
}

var alwaysShowRefundButtons = () => true;

var canResetStage = () => true;

var getResetStageMessage = () => getLoc('reset');

var resetStage = () =>
{
    for(let i = 0; i < theory.upgrades.length; ++i)
        theory.upgrades[i].level = 0;

    tmpRho = currency.value;
    theory.clearGraph();
    postPublish();
}

var getInternalState = () => JSON.stringify
({
    version: version,
    turns: turns,
    c: c.toString(),
    choices: choices,
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
    if('c' in state)
    {
        c = BigInt(state.c);
        cBigNum = BigNumber.from(c);
    }
    if('choices' in state)
    {
        choices = state.choices;
        choiceNav.maxLevel = choices.length - 1;
    }
    else
        choices = [c.toString()];

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
