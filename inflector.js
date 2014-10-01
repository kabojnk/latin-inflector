#!/usr/bin/env node

var util = require('util');
var jsonfile = require('jsonfile');

var usage = [
    'Usage: ./inflector --verb \"<principal, parts>\" --conjugation <num> [--deponent] [--translation <values>] [--processor <file.js>] [--out <outfile>]',
    '',
    'Example: ./inflector --verb \"amo, amare, amavi, amatus\" --conjugation 1 --translation "love, loved, loved" --processor \"./processors/html_verb_paradigm.js" --out outfile.html',
    '',
    '--verb "<verb principal parts>"',
    '--conjugation <num>',
    '--deponent',
    '--defective',
    '--processor <processor.js>',
    '--translation <values to use in processor>',
    '--out <outfile>',
    ''
].join("\n");

var argv = require('optimist')
    .usage(usage)
    .demand(['verb', 'conjugation'])
    .boolean('deponent')
    .boolean('defective')
    .default('translation', null)
    .default('out', null)
    .default('processor', null)
    .describe('deponent', 'If specified, conjugates the verb as deponent')
    .describe('defective', 'If specified, conjugates the verb as defective (only "perfect" tense)')
    .describe('translation', 'Translation(s), inflected and comma-separated. Can be freeform—used with processor output')
    .describe('processor', 'A javascript file that contains a function which takes one argument (an object containing all of the inflections')
    .describe('out', 'If specified, write output to a file. If `-processor` is not specified, writes output as JSON')
    .argv;

var inflections = {};

// =====================================================================================================================
// METADATA TO BE ATTACHED
// =====================================================================================================================

inflections.meta = {};

//
// Translation Info
//
if (argv.translation) {
    var translationParts = argv.translation.split(',');

    // Trim any spaces
    translationParts.forEach(function (value, i) {
        translationParts[i] = value.trim();
    });
    inflections.meta.translation = translationParts;
}

inflections.meta.isDeponent = argv.deponent;
inflections.meta.isDefective = argv.defective;

// =====================================================================================================================
// PRINCIPAL PARTS
// =====================================================================================================================
var principalParts = argv.verb.split(',');

// Trim any spaces
principalParts.forEach(function(value, i) {
    principalParts[i] = value.trim();
});

// =====================================================================================================================
// TRANSLATION INFO
// =====================================================================================================================


// =====================================================================================================================
// LOAD CONJUGATION INFO
// =====================================================================================================================
var conjugation = jsonfile.readFileSync('./data/conjugation-'+argv.conjugation+'.json');
//console.log(conjugation);

var conjugator = {
    endings: {
        active: conjugation.voices.active.principal_parts,
        passive: conjugation.voices.passive.principal_parts
    },
    stems: {
        infinitive: principalParts[1],
        perfect: principalParts[2],
        perf_pass_part: principalParts[3]
    }
};

// =====================================================================================================================
// PROCESS VERB
// =====================================================================================================================


var infStemRegex = new RegExp(conjugator.endings.active.present_infinitive + '$');
var perfStemRegex = new RegExp(conjugator.endings.active.perfect_indicative + '$');
var perfPassPartStemRegex = new RegExp(conjugator.endings.active.perfect_passive_participle + '$');

var inf_stem = principalParts[1].replace(infStemRegex, '');
var perf_stem = principalParts[2].replace(perfStemRegex, '');
var perf_pass_part_stem = principalParts[3].replace(perfPassPartStemRegex, '');

for (var v in conjugation.voices) {
    inflections[v] = {};
    voice = conjugation.voices[v];

    //
    // Process Moods
    // ------------------------------------------------------
    for (var m in voice.moods) {
        inflections[v][m] = {};
        var mood = voice.moods[m];
        switch(m) {
            case 'subjunctive':
            case 'indicative':
                for (var t in mood) {
                    if (mood.hasOwnProperty(t)) {
                        inflections[v][m][t] = { 'sg' : {}, 'pl': {}};
                        var tense = mood[t];
                        if (argv.defective &&
                            (t == 'present' || t == 'imperfect' || t == 'future')) {
                            delete inflections[v][m][t];
                            continue;
                        }
                        if (tense.hasOwnProperty('sg')) {
                            for (var i = 0; i < tense.sg.length; i++) {
                                inflections[v][m][t].sg[i] = inf_stem + tense.sg[i];
                            }
                        }
                        if (tense.hasOwnProperty('pl')) {
                            for (var i = 0; i < tense.pl.length; i++) {
                                inflections[v][m][t].pl[i] = inf_stem + tense.pl[i]
                            }
                        }
                    }
                }
                break;
            case 'imperative':
                for (var t in mood) {
                    var tense = mood[t];
                    if (argv.defective &&
                        (t == 'present' || t == 'imperfect' || t == 'future')) {
                        continue;
                    }
                    inflections[v][m][t] = {};
                    for (var n in tense) {
                        inflections[v][m][t][n] = {};
                        var number = tense[n];
                        if (number.hasOwnProperty('sg')) {
                            inflections[v][m][t][n].sg = inf_stem + number.sg;
                        }
                        if (number.hasOwnProperty('pl')) {
                            inflections[v][m][t][n].pl = inf_stem + number.pl;
                        }
                    }
                }
                break;
            default:
                break;
        }
    }

    //
    // Process Infinitives
    // ------------------------------------------------------
    if (voice.hasOwnProperty('infinitive')) {
        inflections[v].infinitive = {};
        for (var t in voice.infinitive) {
            inflections[v].infinitive[t] = inf_stem + voice.infinitive[t];
        }
    }

    //
    // Process Participles
    // ------------------------------------------------------
    if (voice.hasOwnProperty('participle')) {
        inflections[v].participle = {};
        for (var t in voice.participle) {
            inflections[v].participle[t] = inf_stem + voice.participle[t];
        }
    }

    //
    // Process Gerunds
    // ------------------------------------------------------
    if (voice.hasOwnProperty('gerund')) {
        inflections[v].gerund = {};
        for (var c in voice.gerund) {
            inflections[v].gerund[c] = inf_stem + voice.gerund[c];
        }
    }

    //
    // Process Supines
    // ------------------------------------------------------
    if (voice.hasOwnProperty('supine')) {
        inflections[v].supine = {};
        for (var c in voice.supine) {
            inflections[v].supine[c] = inf_stem + voice.supine[c];
        }
    }
}


// Swap voices if deponent
if (argv.deponent) {
    inflections.temp = inflections.passive;
    inflections.passive = inflections.active;
    inflections.active = inflections.temp;
    delete inflections.temp;
}

if (argv.processor) {
    var processor = require(argv.processor);

    if (processor.process) {
        processor.process(inflections);
    }
}
//console.log("DONE");
console.log(util.inspect(inflections, {depth: 8}));