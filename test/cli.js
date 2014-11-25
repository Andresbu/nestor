var buster = require('buster-node'),
  _cli = require('bagofcli'),
  cli = require('../lib/cli'),
  irc = require('../lib/irc'),
  Jenkins = new require('../lib/jenkins'),
  referee = require('referee'),
  text = require('bagoftext'),
  util = require('util'),
  assert = referee.assert;

text.setLocale('en');

buster.testCase('cli - exec', {
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands.build.action);
      assert.defined(actions.commands['build-all'].action);
      assert.defined(actions.commands['build-fail'].action);
      assert.defined(actions.commands.console.action);
      assert.defined(actions.commands.stop.action);
      assert.defined(actions.commands.dashboard.action);
      assert.defined(actions.commands.discover.action);
      assert.defined(actions.commands.executor.action);
      assert.defined(actions.commands.job.action);
      assert.defined(actions.commands.last.action);
      assert.defined(actions.commands['create-job'].action);
      assert.defined(actions.commands['update-job'].action);
      assert.defined(actions.commands['delete-job'].action);
      assert.defined(actions.commands['enable-job'].action);
      assert.defined(actions.commands['disable-job'].action);
      assert.defined(actions.commands['copy-job'].action);
      assert.defined(actions.commands['fetch-job-config'].action);
      assert.defined(actions.commands.queue.action);
      assert.defined(actions.commands.ver.action);
      assert.defined(actions.commands.irc.action);
      assert.defined(actions.commands.feed.action);
      done();
    };
    this.stub(_cli, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - build', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should log job started successfully when exec build is called and job exists': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.build.action('job1');
    });
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'job1');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, undefined);
      cb();
    });
    cli.exec();
  },
  'should log job started successfully when exec build is called with ': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.build.action('job1', 'foo1=bar1&foo2&bar2');
    });
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'job1');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, 'foo1=bar1&foo2&bar2');
      cb();
    });
    cli.exec();
  },
  'should log job not found error when exec build is called and job does not exist': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.build.action('job1');
    });
    this.mockConsole.expects('error').once().withExactArgs('Job not found'.red);
    this.mockProcess.expects('exit').once().withExactArgs(1);
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, undefined);
      cb(new Error('Job not found'));
    });
    cli.exec();
  },
  'should follow build with console command when build is called with console flag': function (done) {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.build.action('job2', 'foo1=bar1&foo2=bar2', { console: true, pending: 1 });
    });
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job2');
      assert.equals(params, 'foo1=bar1&foo2=bar2');
      cb();
    });
    this.stub(Jenkins.prototype, 'console', function (jobName, cb) {
      assert.equals(jobName, 'job2');
      cb();
      // NOTE: done should not be necessary,
      // but somehow Sinon.js does not stub the second method (console) when done is not the test argument
      done();
    });
    cli.exec();
  },
  'should pass error when error occurs after build is called with console flag': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.build.action('job1', { console: true, pending: 1 });
    });
    this.mockConsole.expects('error').once().withExactArgs('Job not found'.red);
    this.mockProcess.expects('exit').once().withExactArgs(1);
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, undefined);
      cb(new Error('Job not found'));
    });
    cli.exec();
  }
});

buster.testCase('cli - build-all', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should log job started successfully when exec build is called and job exists': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['build-all'].action();
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'filteredBuild', function (criteria, cb) {
      assert.isNull(criteria);
      cb();
    });
    cli.exec();
  }
});

buster.testCase('cli - build-fail', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should log job started successfully when exec build is called and job exists': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands['build-fail'].action();
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'filteredBuild', function (criteria, cb) {
      assert.equals(criteria, { status: 'FAIL' });
      cb();
    });
    cli.exec();
  }
});

buster.testCase('cli - console', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.console.action('job1');
    });
  },
  'should pass job name when exec console is called': function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'console', function (jobName, cb) {
      assert.equals(jobName, 'job1');
      cb();
    });
    cli.exec();
  },
  'should log job not found error when exec console is called and job does not exist': function () {
    this.mockConsole.expects('error').once().withExactArgs('Job not found'.red);
    this.mockProcess.expects('exit').once().withExactArgs(1);
    this.stub(Jenkins.prototype, 'console', function (jobName, cb) {
      assert.equals(jobName, 'job1');
      cb(new Error('Job not found'));
    });
    cli.exec();
  }
});

buster.testCase('cli - dashboard', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.dashboard.action();
    });
  },
  'should log jobs status and name when exec dashboard is called and Jenkins result has jobs': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'OK'.green, 'job1');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'UNKNOWN'.grey, 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'dashboard', function (cb) {
      cb(null, [
        { status: 'OK', name: 'job1' },
        { status: 'UNKNOWN', name: 'job2' }
      ]);
    });
    cli.exec();
  },
  'should log no job when exec dashboard is called and Jenkins result has no job': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jobless Jenkins');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'dashboard', function (cb) {
      cb(null, []);
    });
    cli.exec();
  }
});

buster.testCase('cli - discover', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should log version and url when exec discover is called and there is a running Jenkins instance': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.discover.action();
    });
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    cli.exec();
  },
  'should log version and url when exec discover is called with specified host': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.discover.action('somehost', {});
    });
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'somehost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    cli.exec();
  },
  'should log host instead of url when exec discover result does not include any url': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.discover.action();
    });
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'localhost');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    cli.exec();
  }
});

buster.testCase('cli - executor', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.executor.action();
    });
  },
  'should log executor status when exec executor is called and there are some executors': function () {
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'master', '2 active, 1 idle');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job1', 5, '');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', undefined, 33, '');
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'slave', '1 active');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job2', 11, ' stuck!');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'executor', function (cb) {
      cb(null, {
        master: {
          executors: [
            { idle: true },
            { idle: false, name: 'job1', progress: 5 },
            { idle: false, progress: 33 }
          ],
          summary: '2 active, 1 idle'
        },
        slave: {
          executors: [
            { idle: false, stuck: true, name: 'job2' , progress: 11 }
          ],
          summary: '1 active'
        }
      });
    });
    cli.exec();
  },
  'should log no executor found when exec executor is called and there is no executor': function () {
    this.mockConsole.expects('log').once().withExactArgs('No executor found');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'executor', function (cb) {
      cb(null, {});
    });
    cli.exec();
  }
});

// buster.testCase('cli - job', {
//   setUp: function () {
//     this.mockConsole = this.mock(console);
//     this.mockProcess = this.mock(process);
//     this.stub(_cli, 'command', function (base, actions) {
//       actions.commands.job.action('job1');
//     });
//   },
//   'should log job name, status, and reports when job exists': function () {
//     this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'job1', 'OK'.green);
//     this.mockConsole.expects('log').once().withExactArgs(' - %s', 'Coverage 100%');
//     this.mockConsole.expects('log').once().withExactArgs(' - %s', 'All good!');
//     this.mockProcess.expects('exit').once().withExactArgs(0);
//     this.stub(Jenkins.prototype, 'job', function (name, cb) {
//       assert.equals(name, 'job1');
//       cb(null, {
//         status: 'OK',
//         reports: ['Coverage 100%', 'All good!']
//       });
//     });
//     cli.exec();
//   },
//   'should use grey colour when job status is unknown': function () {
//     this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'job1', 'UNKNOWN'.grey);
//     this.mockConsole.expects('log').once().withExactArgs(' - %s', 'Coverage 100%');
//     this.mockConsole.expects('log').once().withExactArgs(' - %s', 'All good!');
//     this.mockProcess.expects('exit').once().withExactArgs(0);
//     this.stub(Jenkins.prototype, 'job', function (name, cb) {
//       cb(null, {
//         status: 'UNKNOWN',
//         reports: ['Coverage 100%', 'All good!']
//       });
//     });
//     cli.exec();
//   },
//   'should log job not found error when job does not exist': function () {
//     this.mockConsole.expects('error').once().withExactArgs('someerror'.red);
//     this.mockProcess.expects('exit').once().withExactArgs(1);
//     this.stub(Jenkins.prototype, 'job', function (name, cb) {
//       assert.equals(name, 'job1');
//       cb(new Error('someerror'));
//     });
//     cli.exec();
//   }
// });

buster.testCase('cli - last', {
    setUp: function () {
        this.mockConsole = this.mock(console);
        this.mockProcess = this.mock(process);
        this.stub(_cli, 'command', function (base, actions) {
            actions.commands.last.action('job1');
        });
    },
    'should log job name, build status and build date when job exists': function () {
        this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'job1', 'SUCCESS'.green);
        this.mockConsole.expects('log').once().withExactArgs(' - %s [%s]', 'My date', 'My distance');
        this.mockProcess.expects('exit').once().withExactArgs(0);
        this.stub(Jenkins.prototype, 'last', function (name, cb) {
            assert.equals(name, 'job1');
            cb(null, {
                buildDate: "My date",
                buildDateDistance: "My distance",
                building: false,
                result: "SUCCESS"
            });
        });
        cli.exec();
    },
    'should log status as BUILDING if job is currently being built': function () {
        this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'job1', 'BUILDING'.yellow);
        this.mockConsole.expects('log').atLeast(1);
        this.mockProcess.expects('exit').once().withExactArgs(0);
        this.stub(Jenkins.prototype, 'last', function (name, cb) {
            assert.equals(name, 'job1');
            cb(null, {
                buildDate: "My date",
                buildDateDistance: "My distance",
                building: true
            });
        });
        cli.exec();
    },
    'should log not found error when build does not exist': function () {
        this.mockConsole.expects('error').once().withExactArgs('someerror'.red);
        this.mockProcess.expects('exit').once().withExactArgs(1);
        this.stub(Jenkins.prototype, 'last', function (name, cb) {
            assert.equals(name, 'job1');
            cb(new Error('someerror'));
        });
        cli.exec();
    }
});

// buster.testCase('cli - queue', {
//   setUp: function () {
//     this.mockConsole = this.mock(console);
//     this.mockProcess = this.mock(process);
//     this.stub(_cli, 'command', function (base, actions) {
//       actions.commands.queue.action();
//     });
//   },
//   'should log queued job names when exec queue is called and there are some queued jobs': function () {
//     this.mockConsole.expects('log').once().withExactArgs('- %s', 'job1');
//     this.mockConsole.expects('log').once().withExactArgs('- %s', 'job2');
//     this.mockProcess.expects('exit').once().withExactArgs(0);
//     this.stub(Jenkins.prototype, 'queue', function (cb) {
//       cb(null, ['job1', 'job2']);
//     });
//     cli.exec();
//   },
//   'should log queue empty message when exec queue is called and there is no queued job': function () {
//     this.mockConsole.expects('log').once().withExactArgs('Queue is empty');
//     this.mockProcess.expects('exit').once().withExactArgs(0);
//     this.stub(Jenkins.prototype, 'queue', function (cb) {
//       cb(null, []);
//     });
//     cli.exec();
//   }
// });

// buster.testCase('cli - ver', {
//   setUp: function () {
//     this.mockConsole = this.mock(console);
//     this.mockProcess = this.mock(process);
//     this.stub(_cli, 'command', function (base, actions) {
//       actions.commands.ver.action();
//     });
//     this.stub(process, 'env', 'en_AU.UTF-8');
//   },
//   'should log version when exec ver is called and version exists': function () {
//     this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3');
//     this.mockProcess.expects('exit').once().withExactArgs(0);
//     this.stub(Jenkins.prototype, 'version', function (cb) {
//       cb(null, '1.2.3');
//     });
//     cli.exec();
//   },
//   'should log error when exec ver is called and version does not exist': function () {
//     this.mockConsole.expects('error').once().withExactArgs('someerror'.red);
//     this.mockProcess.expects('exit').once().withExactArgs(1);
//     this.stub(Jenkins.prototype, 'version', function (cb) {
//       cb(new Error('someerror'));
//     });
//     cli.exec();
//   }
// });

buster.testCase('cli - irc', {
  setUp: function () {
    this.mockIrc = this.mock(irc);
  },
  'should start irc bot with nick option when irc command is called with host, channel, and nick args only': function () {
    this.mockIrc.expects('start').once().withExactArgs('somehost', 'somechannel', 'somenick');
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.irc.action('somehost', 'somechannel', 'somenick');
    });
    cli.exec();
  }
});

buster.testCase('cli - feed', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
  },
  'should log article titles when exec feed is called and articles exist': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.feed.action({ job: 'somejob' });
    });
    this.mockConsole.expects('log').once().withExactArgs('some title 1');
    this.mockConsole.expects('log').once().withExactArgs('some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'feed', function (opts, cb) {
      assert.equals(opts.jobName, 'somejob');
      assert.equals(opts.viewName, undefined);
      cb(null, [{ title: 'some title 1' }, { title: 'some title 2' }]);
    });
    cli.exec();
  },
  'should log nothing when exec feed is called and no article exists': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.feed.action();
    });
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.stub(Jenkins.prototype, 'feed', function (opts, cb) {
      assert.equals(opts.jobName, undefined);
      assert.equals(opts.viewName, undefined);
      cb(null, []);
    });
    cli.exec();
  },
  'should log error when exec feed is called an error occurs': function () {
    this.stub(_cli, 'command', function (base, actions) {
      actions.commands.feed.action({ job: 'somejob' });
    });
    this.mockConsole.expects('error').once().withExactArgs('some error'.red);
    this.mockProcess.expects('exit').once().withExactArgs(1);
    this.stub(Jenkins.prototype, 'feed', function (opts, cb) {
      assert.equals(opts.jobName, 'somejob');
      assert.equals(opts.viewName, undefined);
      cb(new Error('some error'));
    });
    cli.exec();
  }
});
