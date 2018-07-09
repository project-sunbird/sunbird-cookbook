#!/usr/bin/env node
'use strict';

const program = require('commander');

/**
 * Program below provides the base commands. Sub-commands are available in their respective index-<base command>.js file.
 */
program
  .version('0.1')
  .command('org [sub-command]', 'Create organisations using data from the provided CSV file')
  .command('user [sub-command]', 'Create users using data from the provided CSV file')
  .parse(process.argv);

