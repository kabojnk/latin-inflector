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

var inf_stem = principleParts[1];
var perf_stem = principleParts[2];
var perf_pass_part_stem = principleParts[3];

console.dir(conjugator);




