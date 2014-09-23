#!/usr/bin/env node

var usage = [
    'Usage: ./inflector -verb \"<principle, parts>\" -conjugation <num> [-output-config <html_config.json>]',
    '',
    'Example: ./inflector -verb \"amo, amare, amavi, amatus\" -conjugation 1 -deponent n -output-config html_config.json',
    '',
    '-verb "<verb principle parts>"',
    '-conjugation <num>',
    '-deponent <y|n>',
    '-html-output-config <configfile.json>'
].join("\n");

var argv = require('optimist')
    .usage(usage)
    .demand(['verb', 'conjugation'])
    .default('deponent', 'n')
    .default('output-config', '')
    .argv;

var util = require('util');
var jsonfile = require('jsonfile');

var inflections = {};

// =====================================================================================================================
// PRINCIPLE PARTS
// =====================================================================================================================
var principleParts = argv.verb.split(',');

// Trim any spaces
for (var i = 0; i < principleParts.length; i++) {
    principleParts[i] = principleParts[i].trim();
}
console.log(principleParts);

// =====================================================================================================================
// LOAD CONJUGATION INFO
// =====================================================================================================================
var conjugation = jsonfile.readFileSync('./data/conjugation-'+argv.conjugation+'.json');
console.log(conjugation);

var conjugator = {
    endings: {
        active: conjugation.voices.active.principle_parts,
        passive: conjugation.voices.passive.principle_parts
    },
    stems: {
        infinitive: principleParts[1],
        perfect: principleParts[2],
        perf_pass_part: principleParts[3]
    }
};

// =====================================================================================================================
// PROCESS ACTIVE VOICE
// =====================================================================================================================


var infStemRegex = new RegExp(conjugator.endings.active.present_infinitive + '$');
var perfStemRegex = new RegExp(conjugator.endings.active.perfect_indicative + '$');
var perfPassPartStemRegex = new RegExp(conjugator.endings.active.perfect_passive_participle + '$');

var inf_stem = principleParts[1].replace(infStemRegex, '');
var perf_stem = principleParts[2].replace(perfStemRegex, '');
var perf_pass_part_stem = principleParts[3].replace(perfPassPartStemRegex, '');


for (var m in conjugation.voices.active.moods) {
    inflections[m] = {};
    var mood = conjugation.voices.active.moods[m];
    switch(m) {
        default:
            break;
        case 'subjunctive':
        case 'indicative':
            for (var t in mood) {
                if (mood.hasOwnProperty(t)) {
                    inflections[m][t] = { 'sg' : {}, 'pl': {}};
                    var tense = mood[t];
                    if (tense.hasOwnProperty('sg')) {
                        for (var i = 0; i < tense.sg.length; i++) {
                            inflections[m][t].sg[i] = inf_stem + tense.sg[i];
                        }
                    }
                    if (tense.hasOwnProperty('pl')) {
                        for (var i = 0; i < tense.pl.length; i++) {
                            inflections[m][t].pl[i] = inf_stem + tense.pl[i]
                        }
                    }
                }
            }
            break;
        case 'imperative':
            for (var t in mood) {
                var tense = mood[t];
                for (var n in tense) {
                    inflections[m][t] = {'1': {}, '2': {}, '3': {}};
                    var number = tense[n];
                    if (number.hasOwnProperty('sg')) {
                        inflections[m][t][n].sg = inf_stem + number.sg;
                    }
                    if (number.hasOwnProperty('pl')) {
                        inflections[m][t][n].pl = inf_stem + number.pl;
                    }
                }
            }
            break;

    }
}

console.log(util.inspect(inflections, {depth: 8}));